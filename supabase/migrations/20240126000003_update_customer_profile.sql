-- Add full_name to customer_profiles
ALTER TABLE public.customer_profiles ADD COLUMN IF NOT EXISTS full_name text;

-- Enable RLS
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.customer_profiles;
CREATE POLICY "Users can view own profile" ON public.customer_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.customer_profiles;
CREATE POLICY "Users can update own profile" ON public.customer_profiles
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.customer_profiles;
CREATE POLICY "Users can insert own profile" ON public.customer_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);
