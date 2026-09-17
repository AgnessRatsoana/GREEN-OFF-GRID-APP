-- Run this once in the Supabase SQL Editor after admin_dashboard_setup.sql.
-- Adds a public storage bucket for client profile photos.
-- Files are stored under a folder named after the owning user's id:
--   avatars/<user-id>/avatar-<timestamp>.<ext>
-- Only the owning user may upload, replace or delete their own avatar.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view avatar images"
on storage.objects;
create policy "Public can view avatar images"
on storage.objects for select
using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar"
on storage.objects;
create policy "Users can upload their own avatar"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update their own avatar"
on storage.objects;
create policy "Users can update their own avatar"
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete their own avatar"
on storage.objects;
create policy "Users can delete their own avatar"
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Clients may update their own name, contact number and avatar.
drop policy if exists "Clients can update their own profile"
on public.profiles;
create policy "Clients can update their own profile"
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

notify pgrst, 'reload schema';
