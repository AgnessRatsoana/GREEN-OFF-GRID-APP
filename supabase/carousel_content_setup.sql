-- Run after admin_dashboard_setup.sql.

create table if not exists public.carousel_slides (
  id uuid primary key default gen_random_uuid(),
  media_type text not null check (media_type in ('image', 'video')),
  media_url text not null,
  subtitle text not null default '',
  main_title text not null,
  point_one text not null default '',
  point_two text not null default '',
  primary_button_text text not null default 'Explore',
  secondary_button_text text not null default 'Learn more',
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists carousel_slides_active_order_idx
on public.carousel_slides(is_active, display_order);

create or replace function public.current_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;

with ordered as (
  select id, row_number() over (order by created_at, id) - 1 as next_order
  from public.carousel_slides
)
update public.carousel_slides slides
set display_order = ordered.next_order
from ordered
where slides.id = ordered.id;

do $$
begin
  if not exists (
    select 1
    from pg_publication_rel rel
    join pg_class table_info on table_info.oid = rel.prrelid
    join pg_publication publication on publication.oid = rel.prpubid
    where publication.pubname = 'supabase_realtime'
      and table_info.relname = 'carousel_slides'
  ) then
    alter publication supabase_realtime add table public.carousel_slides;
  end if;
end
$$;

alter table public.carousel_slides enable row level security;

drop policy if exists "Anyone can view active carousel slides" on public.carousel_slides;
create policy "Anyone can view active carousel slides"
on public.carousel_slides for select
using (is_active = true or public.current_user_role() in ('admin', 'marketing'));

drop policy if exists "Marketing can create carousel slides" on public.carousel_slides;
create policy "Marketing can create carousel slides"
on public.carousel_slides for insert to authenticated
with check (public.current_user_role() in ('admin', 'marketing'));

drop policy if exists "Marketing can update carousel slides" on public.carousel_slides;
create policy "Marketing can update carousel slides"
on public.carousel_slides for update to authenticated
using (public.current_user_role() in ('admin', 'marketing'))
with check (public.current_user_role() in ('admin', 'marketing'));

drop policy if exists "Marketing can delete carousel slides" on public.carousel_slides;
create policy "Marketing can delete carousel slides"
on public.carousel_slides for delete to authenticated
using (public.current_user_role() in ('admin', 'marketing'));

drop trigger if exists trg_carousel_slides_set_updated_at on public.carousel_slides;
create trigger trg_carousel_slides_set_updated_at
before update on public.carousel_slides
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('carousel-media', 'carousel-media', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view carousel media" on storage.objects;
create policy "Public can view carousel media"
on storage.objects for select
using (bucket_id = 'carousel-media');

drop policy if exists "Marketing can upload carousel media" on storage.objects;
create policy "Marketing can upload carousel media"
on storage.objects for insert to authenticated
with check (bucket_id = 'carousel-media' and public.current_user_role() in ('admin', 'marketing'));

drop policy if exists "Marketing can update carousel media" on storage.objects;
create policy "Marketing can update carousel media"
on storage.objects for update to authenticated
using (bucket_id = 'carousel-media' and public.current_user_role() in ('admin', 'marketing'))
with check (bucket_id = 'carousel-media' and public.current_user_role() in ('admin', 'marketing'));

drop policy if exists "Marketing can delete carousel media" on storage.objects;
create policy "Marketing can delete carousel media"
on storage.objects for delete to authenticated
using (bucket_id = 'carousel-media' and public.current_user_role() in ('admin', 'marketing'));