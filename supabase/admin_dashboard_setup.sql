-- Run this in Supabase SQL Editor.
-- Creates tables and policies required for admin user metrics and activity logs.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default 'User',
  avatar_url text,
  role text not null default 'client' check (role in ('admin', 'client')),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.activity_logs enable row level security;

-- Users can manage their own profile.
drop policy if exists "users_select_own_profile" on public.profiles;
create policy "users_select_own_profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "users_upsert_own_profile" on public.profiles;
create policy "users_upsert_own_profile"
on public.profiles
for all
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Admin users can read all profiles.
drop policy if exists "admins_select_all_profiles" on public.profiles;
create policy "admins_select_all_profiles"
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- Authenticated users can insert their own activity logs.
drop policy if exists "users_insert_activity_logs" on public.activity_logs;
create policy "users_insert_activity_logs"
on public.activity_logs
for insert
to authenticated
with check (actor_id = auth.uid());

-- Admin users can read all activity logs.
drop policy if exists "admins_select_all_activity_logs" on public.activity_logs;
create policy "admins_select_all_activity_logs"
on public.activity_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- Optional: create profile row automatically when user signs up.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, last_seen_at)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_auth_user_created_profile on auth.users;
create trigger trg_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();
