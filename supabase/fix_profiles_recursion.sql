-- Run this entire file once in the Supabase SQL Editor.
-- Fixes "infinite recursion detected in policy for relation profiles" and the
-- blocked order insert. Safe to run more than once.

-- ============================================================
-- 1. RECURSION-FREE ROLE HELPER
--    security definer reads the caller's role without tripping RLS,
--    so policies can check the role without re-entering profiles.
-- ============================================================

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

-- ============================================================
-- 2. PROFILES — rewrite every role-checking policy
-- ============================================================

drop policy if exists "admins_select_all_profiles" on public.profiles;
create policy "admins_select_all_profiles"
on public.profiles for select to authenticated
using (public.current_user_role() = 'admin');

drop policy if exists "admins_update_all_profiles" on public.profiles;
create policy "admins_update_all_profiles"
on public.profiles for update to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "admins_insert_profiles" on public.profiles;
create policy "admins_insert_profiles"
on public.profiles for insert to authenticated
with check (public.current_user_role() = 'admin');

drop policy if exists "Marketing can view customer profiles" on public.profiles;
create policy "Marketing can view customer profiles"
on public.profiles for select to authenticated
using (public.current_user_role() in ('admin', 'marketing'));

-- ============================================================
-- 3. MARKETPLACE PRODUCTS
-- ============================================================

drop policy if exists "marketing_manage_products" on public.marketplace_products;
create policy "marketing_manage_products"
on public.marketplace_products for all to authenticated
using (public.current_user_role() in ('marketing', 'admin'))
with check (public.current_user_role() in ('marketing', 'admin'));

-- ============================================================
-- 4. ORDERS — and drop the policy that blocked order inserts
-- ============================================================

drop policy if exists "Marketing can view all orders" on public.orders;
create policy "Marketing can view all orders"
on public.orders for select to authenticated
using (public.current_user_role() in ('admin', 'marketing'));

drop policy if exists "Marketing can update order fulfilment" on public.orders;
create policy "Marketing can update order fulfilment"
on public.orders for update to authenticated
using (public.current_user_role() in ('admin', 'marketing'))
with check (public.current_user_role() in ('admin', 'marketing'));

-- This policy used `using (false)` and blocked all client order inserts.
drop policy if exists "No client-side updates" on public.orders;

-- ============================================================
-- 5. ENQUIRIES / CONVERSATIONS / MESSAGES
-- ============================================================

drop policy if exists "Marketing can view customer enquiries" on public.customer_enquiries;
create policy "Marketing can view customer enquiries"
on public.customer_enquiries for select to authenticated
using (public.current_user_role() in ('admin', 'marketing'));

drop policy if exists "Participants can view conversations" on public.enquiry_conversations;
create policy "Participants can view conversations"
on public.enquiry_conversations for select to authenticated
using (
  auth.uid() = customer_id
  or public.current_user_role() in ('admin', 'marketing')
);

drop policy if exists "Marketing can update conversation read state" on public.enquiry_conversations;
create policy "Marketing can update conversation read state"
on public.enquiry_conversations for update to authenticated
using (public.current_user_role() in ('admin', 'marketing'))
with check (public.current_user_role() in ('admin', 'marketing'));

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
      and public.current_user_role() in ('admin', 'marketing')
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
  or public.current_user_role() in ('admin', 'marketing')
);

notify pgrst, 'reload schema';
