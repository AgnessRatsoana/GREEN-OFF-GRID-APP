-- Run this once in Supabase SQL Editor after customer_enquiries_setup.sql.
-- This upgrades one-way enquiries into shared customer/marketing conversations.

create table if not exists public.enquiry_conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('product', 'package')),
  item_id text not null,
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.enquiry_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.enquiry_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('customer', 'marketing')),
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create unique index if not exists enquiry_conversations_customer_item_idx
on public.enquiry_conversations(customer_id, item_type, item_id);

create index if not exists enquiry_messages_conversation_idx
on public.enquiry_messages(conversation_id, created_at);

alter table public.enquiry_conversations enable row level security;
alter table public.enquiry_messages enable row level security;

drop policy if exists "Customers can create conversations" on public.enquiry_conversations;
create policy "Customers can create conversations"
on public.enquiry_conversations for insert to authenticated
with check (auth.uid() = customer_id);

drop policy if exists "Participants can view conversations" on public.enquiry_conversations;
create policy "Participants can view conversations"
on public.enquiry_conversations for select to authenticated
using (
  auth.uid() = customer_id
  or exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('admin', 'marketing')
  )
);

drop policy if exists "Participants can send messages" on public.enquiry_messages;
create policy "Participants can send messages"
on public.enquiry_messages for insert to authenticated
with check (
  auth.uid() = sender_id
  and (
    (
      sender_role = 'customer'
      and exists (
        select 1 from public.enquiry_conversations
        where id = conversation_id and customer_id = auth.uid()
      )
    )
    or (
      sender_role = 'marketing'
      and exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
          and profiles.role in ('admin', 'marketing')
      )
    )
  )
);

drop policy if exists "Participants can view messages" on public.enquiry_messages;
create policy "Participants can view messages"
on public.enquiry_messages for select to authenticated
using (
  exists (
    select 1 from public.enquiry_conversations
    where id = conversation_id and customer_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('admin', 'marketing')
  )
);

create or replace function public.touch_enquiry_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.enquiry_conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists enquiry_messages_touch_conversation on public.enquiry_messages;
create trigger enquiry_messages_touch_conversation
after insert on public.enquiry_messages
for each row execute function public.touch_enquiry_conversation();

-- Migrate already-submitted enquiries once. Re-running this query is safe.
insert into public.enquiry_conversations (customer_id, item_type, item_id, status, created_at, updated_at)
select e.customer_id, e.item_type, e.item_id, e.status, min(e.created_at), max(e.created_at)
from public.customer_enquiries e
where not exists (
  select 1 from public.enquiry_conversations c
  where c.customer_id = e.customer_id
    and c.item_type = e.item_type
    and c.item_id = e.item_id
)
group by e.customer_id, e.item_type, e.item_id, e.status;

insert into public.enquiry_messages (conversation_id, sender_id, sender_role, body, created_at)
select c.id, e.customer_id, 'customer', e.message, e.created_at
from public.customer_enquiries e
join public.enquiry_conversations c
  on c.customer_id = e.customer_id
 and c.item_type = e.item_type
 and c.item_id = e.item_id
where not exists (
  select 1 from public.enquiry_messages m
  where m.conversation_id = c.id
    and m.sender_id = e.customer_id
    and m.body = e.message
    and m.created_at = e.created_at
);
