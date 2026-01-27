
-- Enable pgcrypto for password hashing if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 0. SCHEMA CORRECTION (Safety net for inconsistent DB states)
-- Ensure menu_items references restaurant_profiles, not "restaurants"
DO $$
BEGIN
    -- Check if the constraint exists and might be pointing to the wrong table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_items') THEN
        ALTER TABLE public.menu_items DROP CONSTRAINT IF EXISTS menu_items_restaurant_id_fkey;
        ALTER TABLE public.menu_items ADD CONSTRAINT menu_items_restaurant_id_fkey 
            FOREIGN KEY (restaurant_id) REFERENCES public.restaurant_profiles(user_id) ON DELETE CASCADE;
    END IF;

    -- Ensure orders references restaurant_profiles
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_restaurant_id_fkey;
        ALTER TABLE public.orders ADD CONSTRAINT orders_restaurant_id_fkey 
            FOREIGN KEY (restaurant_id) REFERENCES public.restaurant_profiles(user_id) ON DELETE CASCADE;
            
        -- Ensure delivery coordinates exist (fixing 42703 error)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_lat') THEN
            ALTER TABLE public.orders ADD COLUMN delivery_lat double precision;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_lng') THEN
            ALTER TABLE public.orders ADD COLUMN delivery_lng double precision;
        END IF;
    END IF;
END $$;

-- MAIN SEED LOGIC
DO $$
DECLARE
    -- User IDs
    v_admin_id uuid;
    v_restaurant_1_id uuid;
    v_restaurant_2_id uuid;
    v_driver_1_id uuid;
    v_customer_1_id uuid;
    
    -- IDs for related tables
    v_menu_item_1_id uuid;
    v_order_id uuid;
    
    -- Password hash (password123)
    v_password_hash text := crypt('password123', gen_salt('bf'));
