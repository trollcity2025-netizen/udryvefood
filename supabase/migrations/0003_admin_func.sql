-- Function to promote a user to admin by email
-- Usage: select promote_to_admin('admin@example.com');

create or replace function public.promote_to_admin(user_email text)
returns void
language plpgsql
security definer
as $$
declare
  target_user_id uuid;
begin
  -- Find user by email in public.users
  select id into target_user_id
  from public.users
  where email = user_email;

  if target_user_id is null then
    raise exception 'User with email % not found in public.users', user_email;
  end if;

  -- Update public.users role
  update public.users
  set role = 'admin'
  where id = target_user_id;

  -- Update auth.users metadata (optional but good for consistency)
  update auth.users
  set raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '"admin"')
  where id = target_user_id;

end;
$$;
