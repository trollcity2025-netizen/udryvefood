-- Add columns to restaurant_profiles
ALTER TABLE public.restaurant_profiles ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.restaurant_profiles ADD COLUMN IF NOT EXISTS cuisine_type text;
ALTER TABLE public.restaurant_profiles ADD COLUMN IF NOT EXISTS phone_number text;

-- Create reviews table
DROP TABLE IF EXISTS public.reviews CASCADE;
CREATE TABLE public.reviews (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id),
  customer_id uuid REFERENCES public.users(id) NOT NULL,
  restaurant_id uuid REFERENCES public.restaurant_profiles(user_id) NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies for reviews
-- Public/Everyone can read reviews
CREATE POLICY "Reviews are public" ON public.reviews FOR SELECT USING (true);

-- Customers can create reviews for their own orders
CREATE POLICY "Customers can create reviews" ON public.reviews FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

-- Admins can delete reviews
CREATE POLICY "Admins can delete reviews" ON public.reviews FOR DELETE 
USING (public.is_admin());
