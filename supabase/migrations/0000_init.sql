-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create types if they don't exist
do $$ begin
    if not exists (select 1 from pg_type where typname = 'user_role') then
        create type user_role as enum ('admin', 'driver', 'restaurant', 'customer');
    end if;
    if not exists (select 1 from pg_type where typname = 'user_status') then
        create type user_status as enum ('active', 'disabled', 'pending_approval');
    end if;
    if not exists (select 1 from pg_type where typname = 'order_status') then
        create type order_status as enum ('pending', 'accepted', 'preparing', 'ready_for_pickup', 'picked_up', 'in_transit', 'delivered', 'cancelled');
    end if;
    if not exists (select 1 from pg_type where typname = 'payment_status') then
        create type payment_status as enum ('pending', 'completed', 'refunded', 'failed');
    end if;
end $$;

-- USERS TABLE (Managed by Supabase Auth, but we'll reference it in public tables)
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  role user_role not null default 'customer',
  status user_status not null default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.users enable row level security;

-- PROFILES

create table if not exists public.driver_profiles (
  user_id uuid references public.users(id) on delete cascade primary key,
  vehicle_type text,
  vehicle_plate text,
  is_online boolean default false,
  current_lat double precision,
  current_lng double precision,
  last_updated timestamp with time zone
);

create table if not exists public.restaurant_profiles (
  user_id uuid references public.users(id) on delete cascade primary key,
  restaurant_name text not null,
  address text not null,
  latitude double precision,
  longitude double precision,
  image_url text,
  is_open boolean default true
);

create table if not exists public.customer_profiles (
  user_id uuid references public.users(id) on delete cascade primary key,
  phone text,
  default_address text,
  default_lat double precision,
  default_lng double precision
);

-- MENU ITEMS

create table if not exists public.menu_items (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references public.restaurant_profiles(user_id) on delete cascade not null,
  name text not null,
  description text,
  price decimal(10,2) not null,
  image_url text,
  is_available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ORDERS

create table if not exists public.orders (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references public.users(id) not null,
  restaurant_id uuid references public.restaurant_profiles(user_id) not null,
  driver_id uuid references public.driver_profiles(user_id),
  status order_status default 'pending',
  total_amount decimal(10,2) not null,
  delivery_address text not null,
  delivery_lat double precision,
  delivery_lng double precision,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  menu_item_id uuid references public.menu_items(id) not null,
  quantity integer not null default 1,
  price_at_time decimal(10,2) not null
);

-- PAYMENTS / PAYOUTS (PayPal Tracking)

create table if not exists public.payments (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) not null,
  paypal_order_id text not null,
  amount decimal(10,2) not null,
  status payment_status default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.payouts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  amount decimal(10,2) not null,
  paypal_payout_id text,
  status text default 'pending', -- pending, processed
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- POLICIES

-- Users
drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);

drop policy if exists "Admins can view all users" on public.users;
create policy "Admins can view all users" on public.users for select using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- Restaurants
drop policy if exists "Public can view restaurants" on public.restaurant_profiles;
create policy "Public can view restaurants" on public.restaurant_profiles for select using (true);

-- Menu Items
drop policy if exists "Public can view menu items" on public.menu_items;
create policy "Public can view menu items" on public.menu_items for select using (true);
