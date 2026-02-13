-- Create storage buckets if they don't exist
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES 
      ('driver-documents', 'driver-documents', false),
      ('avatars', 'avatars', true)
    ON CONFLICT (id) DO NOTHING;
EXCEPTION
    WHEN undefined_column THEN
        INSERT INTO storage.buckets (id, name)
        VALUES 
          ('driver-documents', 'driver-documents'),
          ('avatars', 'avatars')
        ON CONFLICT (id) DO NOTHING;
END $$;

-- RLS for storage objects

-- Driver Documents: Users can upload their own, view their own. Admins can view all.
drop policy if exists "Drivers can upload own documents" on storage.objects;
create policy "Drivers can upload own documents"
  on storage.objects for insert
  with check ( bucket_id = 'driver-documents' and auth.uid()::text = (storage.foldername(name))[1] );

drop policy if exists "Drivers can update own documents" on storage.objects;
create policy "Drivers can update own documents"
  on storage.objects for update
  using ( bucket_id = 'driver-documents' and auth.uid()::text = (storage.foldername(name))[1] );

drop policy if exists "Drivers can view own documents" on storage.objects;
create policy "Drivers can view own documents"
  on storage.objects for select
  using ( bucket_id = 'driver-documents' and auth.uid()::text = (storage.foldername(name))[1] );

drop policy if exists "Admins can view all documents" on storage.objects;
create policy "Admins can view all documents"
  on storage.objects for select
  using ( bucket_id = 'driver-documents' and public.is_admin() );


-- Avatars: Users can upload their own. Public can view (since it's for profile photos).
drop policy if exists "Users can upload own avatar" on storage.objects;
create policy "Users can upload own avatar"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1] );

drop policy if exists "Users can update own avatar" on storage.objects;
create policy "Users can update own avatar"
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1] );

drop policy if exists "Public can view avatars" on storage.objects;
create policy "Public can view avatars"
  on storage.objects for select
  using ( bucket_id = 'avatars' );
