-- Create Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    order_id UUID REFERENCES public.orders(id),
    customer_id UUID REFERENCES public.auth.users(id),
    restaurant_id UUID REFERENCES public.restaurant_profiles(user_id),
    driver_id UUID REFERENCES public.driver_profiles(user_id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    type TEXT CHECK (type IN ('restaurant', 'driver')) DEFAULT 'restaurant'
);

-- Create Messages Table for Chat
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sender_id UUID REFERENCES public.auth.users(id),
    receiver_id UUID REFERENCES public.auth.users(id),
    order_id UUID REFERENCES public.orders(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE
);

-- Handle potential column rename if table existed with old name
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'recipient_id') THEN
        ALTER TABLE public.messages RENAME COLUMN recipient_id TO receiver_id;
    END IF;
END $$;

-- Create Payouts Table
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES public.auth.users(id),
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    method TEXT,
    reference_id TEXT
);

-- Ensure Payouts columns exist (if table existed previously)
ALTER TABLE public.payouts 
ADD COLUMN IF NOT EXISTS method TEXT,
ADD COLUMN IF NOT EXISTS reference_id TEXT;

-- Add Balance columns to Profiles if they don't exist
ALTER TABLE public.driver_profiles 
ADD COLUMN IF NOT EXISTS current_balance DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS payout_frozen BOOLEAN DEFAULT FALSE;

ALTER TABLE public.restaurant_profiles 
ADD COLUMN IF NOT EXISTS current_balance DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS payout_frozen BOOLEAN DEFAULT FALSE;

-- RLS Policies (Idempotent)

-- Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
    CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
    CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);
END $$;

-- Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
    CREATE POLICY "Users can view their own messages" ON public.messages FOR SELECT 
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

    DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
    CREATE POLICY "Users can send messages" ON public.messages FOR INSERT 
    WITH CHECK (auth.uid() = sender_id);
END $$;

-- Payouts
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own payouts" ON public.payouts;
    CREATE POLICY "Users can view their own payouts" ON public.payouts FOR SELECT 
    USING (auth.uid() = user_id);
END $$;
