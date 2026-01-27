-- Add revenue model columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS food_subtotal decimal(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee decimal(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS service_fee decimal(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tips decimal(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax decimal(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS driver_bonus decimal(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS restaurant_payout decimal(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS driver_payout decimal(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS platform_revenue decimal(10,2) DEFAULT 0;

-- Function to calculate revenue splits on order insertion
CREATE OR REPLACE FUNCTION public.calculate_order_revenue()
RETURNS TRIGGER AS $$
DECLARE
    is_weekend boolean;
    bonus_amount decimal(10,2);
    rest_share decimal(10,2);
    driver_base decimal(10,2);
    platform_base decimal(10,2);
BEGIN
    -- 1. Determine Driver Bonus
    -- Dow: 0=Sun, 6=Sat, 5=Fri
    IF EXTRACT(DOW FROM NEW.created_at) IN (0, 5, 6) THEN
        bonus_amount := 1.00;
    ELSE
        bonus_amount := 0.50;
    END IF;

    -- 2. Calculate Splits of Food Subtotal
    rest_share := NEW.food_subtotal * 0.70;
    driver_base := NEW.food_subtotal * 0.20;
    platform_base := NEW.food_subtotal * 0.10;

    -- 3. Set Calculated Fields
    NEW.driver_bonus := bonus_amount;
    NEW.restaurant_payout := rest_share;
    
    -- Driver Payout = Base (20%) + Delivery Fee (100%) + Tips (100%) + Bonus
    NEW.driver_payout := driver_base + NEW.delivery_fee + NEW.tips + bonus_amount;
    
    -- Platform Revenue = Base (10%) + Service Fee (100%) - Bonus
    NEW.platform_revenue := platform_base + NEW.service_fee - bonus_amount;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run before insert
DROP TRIGGER IF EXISTS trigger_calculate_revenue ON public.orders;
CREATE TRIGGER trigger_calculate_revenue
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_order_revenue();
