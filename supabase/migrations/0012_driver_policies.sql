-- Drivers can view assigned orders
DROP POLICY IF EXISTS "Drivers can view assigned orders" ON public.orders;
CREATE POLICY "Drivers can view assigned orders" ON public.orders
  FOR SELECT
  USING (driver_id = auth.uid());

-- Drivers can view available orders (ready/preparing and no driver)
DROP POLICY IF EXISTS "Drivers can view available orders" ON public.orders;
CREATE POLICY "Drivers can view available orders" ON public.orders
  FOR SELECT
  USING (driver_id IS NULL AND status IN ('preparing', 'ready_for_pickup'));

-- Drivers can update orders assigned to them (to change status)
DROP POLICY IF EXISTS "Drivers can update assigned orders" ON public.orders;
CREATE POLICY "Drivers can update assigned orders" ON public.orders
  FOR UPDATE
  USING (driver_id = auth.uid());

-- Drivers can accept available orders
DROP POLICY IF EXISTS "Drivers can accept available orders" ON public.orders;
CREATE POLICY "Drivers can accept available orders" ON public.orders
  FOR UPDATE
  USING (driver_id IS NULL AND status IN ('preparing', 'ready_for_pickup'))
  WITH CHECK (driver_id = auth.uid());
