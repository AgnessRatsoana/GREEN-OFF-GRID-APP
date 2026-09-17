-- Run after admin_dashboard_setup.sql
create table if not exists public.combo_deals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  price numeric(12,2) not null default 0,
  rating numeric(3,1) not null default 4.8,
  image_url text,
  bullets jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists combo_deals_active_order_idx
on public.combo_deals(is_active, display_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_combo_deals_set_updated_at on public.combo_deals;
create trigger trg_combo_deals_set_updated_at
before update on public.combo_deals
for each row execute function public.set_updated_at();

alter table public.combo_deals enable row level security;

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

drop policy if exists "Anyone can view active combo deals" on public.combo_deals;
create policy "Anyone can view active combo deals"
on public.combo_deals for select
using (is_active = true or public.current_user_role() in ('admin', 'marketing'));

drop policy if exists "Marketing can create combo deals" on public.combo_deals;
create policy "Marketing can create combo deals"
on public.combo_deals for insert to authenticated
with check (public.current_user_role() in ('admin', 'marketing'));

drop policy if exists "Marketing can update combo deals" on public.combo_deals;
create policy "Marketing can update combo deals"
on public.combo_deals for update to authenticated
using (public.current_user_role() in ('admin', 'marketing'))
with check (public.current_user_role() in ('admin', 'marketing'));

drop policy if exists "Marketing can delete combo deals" on public.combo_deals;
create policy "Marketing can delete combo deals"
on public.combo_deals for delete to authenticated
using (public.current_user_role() in ('admin', 'marketing'));

insert into storage.buckets (id, name, public)
values ('combo-deals', 'combo-deals', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view combo deal images" on storage.objects;
create policy "Public can view combo deal images"
on storage.objects for select
using (bucket_id = 'combo-deals');

drop policy if exists "Marketing can upload combo deal images" on storage.objects;
create policy "Marketing can upload combo deal images"
on storage.objects for insert to authenticated
with check (bucket_id = 'combo-deals' and public.current_user_role() in ('admin', 'marketing'));

drop policy if exists "Marketing can update combo deal images" on storage.objects;
create policy "Marketing can update combo deal images"
on storage.objects for update to authenticated
using (bucket_id = 'combo-deals' and public.current_user_role() in ('admin', 'marketing'))
with check (bucket_id = 'combo-deals' and public.current_user_role() in ('admin', 'marketing'));

drop policy if exists "Marketing can delete combo deal images" on storage.objects;
create policy "Marketing can delete combo deal images"
on storage.objects for delete to authenticated
using (bucket_id = 'combo-deals' and public.current_user_role() in ('admin', 'marketing'));

notify pgrst, 'reload schema';
