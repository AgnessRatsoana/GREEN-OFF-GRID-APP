-- Run this once in Supabase SQL Editor AFTER customer_enquiry_chat_setup.sql.
-- Adds read-state tracking and Supabase Realtime to the enquiry chat.

-- ============================================================
-- 1. READ TIMESTAMPS
-- ============================================================

alter table public.enquiry_conversations
  add column if not exists customer_last_read_at timestamptz not null default now();

alter table public.enquiry_conversations
  add column if not exists marketing_last_read_at timestamptz not null default now();

-- Existing conversations: the customer has seen their own messages,
-- marketing has not seen anything yet.
update public.enquiry_conversations
set
  customer_last_read_at = now(),
  marketing_last_read_at = '1970-01-01T00:00:00Z'::timestamptz
where marketing_last_read_at = customer_last_read_at;

-- ============================================================
-- 2. READ-STATE UPDATE POLICIES
-- ============================================================

drop policy if exists "Customer can update conversation read state" on public.enquiry_conversations;
create policy "Customer can update conversation read state"
on public.enquiry_conversations for update to authenticated
using (auth.uid() = customer_id)
with check (auth.uid() = customer_id);

drop policy if exists "Marketing can update conversation read state" on public.enquiry_conversations;
create policy "Marketing can update conversation read state"
on public.enquiry_conversations for update to authenticated
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

-- ============================================================
-- 3. REALTIME
-- ============================================================

alter table public.enquiry_conversations replica identity full;
alter table public.enquiry_messages replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'enquiry_messages'
  ) then
    alter publication supabase_realtime add table public.enquiry_messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'enquiry_conversations'
  ) then
    alter publication supabase_realtime add table public.enquiry_conversations;
  end if;
end $$;

notify pgrst, 'reload schema';
