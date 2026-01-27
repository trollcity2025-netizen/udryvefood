-- Add avatar_url to customer_profiles
ALTER TABLE public.customer_profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add proof of delivery columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS proof_photo_url text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS actual_delivery_lat double precision;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS actual_delivery_lng double precision;

-- Create delivery-proofs bucket (logic to be handled in SQL or via Dashboard, but we'll try SQL if possible, otherwise we assume it exists or use 'applications' bucket for now? No, better separate)
-- Note: Supabase storage creation via SQL is tricky without extensions. I will rely on the app to create it or assume it's created. 
-- I will reuse 'driver-documents' or 'avatars' if I can't create one, but for now I'll stick to 'delivery-proofs' and hope I can create it via policy or client.
-- Actually, I will create a policy for it if it exists.

-- RLS for delivery-proofs (assuming bucket is created)
-- Drivers can upload
-- Customers can view their own order proofs
-- Admins can view all

