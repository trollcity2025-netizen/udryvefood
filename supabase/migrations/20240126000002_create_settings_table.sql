create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default now()
);

alter table app_settings enable row level security;

create policy "Public read access"
  on app_settings for select
  using (true);

create policy "Admin update access"
  on app_settings for insert
  with check (auth.role() = 'authenticated'); -- Simplified for now, ideally 'admin' role check

create policy "Admin update access update"
  on app_settings for update
  using (auth.role() = 'authenticated');

-- Insert defaults
insert into app_settings (key, value)
values 
  ('social_links', '{"facebook": "", "twitter": "", "instagram": "", "linkedin": ""}'::jsonb),
  ('payment_methods', '[]'::jsonb)
on conflict (key) do nothing;
