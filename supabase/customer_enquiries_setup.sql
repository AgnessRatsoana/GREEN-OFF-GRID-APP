-- Run this in the Supabase SQL Editor.
create table if not exists public.customer_enquiries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('product', 'package')),
  item_id text not null,
  message text not null check (char_length(trim(message)) > 0),
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved')),
  created_at timestamptz not null default now()
);

alter table public.customer_enquiries enable row level security;

create policy "Customers can create their own enquiries"
  on public.customer_enquiries for insert
  to authenticated
  with check (auth.uid() = customer_id);

create policy "Customers can view their own enquiries"
  on public.customer_enquiries for select
  to authenticated
  using (auth.uid() = customer_id);

create policy "Marketing can view customer enquiries"
  on public.customer_enquiries for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'marketing')
    )
  );

create index if not exists customer_enquiries_customer_id_idx on public.customer_enquiries(customer_id);
create index if not exists customer_enquiries_created_at_idx on public.customer_enquiries(created_at desc);