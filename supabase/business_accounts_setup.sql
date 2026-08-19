-- Run this in the Supabase SQL editor after admin_dashboard_setup.sql.
-- Adds business-account fields to profiles so registration can distinguish
-- individual vs business customers (separate from `role`, which stays admin/client).

alter table public.profiles
  add column if not exists account_type text not null default 'individual' check (account_type in ('individual', 'business')),
  add column if not exists business_name text,
  add column if not exists business_registration_number text,
  add column if not exists contact_number text;

create index if not exists profiles_account_type_idx on public.profiles (account_type);
