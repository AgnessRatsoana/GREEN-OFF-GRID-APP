-- ============================================================
-- GREEN OFF-GRID
-- APPLICATION MANAGEMENT SETUP
-- ============================================================
-- Roles:
--   admin    = final decision-making authority
--   marketing = application processing/review team
--   client   = applicant
--
-- Marketing can:
--   - view applications
--   - review documents
--   - add application activity
--   - move applications to Under Review
--   - move applications to Consultation
--
-- Admin can:
--   - do everything marketing can do
--   - approve applications
--   - reject applications
-- ============================================================


-- ============================================================
-- 1. APPLICATION STATUS CONSTRAINT
-- ============================================================

alter table public.applications
drop constraint if exists applications_status_check;

alter table public.applications
add constraint applications_status_check
check (
  status in (
    'Submitted',
    'Under Review',
    'Consultation',
    'Approved',
    'Rejected'
  )
);


-- ============================================================
-- 2. APPLICATION DOCUMENTS
-- ============================================================

create table if not exists public.application_documents (
  id uuid primary key default gen_random_uuid(),

  application_id uuid not null
    references public.applications(id)
    on delete cascade,

  document_type text not null,

  document_name text not null,

  storage_path text,

  status text not null default 'Pending'
    check (
      status in (
        'Pending',
        'Accepted',
        'Rejected',
        'Requires Correction'
      )
    ),

  reviewer_id uuid
    references auth.users(id)
    on delete set null,

  reviewer_notes text,

  reviewed_at timestamptz,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);


-- ============================================================
-- 3. APPLICATION ACTIVITY / AUDIT LOG
-- ============================================================

create table if not exists public.application_activity (
  id uuid primary key default gen_random_uuid(),

  application_id uuid not null
    references public.applications(id)
    on delete cascade,

  actor_id uuid
    references auth.users(id)
    on delete set null,

  actor_role text,

  event_type text not null,

  old_status text,

  new_status text,

  document_id uuid
    references public.application_documents(id)
    on delete set null,

  notes text,

  metadata jsonb,

  created_at timestamptz not null default now()
);


-- ============================================================
-- 4. INDEXES
-- ============================================================

create index if not exists idx_application_documents_application_id
on public.application_documents(application_id);

create index if not exists idx_application_documents_status
on public.application_documents(status);

create index if not exists idx_application_activity_application_id
on public.application_activity(application_id);

create index if not exists idx_application_activity_created_at
on public.application_activity(created_at desc);

create index if not exists idx_applications_status
on public.applications(status);

create index if not exists idx_applications_created_at
on public.applications(created_at desc);


-- ============================================================
-- 5. UPDATED_AT TRIGGER
-- ============================================================

drop trigger if exists trg_application_documents_set_updated_at
on public.application_documents;

create trigger trg_application_documents_set_updated_at
before update on public.application_documents
for each row
execute function public.set_updated_at();


-- ============================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================================

alter table public.application_documents
enable row level security;

alter table public.application_activity
enable row level security;


-- ============================================================
-- 7. HELPER FUNCTIONS
-- ============================================================
-- SECURITY DEFINER avoids depending on recursive profile
-- policies when checking the current user's role.
-- ============================================================

create or replace function public.current_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
  limit 1;
$$;


create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;


create or replace function public.is_marketing()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'marketing'
  );
$$;


create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'marketing')
  );
$$;


-- ============================================================
-- 8. APPLICATION POLICIES
-- ============================================================
-- Remove any previous application policies with these names
-- before creating the management policies.
-- ============================================================

drop policy if exists "staff_select_applications"
on public.applications;

create policy "staff_select_applications"
on public.applications
for select
to authenticated
using (
  public.is_staff()
);


-- Clients can continue viewing their own applications.
drop policy if exists "clients_select_own_applications"
on public.applications;

create policy "clients_select_own_applications"
on public.applications
for select
to authenticated
using (
  auth.uid() = user_id
);


-- ============================================================
-- 9. APPLICATION DOCUMENT POLICIES
-- ============================================================

drop policy if exists "clients_select_own_application_documents"
on public.application_documents;

create policy "clients_select_own_application_documents"
on public.application_documents
for select
to authenticated
using (
  exists (
    select 1
    from public.applications a
    where a.id = application_documents.application_id
      and a.user_id = auth.uid()
  )
);


drop policy if exists "staff_select_application_documents"
on public.application_documents;

create policy "staff_select_application_documents"
on public.application_documents
for select
to authenticated
using (
  public.is_staff()
);


-- Marketing and admin can add document records.
drop policy if exists "staff_insert_application_documents"
on public.application_documents;

create policy "staff_insert_application_documents"
on public.application_documents
for insert
to authenticated
with check (
  public.is_staff()
);


-- Marketing and admin can review documents.
drop policy if exists "staff_update_application_documents"
on public.application_documents;

create policy "staff_update_application_documents"
on public.application_documents
for update
to authenticated
using (
  public.is_staff()
)
with check (
  public.is_staff()
);


-- ============================================================
-- 10. APPLICATION ACTIVITY POLICIES
-- ============================================================

-- Client can see activity belonging to their own application.
drop policy if exists "clients_select_own_application_activity"
on public.application_activity;

