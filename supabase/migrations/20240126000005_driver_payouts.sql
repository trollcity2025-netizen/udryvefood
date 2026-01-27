-- Add current_balance to driver_profiles
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS current_balance decimal(10,2) DEFAULT 0;

-- Update payouts table to support instant/weekly and fees
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS fee decimal(10,2) DEFAULT 0;
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS payout_type text CHECK (payout_type IN ('instant', 'weekly'));
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS processed_at timestamp with time zone;

-- Create balance_ledger table for audit trail
CREATE TABLE IF NOT EXISTS public.balance_ledger (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) NOT NULL,
    amount decimal(10,2) NOT NULL,
    transaction_type text NOT NULL CHECK (transaction_type IN ('earning', 'payout', 'fee', 'adjustment')),
    reference_id uuid, -- Can be order_id or payout_id
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Ledger
ALTER TABLE public.balance_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own ledger" ON public.balance_ledger;
CREATE POLICY "Users can view own ledger" ON public.balance_ledger FOR SELECT USING (auth.uid() = user_id);

-- RLS for Payouts
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own payouts" ON public.payouts;
CREATE POLICY "Users can view own payouts" ON public.payouts FOR SELECT USING (auth.uid() = user_id);

-- Function to accrue earnings when order is delivered
CREATE OR REPLACE FUNCTION public.accrue_driver_earnings()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') AND COALESCE(NEW.payout_hold, false) = false THEN
        UPDATE public.driver_profiles
        SET current_balance = current_balance + NEW.driver_payout
        WHERE user_id = NEW.driver_id;
        INSERT INTO public.balance_ledger (user_id, amount, transaction_type, reference_id, description)
        VALUES (NEW.driver_id, NEW.driver_payout, 'earning', NEW.id, 'Order delivery earnings');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for earnings accrual
DROP TRIGGER IF EXISTS trigger_accrue_earnings ON public.orders;
CREATE TRIGGER trigger_accrue_earnings
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.accrue_driver_earnings();


-- Function to request payout
CREATE OR REPLACE FUNCTION public.request_driver_payout(p_amount decimal, p_is_instant boolean)
RETURNS json AS $$
DECLARE
    v_driver_id uuid;
    v_current_balance decimal;
    v_fee decimal := 0;
    v_payout_type text;
    v_free_payouts_used int;
    v_payout_id uuid;
    v_payout_frozen boolean;
BEGIN
    v_driver_id := auth.uid();
    
    SELECT payout_frozen INTO v_payout_frozen FROM public.driver_profiles WHERE user_id = v_driver_id;
    IF COALESCE(v_payout_frozen, false) THEN
        RAISE EXCEPTION 'Payouts are currently frozen for this driver';
    END IF;

    SELECT current_balance INTO v_current_balance FROM public.driver_profiles WHERE user_id = v_driver_id;
    
    IF v_current_balance IS NULL THEN
        v_current_balance := 0;
    END IF;

    -- Determine Type and Fee
    IF p_is_instant THEN
        v_payout_type := 'instant';
        
        -- Check if minimum balance is met ($10)
        IF v_current_balance < 10 THEN
             RAISE EXCEPTION 'Minimum balance for instant cash-out is $10.00';
        END IF;

        -- Check free payout usage this week
        SELECT count(*) INTO v_free_payouts_used
        FROM public.payouts
        WHERE user_id = v_driver_id 
          AND payout_type = 'instant'
          AND fee = 0
          AND created_at >= date_trunc('week', now());

        IF v_free_payouts_used < 1 THEN
            v_fee := 0; -- Free
        ELSE
            v_fee := 2.00;
        END IF;
    ELSE
        v_payout_type := 'weekly';
        v_fee := 0;
    END IF;

    -- Check sufficiency
    IF v_current_balance < (p_amount + v_fee) THEN
        RAISE EXCEPTION 'Insufficient balance to cover amount and fee';
    END IF;

    -- Deduct Balance
    UPDATE public.driver_profiles
    SET current_balance = current_balance - (p_amount + v_fee)
    WHERE user_id = v_driver_id;

    -- Create Payout Record
    INSERT INTO public.payouts (user_id, amount, fee, payout_type, status)
    VALUES (v_driver_id, p_amount, v_fee, v_payout_type, 'pending')
    RETURNING id INTO v_payout_id;

    -- Create Ledger Entries
    -- 1. Payout Debit
    INSERT INTO public.balance_ledger (user_id, amount, transaction_type, reference_id, description)
    VALUES (v_driver_id, -p_amount, 'payout', v_payout_id, 'Cash out request (' || v_payout_type || ')');

    -- 2. Fee Debit (if any)
    IF v_fee > 0 THEN
        INSERT INTO public.balance_ledger (user_id, amount, transaction_type, reference_id, description)
        VALUES (v_driver_id, -v_fee, 'fee', v_payout_id, 'Instant cash-out fee');
    END IF;

    RETURN json_build_object(
        'success', true,
        'payout_id', v_payout_id,
        'fee', v_fee,
        'new_balance', v_current_balance - (p_amount + v_fee)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
