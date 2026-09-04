-- Run this once in the Supabase SQL Editor.
-- Adds order numbers, delivery details and fulfilment timeline to orders.

alter table public.orders
  add column if not exists order_number text;

alter table public.orders
  add column if not exists customer_name text;

alter table public.orders
  add column if not exists delivery_address text;

alter table public.orders
  add column if not exists delivery_city text;

alter table public.orders
  add column if not exists confirmed_at timestamptz;

alter table public.orders
  add column if not exists packaged_at timestamptz;

alter table public.orders
  add column if not exists dispatched_at timestamptz;

alter table public.orders
  add column if not exists delivered_at timestamptz;

-- Backfill order numbers for any existing orders.
update public.orders
set order_number = 'GOG-' || to_char(created_at, 'YYYYMMDD') || '-' || upper(substr(id::text, 1, 4))
where order_number is null;

alter table public.orders
  alter column order_number set not null;

create unique index if not exists orders_order_number_idx on public.orders(order_number);

-- Marketing can see all orders with customer profiles.
drop policy if exists "Marketing can view all orders" on public.orders;
create policy "Marketing can view all orders"
on public.orders for select to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('admin', 'marketing')
  )
);

-- Marketing advances fulfilment timestamps only.
drop policy if exists "Marketing can update order fulfilment" on public.orders;
create policy "Marketing can update order fulfilment"
on public.orders for update to authenticated
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

-- Marketing can read customer profiles to show on orders.
-- NOTE: this queries profiles from a policy on profiles, which causes
-- "infinite recursion". If you see that error, run fix_profiles_recursion.sql,
-- which replaces all role checks with a recursion-free helper.
drop policy if exists "Marketing can view customer profiles" on public.profiles;
create policy "Marketing can view customer profiles"
on public.profiles for select to authenticated
using (
  exists (
    select 1 from public.profiles own
    where own.id = auth.uid()
      and own.role in ('admin', 'marketing')
  )
);

-- Paid orders count as confirmed in the timeline.
update public.orders
set confirmed_at = created_at
where confirmed_at is null
  and status in ('paid', 'confirmed');

-- Live order-status updates on the tracking screen.
alter table public.orders replica identity full;

-- Allow enquiries to be attached to orders.
alter table public.enquiry_conversations
drop constraint if exists enquiry_conversations_item_type_check;

alter table public.enquiry_conversations
add constraint enquiry_conversations_item_type_check
check (item_type in ('product', 'package', 'order'));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;

notify pgrst, 'reload schema';
