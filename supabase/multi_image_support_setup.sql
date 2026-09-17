-- Run this once in the Supabase SQL Editor after marketplace_products_setup.sql.
-- Adds ordered multi-image support to products, pre-owned products and combo deals.
-- images[0] is always the cover photo; image_url mirrors images[0] for
-- any code/screens that still read the single image_url column.

alter table public.marketplace_products
  add column if not exists images jsonb not null default '[]'::jsonb;

alter table public.preowned_products
  add column if not exists images jsonb not null default '[]'::jsonb;

alter table public.combo_deals
  add column if not exists images jsonb not null default '[]'::jsonb;

-- Backfill images from the existing single image_url so nothing goes blank.
update public.marketplace_products
set images = jsonb_build_array(image_url)
where image_url is not null and images = '[]'::jsonb;

update public.preowned_products
set images = jsonb_build_array(image_url)
where image_url is not null and images = '[]'::jsonb;

update public.combo_deals
set images = jsonb_build_array(image_url)
where image_url is not null and images = '[]'::jsonb;

notify pgrst, 'reload schema';