BEGIN

    ---------------------------------------------------------------------------
    -- 1. USERS (auth.users and public.users)
    ---------------------------------------------------------------------------
    
    -- ADMIN
    SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@udryve.com';
    IF v_admin_id IS NULL THEN
        v_admin_id := gen_random_uuid();
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, role, aud)
        VALUES (v_admin_id, 'admin@udryve.com', v_password_hash, now(), '{"provider":"email","providers":["email"]}', '{"role":"admin","full_name":"Admin User"}', 'authenticated', 'authenticated');
    END IF;
    -- Ensure public.users record
    INSERT INTO public.users (id, email, role, status)
    VALUES (v_admin_id, 'admin@udryve.com', 'admin', 'active')
    ON CONFLICT (id) DO UPDATE SET role = 'admin', status = 'active';

    -- RESTAURANT 1: Burger King (Demo)
    SELECT id INTO v_restaurant_1_id FROM auth.users WHERE email = 'burger@demo.com';
    IF v_restaurant_1_id IS NULL THEN
        v_restaurant_1_id := gen_random_uuid();
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, role, aud)
        VALUES (v_restaurant_1_id, 'burger@demo.com', v_password_hash, now(), '{"provider":"email","providers":["email"]}', '{"role":"restaurant","full_name":"Burger King"}', 'authenticated', 'authenticated');
    END IF;
    INSERT INTO public.users (id, email, role, status)
    VALUES (v_restaurant_1_id, 'burger@demo.com', 'restaurant', 'active')
    ON CONFLICT (id) DO NOTHING;

    -- RESTAURANT 2: Sushi Master (Demo)
    SELECT id INTO v_restaurant_2_id FROM auth.users WHERE email = 'sushi@demo.com';
    IF v_restaurant_2_id IS NULL THEN
        v_restaurant_2_id := gen_random_uuid();
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, role, aud)
        VALUES (v_restaurant_2_id, 'sushi@demo.com', v_password_hash, now(), '{"provider":"email","providers":["email"]}', '{"role":"restaurant","full_name":"Sushi Master"}', 'authenticated', 'authenticated');
    END IF;
    INSERT INTO public.users (id, email, role, status)
    VALUES (v_restaurant_2_id, 'sushi@demo.com', 'restaurant', 'active')
    ON CONFLICT (id) DO NOTHING;

    -- DRIVER 1
    SELECT id INTO v_driver_1_id FROM auth.users WHERE email = 'driver@demo.com';
    IF v_driver_1_id IS NULL THEN
        v_driver_1_id := gen_random_uuid();
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, role, aud)
        VALUES (v_driver_1_id, 'driver@demo.com', v_password_hash, now(), '{"provider":"email","providers":["email"]}', '{"role":"driver","full_name":"John Driver"}', 'authenticated', 'authenticated');
    END IF;
    INSERT INTO public.users (id, email, role, status)
    VALUES (v_driver_1_id, 'driver@demo.com', 'driver', 'active')
    ON CONFLICT (id) DO NOTHING;

    -- CUSTOMER 1
    SELECT id INTO v_customer_1_id FROM auth.users WHERE email = 'customer@demo.com';
    IF v_customer_1_id IS NULL THEN
        v_customer_1_id := gen_random_uuid();
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, role, aud)
        VALUES (v_customer_1_id, 'customer@demo.com', v_password_hash, now(), '{"provider":"email","providers":["email"]}', '{"role":"customer","full_name":"Alice Customer"}', 'authenticated', 'authenticated');
    END IF;
    INSERT INTO public.users (id, email, role, status)
    VALUES (v_customer_1_id, 'customer@demo.com', 'customer', 'active')
    ON CONFLICT (id) DO NOTHING;

    ---------------------------------------------------------------------------
    -- 2. PROFILES
    ---------------------------------------------------------------------------

    -- Restaurant Profiles
    INSERT INTO public.restaurant_profiles (user_id, restaurant_name, address, image_url, is_open)
    VALUES 
        (v_restaurant_1_id, 'Burger King (Demo)', '123 Fake Street, Food City', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80', true)
    ON CONFLICT (user_id) DO UPDATE SET 
        restaurant_name = EXCLUDED.restaurant_name,
        address = EXCLUDED.address,
        is_open = EXCLUDED.is_open;

    INSERT INTO public.restaurant_profiles (user_id, restaurant_name, address, image_url, is_open)
    VALUES 
        (v_restaurant_2_id, 'Sushi Master (Demo)', '456 Sashimi Lane, Ocean Town', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80', true)
    ON CONFLICT (user_id) DO UPDATE SET 
        restaurant_name = EXCLUDED.restaurant_name,
        address = EXCLUDED.address,
        is_open = EXCLUDED.is_open;

    -- Driver Profile
    INSERT INTO public.driver_profiles (user_id, vehicle_type, vehicle_plate, is_online)
    VALUES (v_driver_1_id, 'Car', 'XYZ-123', true)
    ON CONFLICT (user_id) DO UPDATE SET vehicle_type = EXCLUDED.vehicle_type;

    -- Customer Profile
    INSERT INTO public.customer_profiles (user_id, phone, default_address)
    VALUES (v_customer_1_id, '555-0100', '789 Home St')
    ON CONFLICT (user_id) DO UPDATE SET phone = EXCLUDED.phone;

    ---------------------------------------------------------------------------
    -- 3. MENU ITEMS
    ---------------------------------------------------------------------------

    -- Burger King Items
    -- Item 1: Classic Burger
    -- Use UPDATE logic or DELETE/INSERT if no unique key. Here we check existence first to be safe and idempotent.
    SELECT id INTO v_menu_item_1_id FROM public.menu_items WHERE restaurant_id = v_restaurant_1_id AND name = 'Classic Burger' LIMIT 1;
    
    IF v_menu_item_1_id IS NULL THEN
        INSERT INTO public.menu_items (restaurant_id, name, description, price, image_url, category)
        VALUES (v_restaurant_1_id, 'Classic Burger', 'Juicy beef patty with lettuce', 9.99, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', 'Burgers')
        RETURNING id INTO v_menu_item_1_id;
    END IF;

    -- Item 2: Cheese Fries
    IF NOT EXISTS (SELECT 1 FROM public.menu_items WHERE restaurant_id = v_restaurant_1_id AND name = 'Cheese Fries') THEN
        INSERT INTO public.menu_items (restaurant_id, name, description, price, image_url, category)
        VALUES (v_restaurant_1_id, 'Cheese Fries', 'Crispy fries with cheese', 4.99, 'https://images.unsplash.com/photo-1585109649139-3668018951a7?w=800&q=80', 'Sides');
    END IF;

    -- Sushi Master Items
    IF NOT EXISTS (SELECT 1 FROM public.menu_items WHERE restaurant_id = v_restaurant_2_id AND name = 'Salmon Roll') THEN
        INSERT INTO public.menu_items (restaurant_id, name, description, price, image_url, category)
        VALUES (v_restaurant_2_id, 'Salmon Roll', 'Fresh salmon with avocado', 12.99, 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80', 'Sushi');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.menu_items WHERE restaurant_id = v_restaurant_2_id AND name = 'Miso Soup') THEN
        INSERT INTO public.menu_items (restaurant_id, name, description, price, image_url, category)
        VALUES (v_restaurant_2_id, 'Miso Soup', 'Traditional Japanese soup', 3.99, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80', 'Soup');
    END IF;

    ---------------------------------------------------------------------------
    -- 4. ORDERS (Sample)
    ---------------------------------------------------------------------------
    
    -- Create a completed order
    IF NOT EXISTS (SELECT 1 FROM public.orders WHERE customer_id = v_customer_1_id AND restaurant_id = v_restaurant_1_id AND status = 'delivered' LIMIT 1) THEN
        INSERT INTO public.orders (
            customer_id, restaurant_id, driver_id, status, 
            total_amount, delivery_address, delivery_lat, delivery_lng,
            food_subtotal, delivery_fee, service_fee, tips
        )
        VALUES (
            v_customer_1_id, v_restaurant_1_id, v_driver_1_id, 'delivered',
            18.98, '789 Home St', 37.7749, -122.4194,
            9.99, 5.00, 1.99, 2.00
        )
        RETURNING id INTO v_order_id;
        
        -- Order Items
        -- Ensure menu item exists before linking
        IF v_menu_item_1_id IS NOT NULL THEN
            INSERT INTO public.order_items (order_id, menu_item_id, quantity, price_at_time)
            VALUES (v_order_id, v_menu_item_1_id, 1, 9.99);
        END IF;
        
        -- Payments
        INSERT INTO public.payments (order_id, paypal_order_id, amount, status)
        VALUES (v_order_id, 'PAY-MOCK-123', 18.98, 'completed');
        
    END IF;

END $$;
