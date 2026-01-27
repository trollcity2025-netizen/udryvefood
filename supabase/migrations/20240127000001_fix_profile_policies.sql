-- Enable RLS on driver_profiles
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;

-- Driver Policies
DROP POLICY IF EXISTS "Drivers can view own profile" ON public.driver_profiles;
CREATE POLICY "Drivers can view own profile" ON public.driver_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Drivers can update own profile" ON public.driver_profiles;
CREATE POLICY "Drivers can update own profile" ON public.driver_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Drivers can insert own profile" ON public.driver_profiles;
CREATE POLICY "Drivers can insert own profile" ON public.driver_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Restaurant Insert Policy (missing from 0007)
DROP POLICY IF EXISTS "Restaurants can insert own profile" ON public.restaurant_profiles;
CREATE POLICY "Restaurants can insert own profile" ON public.restaurant_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
