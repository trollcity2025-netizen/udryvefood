-- Create storage bucket for applications
insert into storage.buckets (id, name, public)
values ('applications', 'applications', false)
on conflict (id) do nothing;

-- Policies for storage
-- Drivers can upload to their own folder
create policy "Drivers can upload application docs"
  on storage.objects for insert
  with check ( bucket_id = 'applications' and auth.uid() = owner );

create policy "Drivers can view own application docs"
  on storage.objects for select
  using ( bucket_id = 'applications' and auth.uid() = owner );

-- Restaurants can upload
create policy "Restaurants can upload application docs"
  on storage.objects for insert
  with check ( bucket_id = 'applications' and auth.uid() = owner );

create policy "Restaurants can view own application docs"
  on storage.objects for select
  using ( bucket_id = 'applications' and auth.uid() = owner );

-- Admins can view all
create policy "Admins can view all application docs"
  on storage.objects for select
  using ( bucket_id = 'applications' and public.is_admin() );
