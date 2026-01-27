
-- TRIGGER for New User Registration
-- This function will handle new user signups and insert them into public.users
-- It will also create the corresponding profile based on the role metadata

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  user_role user_role;
  user_full_name text;
begin
  -- Get role and full name from metadata (default to customer if missing)
  user_role := COALESCE((new.raw_user_meta_data->>'role')::user_role, 'customer');
  user_full_name := COALESCE(new.raw_user_meta_data->>'full_name', '');

  -- Insert into public.users
  insert into public.users (id, email, role, status)
  values (new.id, new.email, user_role, 'active');

  -- Create profile based on role
  if user_role = 'driver' then
    insert into public.driver_profiles (user_id) values (new.id);
  elsif user_role = 'restaurant' then
    -- For restaurant, we might need more info, but we'll insert a placeholder
    insert into public.restaurant_profiles (user_id, restaurant_name, address) 
    values (new.id, user_full_name || '''s Restaurant', 'Address Pending');
  elsif user_role = 'customer' then
    insert into public.customer_profiles (user_id) values (new.id);
  end if;

  return new;
end;
$$;

-- Trigger execution
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
