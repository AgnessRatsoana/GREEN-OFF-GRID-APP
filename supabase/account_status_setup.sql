-- ============================================================
-- ACCOUNT STATUS (deactivate / reactivate support)
-- ============================================================
-- Adds a self-service "deactivated" state for client accounts.
-- Permanent deletion is handled separately by the
-- `delete-account` edge function (auth.users row removal,
-- which cascades to public.profiles).

alter table public.profiles
  add column if not exists account_status text
  not null default 'active'
  check (account_status in ('active', 'deactivated'));

create index if not exists profiles_account_status_idx
  on public.profiles (account_status);
