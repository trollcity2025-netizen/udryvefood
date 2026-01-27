
-- 5. FAVORITES & CATEGORIES (0005_favorites_categories.sql)

-- Add category to menu_items
ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS category text;

-- Create favorite_restaurants table
CREATE TABLE IF NOT EXISTS public.favorite_restaurants (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  restaurant_id uuid REFERENCES public.restaurant_profiles(user_id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, restaurant_id)
);

-- RLS for Favorites
ALTER TABLE public.favorite_restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorite_restaurants;
CREATE POLICY "Users can view own favorites" ON public.favorite_restaurants
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add favorites" ON public.favorite_restaurants;
CREATE POLICY "Users can add favorites" ON public.favorite_restaurants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove favorites" ON public.favorite_restaurants;
CREATE POLICY "Users can remove favorites" ON public.favorite_restaurants
  FOR DELETE USING (auth.uid() = user_id);

-- Update seed function to include categories
CREATE OR REPLACE FUNCTION public.seed_sample_menu()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  curr_user_id uuid;
BEGIN
  curr_user_id := auth.uid();
  
  IF curr_user_id IS NULL THEN
    RAISE EXCEPTION 'Not logged in';
  END IF;

  -- Ensure profile exists
  INSERT INTO public.restaurant_profiles (user_id, restaurant_name, address, image_url)
  VALUES (curr_user_id, 'My Demo Restaurant', '123 Food St', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80')
  ON CONFLICT (user_id) DO UPDATE SET restaurant_name = 'My Demo Restaurant';

  -- Insert Menu Items with Categories
  INSERT INTO public.menu_items (restaurant_id, name, description, price, image_url, category)
  VALUES 
    (curr_user_id, 'Classic Burger', 'Juicy beef patty with cheese and lettuce', 12.99, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', 'Burgers'),
    (curr_user_id, 'Pepperoni Pizza', 'Classic pepperoni with mozzarella', 15.50, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80', 'Pizza'),
    (curr_user_id, 'Caesar Salad', 'Fresh romaine with parmesan and croutons', 9.99, 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=800&q=80', 'Salads');

END;
$$;
