
-- 0004_enhancements.sql

-- 1. Enhance User Status
-- We can't easily alter enums in a transaction block in some tools, but standard PG allows it.
-- If this fails in the combined script, we might need to recreate the type.
-- For now, let's assume we can just add columns and maybe use text check constraint if enum is hard to change.
-- Or just add the value.
ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'frozen';

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS freeze_reason text,
ADD COLUMN IF NOT EXISTS disable_reason text;

-- 2. Messages System
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id uuid REFERENCES public.users(id) NOT NULL,
    receiver_id uuid REFERENCES public.users(id) NOT NULL,
    order_id uuid REFERENCES public.orders(id), -- Optional: link to an order
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
CREATE POLICY "Users can view their own messages" ON public.messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 3. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id uuid REFERENCES public.users(id) NOT NULL,
    action text NOT NULL, -- e.g., 'disable_user', 'refund_order'
    target_id uuid, -- ID of the user/order being affected
    details jsonb, -- Extra details (reasons, amounts)
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- 4. Payouts (Enhancement)
-- Ensure payouts table exists (it was in combined setup but let's make sure policies are there)
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payouts" ON public.payouts;
CREATE POLICY "Users can view own payouts" ON public.payouts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all payouts" ON public.payouts;
CREATE POLICY "Admins can view all payouts" ON public.payouts
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- 5. Admin Functions for User Management
CREATE OR REPLACE FUNCTION public.admin_update_user_status(
    target_user_id uuid,
    new_status user_status,
    reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if executor is admin
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    UPDATE public.users
    SET 
        status = new_status,
        freeze_reason = CASE WHEN new_status = 'frozen' THEN reason ELSE freeze_reason END,
        disable_reason = CASE WHEN new_status = 'disabled' THEN reason ELSE disable_reason END
    WHERE id = target_user_id;

    -- Log action
    INSERT INTO public.audit_logs (admin_id, action, target_id, details)
    VALUES (auth.uid(), 'update_user_status', target_user_id, jsonb_build_object('status', new_status, 'reason', reason));
END;
$$;