create policy "clients_select_own_application_activity"
on public.application_activity
for select
to authenticated
using (
  exists (
    select 1
    from public.applications a
    where a.id = application_activity.application_id
      and a.user_id = auth.uid()
  )
);


-- Staff can see all application activity.
drop policy if exists "staff_select_application_activity"
on public.application_activity;

create policy "staff_select_application_activity"
on public.application_activity
for select
to authenticated
using (
  public.is_staff()
);


-- Staff can create activity records.
drop policy if exists "staff_insert_application_activity"
on public.application_activity;

create policy "staff_insert_application_activity"
on public.application_activity
for insert
to authenticated
with check (
  public.is_staff()
  and actor_id = auth.uid()
);


-- Activity records should be immutable.
-- There are intentionally no UPDATE or DELETE policies.


-- ============================================================
-- 11. MARKETING STATUS TRANSITION FUNCTION
-- ============================================================
-- Marketing is deliberately restricted to operational stages.
--
-- Allowed:
--   Submitted -> Under Review
--   Under Review -> Consultation
--   Consultation -> Under Review
--
-- Marketing CANNOT:
--   - Approve
--   - Reject
-- ============================================================

create or replace function public.marketing_update_application_status(
  p_application_id uuid,
  p_new_status text,
  p_notes text default null
)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_application public.applications;
  v_old_status text;
begin

  if not public.is_marketing() then
    raise exception 'Only marketing users can perform this action.';
  end if;

  if p_new_status not in (
    'Under Review',
    'Consultation'
  ) then
    raise exception
      'Marketing users cannot set application status to %.',
      p_new_status;
  end if;

  select *
  into v_application
  from public.applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Application not found.';
  end if;

  v_old_status := v_application.status;

  update public.applications
  set
    status = p_new_status,
    updated_at = now()
  where id = p_application_id
  returning *
  into v_application;

  insert into public.application_activity (
    application_id,
    actor_id,
    actor_role,
    event_type,
    old_status,
    new_status,
    notes
  )
  values (
    p_application_id,
    auth.uid(),
    'marketing',
    'status_changed',
    v_old_status,
    p_new_status,
    p_notes
  );

  return v_application;
end;
$$;


-- ============================================================
-- 12. ADMIN FINAL DECISION FUNCTION
-- ============================================================
-- ONLY ADMIN CAN:
--   Approved
--   Rejected
-- ============================================================

create or replace function public.admin_update_application_status(
  p_application_id uuid,
  p_new_status text,
  p_notes text default null
)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_application public.applications;
  v_old_status text;
begin

  if not public.is_admin() then
    raise exception 'Only admin users can approve or reject applications.';
  end if;

  if p_new_status not in (
    'Approved',
    'Rejected'
  ) then
    raise exception
      'Admin final decision must be Approved or Rejected.';
  end if;

  select *
  into v_application
  from public.applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Application not found.';
  end if;

  v_old_status := v_application.status;

  update public.applications
  set
    status = p_new_status,
    updated_at = now()
  where id = p_application_id
  returning *
  into v_application;

  insert into public.application_activity (
    application_id,
    actor_id,
    actor_role,
    event_type,
    old_status,
    new_status,
    notes
  )
  values (
    p_application_id,
    auth.uid(),
    'admin',
    'final_decision',
    v_old_status,
    p_new_status,
    p_notes
  );

  return v_application;
end;
$$;


-- ============================================================
-- 13. DOCUMENT REVIEW FUNCTION
-- ============================================================
-- Marketing and admin can review documents.
-- ============================================================

create or replace function public.review_application_document(
  p_document_id uuid,
  p_status text,
  p_notes text default null
)
returns public.application_documents
language plpgsql
security definer
set search_path = public
as $$
declare
  v_document public.application_documents;
begin

  if not public.is_staff() then
    raise exception 'Only staff users can review application documents.';
  end if;

  if p_status not in (
    'Pending',
    'Accepted',
    'Rejected',
    'Requires Correction'
  ) then
    raise exception 'Invalid document status.';
  end if;

  update public.application_documents
  set
    status = p_status,
    reviewer_id = auth.uid(),
    reviewer_notes = p_notes,
    reviewed_at = now(),
    updated_at = now()
  where id = p_document_id
  returning *
  into v_document;

  if not found then
    raise exception 'Application document not found.';
  end if;

  insert into public.application_activity (
    application_id,
    actor_id,
    actor_role,
    event_type,
    document_id,
    notes,
    metadata
  )
  values (
    v_document.application_id,
    auth.uid(),
    public.current_user_role(),
    'document_reviewed',
    v_document.id,
    p_notes,
    jsonb_build_object(
      'document_status', p_status,
      'document_type', v_document.document_type
    )
  );

  return v_document;
end;
$$;


-- ============================================================
-- 14. GRANT FUNCTION EXECUTION
-- ============================================================

grant execute on function public.current_user_role()
to authenticated;

grant execute on function public.is_admin()
to authenticated;

grant execute on function public.is_marketing()
to authenticated;

grant execute on function public.is_staff()
to authenticated;

grant execute on function public.marketing_update_application_status(
  uuid,
  text,
  text
)
to authenticated;

grant execute on function public.admin_update_application_status(
  uuid,
  text,
  text
)
to authenticated;

grant execute on function public.review_application_document(
  uuid,
  text,
  text
)
to authenticated;


-- ============================================================
-- COMPLETE
-- ============================================================