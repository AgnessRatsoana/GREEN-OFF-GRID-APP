-- Run this once in the Supabase SQL Editor after admin_dashboard_setup.sql.
-- The app uses category = 'Pre-owned products' for pre-owned catalogue items.

create table if not exists public.marketplace_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(12,2) not null default 0 check (price >= 0),
  brand text not null default '',
  category text not null,
  sku text not null unique,
  cost_price numeric(12,2) check (cost_price is null or cost_price >= 0),
  quantity integer not null default 0 check (quantity >= 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketplace_products_active_created_idx
on public.marketplace_products (is_active, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_marketplace_products_set_updated_at
on public.marketplace_products;
create trigger trg_marketplace_products_set_updated_at
before update on public.marketplace_products
for each row execute function public.set_updated_at();

alter table public.marketplace_products enable row level security;

drop policy if exists "Public can view active marketplace products"
on public.marketplace_products;
create policy "Public can view active marketplace products"
on public.marketplace_products for select
using (
  is_active = true
  or public.current_user_role() in ('admin', 'marketing')
);

drop policy if exists "marketing_manage_products"
on public.marketplace_products;
create policy "marketing_manage_products"
on public.marketplace_products for all to authenticated
using (public.current_user_role() in ('admin', 'marketing'))
with check (public.current_user_role() in ('admin', 'marketing'));

insert into storage.buckets (id, name, public)
values ('marketplace-products', 'marketplace-products', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view marketplace product images"
on storage.objects;
create policy "Public can view marketplace product images"
on storage.objects for select
using (bucket_id = 'marketplace-products');

drop policy if exists "Staff can upload marketplace product images"
on storage.objects;
create policy "Staff can upload marketplace product images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'marketplace-products'
  and public.current_user_role() in ('admin', 'marketing')
);

drop policy if exists "Staff can update marketplace product images"
on storage.objects;
create policy "Staff can update marketplace product images"
on storage.objects for update to authenticated
using (
  bucket_id = 'marketplace-products'
  and public.current_user_role() in ('admin', 'marketing')
)
with check (
  bucket_id = 'marketplace-products'
  and public.current_user_role() in ('admin', 'marketing')
);

drop policy if exists "Staff can delete marketplace product images"
on storage.objects;
create policy "Staff can delete marketplace product images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'marketplace-products'
  and public.current_user_role() in ('admin', 'marketing')
);

notify pgrst, 'reload schema';

-- ============================================================
-- PRE-OWNED PRODUCTS: separate table and image bucket
-- ============================================================

create table if not exists public.preowned_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(12,2) not null default 0 check (price >= 0),
  brand text not null default '',
  category text not null,
  sku text not null unique,
  cost_price numeric(12,2) check (cost_price is null or cost_price >= 0),
  quantity integer not null default 0 check (quantity >= 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists preowned_products_active_created_idx
on public.preowned_products (is_active, created_at);

drop trigger if exists trg_preowned_products_set_updated_at
on public.preowned_products;
create trigger trg_preowned_products_set_updated_at
before update on public.preowned_products
for each row execute function public.set_updated_at();

alter table public.preowned_products enable row level security;

drop policy if exists "Public can view active pre-owned products"
on public.preowned_products;
create policy "Public can view active pre-owned products"
on public.preowned_products for select
using (
  is_active = true
  or public.current_user_role() in ('admin', 'marketing')
);

drop policy if exists "staff_manage_preowned_products"
on public.preowned_products;
create policy "staff_manage_preowned_products"
on public.preowned_products for all to authenticated
using (public.current_user_role() in ('admin', 'marketing'))
with check (public.current_user_role() in ('admin', 'marketing'));

-- Move earlier pre-owned rows from the general catalogue once, preserving IDs.
insert into public.preowned_products (
  id, name, description, price, brand, category, sku, cost_price,
  quantity, image_url, is_active, created_at, updated_at
)
select
  id, name, description, price, brand, category, sku, cost_price,
  quantity, image_url, is_active, created_at, updated_at
from public.marketplace_products
where lower(trim(category)) in (
  'pre-owned products', 'preowned products', 'pre owned products',
  'second hand products', 'second-hand products'
)
on conflict (id) do nothing;

delete from public.marketplace_products
where lower(trim(category)) in (
  'pre-owned products', 'preowned products', 'pre owned products',
  'second hand products', 'second-hand products'
);

insert into storage.buckets (id, name, public)
values ('preowned-products', 'preowned-products', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view pre-owned product images"
on storage.objects;
create policy "Public can view pre-owned product images"
on storage.objects for select
using (bucket_id = 'preowned-products');

drop policy if exists "Staff can upload pre-owned product images"
on storage.objects;
create policy "Staff can upload pre-owned product images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'preowned-products'
  and public.current_user_role() in ('admin', 'marketing')
);

drop policy if exists "Staff can update pre-owned product images"
on storage.objects;
create policy "Staff can update pre-owned product images"
on storage.objects for update to authenticated
using (
  bucket_id = 'preowned-products'
  and public.current_user_role() in ('admin', 'marketing')
)
with check (
  bucket_id = 'preowned-products'
  and public.current_user_role() in ('admin', 'marketing')
);

drop policy if exists "Staff can delete pre-owned product images"
on storage.objects;
create policy "Staff can delete pre-owned product images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'preowned-products'
  and public.current_user_role() in ('admin', 'marketing')
);

notify pgrst, 'reload schema';