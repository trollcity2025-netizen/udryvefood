-- Driver Applications
CREATE TABLE IF NOT EXISTS public.driver_applications (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    legal_name text,
    phone text,
    email text, -- Contact email
    dob date,
    address text,
    driver_license_number text,
    driver_license_expiration date,
    license_state text,
    vehicle_make text,
    vehicle_model text,
    vehicle_year text,
    vehicle_color text,
    vehicle_plate text,
    insurance_provider text,
    insurance_policy_number text,
    insurance_expiration date,
    background_check_consent boolean DEFAULT false,
    id_front_url text,
    id_back_url text,
    profile_photo_url text,
    payout_email text,
    emergency_contact_name text,
    emergency_contact_phone text,
    status user_status DEFAULT 'draft',
    admin_notes text,
    rejection_reason text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    submitted_at timestamptz,
    reviewed_at timestamptz,
    reviewed_by uuid REFERENCES public.users(id)
);

-- Restaurant Applications
CREATE TABLE IF NOT EXISTS public.restaurant_applications (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    restaurant_name text,
    owner_name text,
    phone text,
    email text,
    address text,
    business_license_url text,
    food_handler_permit_url text,
    payout_email text,
    operating_hours text,
    cuisine_categories text[],
    logo_url text,
    cover_photo_url text,
    is_menu_ready boolean DEFAULT false,
    menu_notes text,
    status user_status DEFAULT 'draft',
    admin_notes text,
    rejection_reason text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    submitted_at timestamptz,
    reviewed_at timestamptz,
    reviewed_by uuid REFERENCES public.users(id)
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.application_audit_logs (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    application_type text CHECK (application_type IN ('driver', 'restaurant')),
    application_id uuid NOT NULL,
    actor_id uuid REFERENCES public.users(id),
    old_status user_status,
    new_status user_status,
    reason text,
    created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.driver_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for Driver Applications
DROP POLICY IF EXISTS "Drivers can view own application" ON public.driver_applications;
CREATE POLICY "Drivers can view own application" ON public.driver_applications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Drivers can insert own application" ON public.driver_applications;
CREATE POLICY "Drivers can insert own application" ON public.driver_applications FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Drivers can update own application" ON public.driver_applications;
CREATE POLICY "Drivers can update own application" ON public.driver_applications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all driver applications" ON public.driver_applications;
CREATE POLICY "Admins can view all driver applications" ON public.driver_applications FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all driver applications" ON public.driver_applications;
CREATE POLICY "Admins can update all driver applications" ON public.driver_applications FOR UPDATE USING (public.is_admin());

-- Policies for Restaurant Applications
DROP POLICY IF EXISTS "Restaurants can view own application" ON public.restaurant_applications;
CREATE POLICY "Restaurants can view own application" ON public.restaurant_applications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Restaurants can insert own application" ON public.restaurant_applications;
CREATE POLICY "Restaurants can insert own application" ON public.restaurant_applications FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Restaurants can update own application" ON public.restaurant_applications;
CREATE POLICY "Restaurants can update own application" ON public.restaurant_applications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all restaurant applications" ON public.restaurant_applications;
CREATE POLICY "Admins can view all restaurant applications" ON public.restaurant_applications FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all restaurant applications" ON public.restaurant_applications;
CREATE POLICY "Admins can update all restaurant applications" ON public.restaurant_applications FOR UPDATE USING (public.is_admin());

-- Policies for Audit Logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.application_audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.application_audit_logs FOR SELECT USING (public.is_admin());
