-- Seed Data for Demo Restaurant
-- NOTE: This assumes a user exists. In a real scenario, you'd create the user via Auth API first.
-- However, for pure data seeding without auth user, we can insert into public.users/profiles IF foreign key constraints allowed it or if we mock the ID.
-- Since our schema has strict FKs to auth.users, we cannot easily seed "users" without Supabase Auth.
-- SOLUTION: We will create a function that you can call AFTER you sign up a user to "promote" them to a demo restaurant with data.

-- OR better: We provide sample menu items for ANY restaurant that runs this.

-- Let's create a function to populate the CURRENT user (restaurant) with sample data.
create or replace function public.seed_sample_menu()
returns void
language plpgsql
security definer
as $$
declare
  curr_user_id uuid;
begin
  curr_user_id := auth.uid();
  
  if curr_user_id is null then
    raise exception 'Not logged in';
  end if;

  -- Ensure profile exists
  insert into public.restaurant_profiles (user_id, restaurant_name, address, image_url)
  values (curr_user_id, 'My Demo Restaurant', '123 Food St', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80')
  on conflict (user_id) do update set restaurant_name = 'My Demo Restaurant';

  -- Insert Menu Items
  insert into public.menu_items (restaurant_id, name, description, price, image_url)
  values 
    (curr_user_id, 'Classic Burger', 'Juicy beef patty with cheese and lettuce', 12.99, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80'),
    (curr_user_id, 'Pepperoni Pizza', 'Classic pepperoni with mozzarella', 15.50, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80'),
    (curr_user_id, 'Caesar Salad', 'Fresh romaine with parmesan and croutons', 9.99, 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=800&q=80');

end;
$$;
