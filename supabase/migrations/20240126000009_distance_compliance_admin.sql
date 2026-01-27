-- Distance-based delivery fee fields on orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_distance_miles double precision;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_distance_miles_rounded double precision;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS distance_fee decimal(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS base_delivery_fee decimal(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee decimal(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS route_polyline text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS route_provider text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS route_calculated_at timestamp with time zone;

-- Payout hold fields on orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payout_hold boolean DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payout_hold_reason text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payout_hold_by_admin_id uuid REFERENCES public.users(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payout_hold_at timestamp with time zone;

-- Driver freeze controls
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS payout_frozen boolean DEFAULT false;
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS account_frozen boolean DEFAULT false;
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS freeze_reason text;
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS frozen_by_admin_id uuid REFERENCES public.users(id);
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS frozen_at timestamp with time zone;

-- Route bypass reports
CREATE TABLE IF NOT EXISTS public.route_bypass_reports (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  driver_id uuid REFERENCES public.driver_profiles(user_id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL CHECK (reason IN ('traffic','road_block','accident','police','closed_road','safety_issue','other')),
  notes text,
  media_url text,
  lat double precision,
  lng double precision,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','approved','rejected'))
);

-- Order route events
CREATE TABLE IF NOT EXISTS public.order_route_events (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  driver_id uuid REFERENCES public.driver_profiles(user_id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('off_route','on_route','bypass_submitted')),
  meta_json jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Refunds
CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  amount decimal(10,2) NOT NULL,
  reason text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','processed','failed')),
  processor_ref text,
  created_by_admin_id uuid REFERENCES public.users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  actor_admin_id uuid REFERENCES public.users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  reason text,
  meta_json jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.route_bypass_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_route_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for route_bypass_reports
DROP POLICY IF EXISTS "Drivers can insert own bypass reports" ON public.route_bypass_reports;
CREATE POLICY "Drivers can insert own bypass reports" ON public.route_bypass_reports
  FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

DROP POLICY IF EXISTS "Drivers can view own bypass reports" ON public.route_bypass_reports;
CREATE POLICY "Drivers can view own bypass reports" ON public.route_bypass_reports
  FOR SELECT
  USING (auth.uid() = driver_id);

DROP POLICY IF EXISTS "Admins can view all bypass reports" ON public.route_bypass_reports;
CREATE POLICY "Admins can view all bypass reports" ON public.route_bypass_reports
  FOR SELECT
  USING (public.is_admin());

-- Policies for order_route_events
DROP POLICY IF EXISTS "Drivers can view own route events" ON public.order_route_events;
CREATE POLICY "Drivers can view own route events" ON public.order_route_events
  FOR SELECT
  USING (auth.uid() = driver_id);

DROP POLICY IF EXISTS "Admins can view all route events" ON public.order_route_events;
CREATE POLICY "Admins can view all route events" ON public.order_route_events
  FOR SELECT
  USING (public.is_admin());

-- Policies for refunds (admins only)
DROP POLICY IF EXISTS "Admins can manage refunds" ON public.refunds;
CREATE POLICY "Admins can manage refunds" ON public.refunds
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Policies for audit_logs (admins only select/insert)
DROP POLICY IF EXISTS "Admins manage audit logs" ON public.audit_logs;
CREATE POLICY "Admins manage audit logs" ON public.audit_logs
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admin functions
CREATE OR REPLACE FUNCTION public.admin_hold_payout(p_order_id uuid, p_reason text)
RETURNS void AS $$
DECLARE v_admin_id uuid;
BEGIN
  v_admin_id := auth.uid();
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.orders
  SET payout_hold = true,
      payout_hold_reason = p_reason,
      payout_hold_by_admin_id = v_admin_id,
      payout_hold_at = timezone('utc', now())
  WHERE id = p_order_id;
  INSERT INTO public.audit_logs (actor_admin_id, action, entity_type, entity_id, reason)
  VALUES (v_admin_id, 'hold_payout', 'order', p_order_id, p_reason);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_release_payout_hold(p_order_id uuid)
RETURNS void AS $$
DECLARE v_admin_id uuid;
BEGIN
  v_admin_id := auth.uid();
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.orders
  SET payout_hold = false,
      payout_hold_reason = NULL,
      payout_hold_by_admin_id = NULL,
      payout_hold_at = NULL
  WHERE id = p_order_id;
  INSERT INTO public.audit_logs (actor_admin_id, action, entity_type, entity_id)
  VALUES (v_admin_id, 'release_payout_hold', 'order', p_order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_freeze_driver_payout(p_driver_id uuid, p_reason text)
RETURNS void AS $$
DECLARE v_admin_id uuid;
BEGIN
  v_admin_id := auth.uid();
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.driver_profiles
  SET payout_frozen = true,
      freeze_reason = p_reason,
      frozen_by_admin_id = v_admin_id,
      frozen_at = timezone('utc', now())
  WHERE user_id = p_driver_id;
  INSERT INTO public.audit_logs (actor_admin_id, action, entity_type, entity_id, reason)
  VALUES (v_admin_id, 'freeze_driver_payout', 'driver', p_driver_id, p_reason);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_unfreeze_driver_payout(p_driver_id uuid)
RETURNS void AS $$
DECLARE v_admin_id uuid;
BEGIN
  v_admin_id := auth.uid();
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.driver_profiles
  SET payout_frozen = false
  WHERE user_id = p_driver_id;
  INSERT INTO public.audit_logs (actor_admin_id, action, entity_type, entity_id)
  VALUES (v_admin_id, 'unfreeze_driver_payout', 'driver', p_driver_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_freeze_driver_account(p_driver_id uuid, p_reason text)
RETURNS void AS $$
DECLARE v_admin_id uuid;
BEGIN
  v_admin_id := auth.uid();
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.driver_profiles
  SET account_frozen = true,
      freeze_reason = p_reason,
      frozen_by_admin_id = v_admin_id,
      frozen_at = timezone('utc', now())
  WHERE user_id = p_driver_id;
  INSERT INTO public.audit_logs (actor_admin_id, action, entity_type, entity_id, reason)
  VALUES (v_admin_id, 'freeze_driver_account', 'driver', p_driver_id, p_reason);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_unfreeze_driver_account(p_driver_id uuid)
RETURNS void AS $$
DECLARE v_admin_id uuid;
BEGIN
  v_admin_id := auth.uid();
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.driver_profiles
  SET account_frozen = false
  WHERE user_id = p_driver_id;
  INSERT INTO public.audit_logs (actor_admin_id, action, entity_type, entity_id)
  VALUES (v_admin_id, 'unfreeze_driver_account', 'driver', p_driver_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_refund_order(p_order_id uuid, p_amount decimal, p_reason text, p_processor_ref text)
RETURNS void AS $$
DECLARE v_admin_id uuid;
BEGIN
  v_admin_id := auth.uid();
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  INSERT INTO public.refunds (order_id, amount, reason, status, processor_ref, created_by_admin_id)
  VALUES (p_order_id, p_amount, p_reason, 'pending', p_processor_ref, v_admin_id);
  INSERT INTO public.audit_logs (actor_admin_id, action, entity_type, entity_id, reason, meta_json)
  VALUES (v_admin_id, 'refund_order', 'order', p_order_id, p_reason, jsonb_build_object('amount', p_amount, 'processor_ref', p_processor_ref));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

