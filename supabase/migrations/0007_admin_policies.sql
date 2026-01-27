-- Ensure RLS is enabled on all tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Orders Policies
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Restaurants can view assigned orders" ON public.orders;
CREATE POLICY "Restaurants can view assigned orders" ON public.orders
  FOR SELECT
  USING (auth.uid() = restaurant_id);

-- Order Items Policies
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
CREATE POLICY "Admins can view all order items" ON public.order_items
  FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.customer_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Restaurants can view assigned order items" ON public.order_items;
CREATE POLICY "Restaurants can view assigned order items" ON public.order_items
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.restaurant_id = auth.uid()
  ));

-- Restaurant Profiles Policies
DROP POLICY IF EXISTS "Public can view restaurants" ON public.restaurant_profiles;
CREATE POLICY "Public can view restaurants" ON public.restaurant_profiles
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Restaurants can update own profile" ON public.restaurant_profiles;
CREATE POLICY "Restaurants can update own profile" ON public.restaurant_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);
  
-- Menu Items Policies
DROP POLICY IF EXISTS "Public can view menu items" ON public.menu_items;
CREATE POLICY "Public can view menu items" ON public.menu_items
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Restaurants can manage own menu" ON public.menu_items;
CREATE POLICY "Restaurants can manage own menu" ON public.menu_items
  FOR ALL
  USING (restaurant_id = auth.uid());
