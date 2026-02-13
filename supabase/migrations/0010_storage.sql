-- Create storage bucket for applications
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('applications', 'applications', false)
    ON CONFLICT (id) DO NOTHING;
EXCEPTION
    WHEN undefined_column THEN
        INSERT INTO storage.buckets (id, name)
        VALUES ('applications', 'applications')
        ON CONFLICT (id) DO NOTHING;
END $$;

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
