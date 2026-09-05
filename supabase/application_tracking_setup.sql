-- Run this once in the Supabase SQL Editor.
-- Adds address field to applications and enables marketing status updates.

-- Add address column
alter table public.applications
add column if not exists address text;

-- Marketing/admin can view all applications
drop policy if exists "Marketing can view all applications" on public.applications;
create policy "Marketing can view all applications"
on public.applications for select to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('admin', 'marketing')
  )
);

-- Marketing/admin can update application status
drop policy if exists "Marketing can update application status" on public.applications;
create policy "Marketing can update application status"
on public.applications for update to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('admin', 'marketing')
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('admin', 'marketing')
  )
);

-- Enable realtime for live status updates
alter table public.applications replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'applications'
  ) then
    alter publication supabase_realtime add table public.applications;
  end if;
end $$;

notify pgrst, 'reload schema';
