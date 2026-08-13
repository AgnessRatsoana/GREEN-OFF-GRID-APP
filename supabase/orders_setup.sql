-- Run this in the Supabase SQL editor before deploying the Yoco payment functions.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  yoco_checkout_id text unique,
  amount_cents integer not null,
  currency text not null default 'ZAR',
  status text not null default 'pending', -- pending | paid | failed | cancelled
  items jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can insert their own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

-- Updates to order status happen only from the service role (edge functions), never from the client.
create policy "No client-side updates"
  on public.orders for update
  using (false);

create index if not exists orders_yoco_checkout_id_idx on public.orders (yoco_checkout_id);
create index if not exists orders_user_id_idx on public.orders (user_id);
