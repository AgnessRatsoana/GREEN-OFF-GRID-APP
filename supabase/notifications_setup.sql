-- Run after orders, applications, and enquiry chat tables exist.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (
    type in (
      'message',
      'order',
      'order_status',
      'cart',
      'application',
      'application_status'
    )
  ),
  title text not null,
  message text not null,
  reference_id text,
  reference_type text check (
    reference_type is null
    or reference_type in ('enquiry', 'order', 'application', 'cart')
  ),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications"
on public.notifications for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications"
on public.notifications for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own notifications" on public.notifications;
create policy "Users can delete their own notifications"
on public.notifications for delete to authenticated
using (auth.uid() = user_id);

create index if not exists notifications_user_created_idx
on public.notifications(user_id, created_at desc);

create index if not exists notifications_user_unread_idx
on public.notifications(user_id, is_read)
where is_read = false;

create or replace function public.create_customer_notification(
  target_user_id uuid,
  notification_type text,
  notification_title text,
  notification_message text,
  target_reference_id text,
  target_reference_type text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_user_id is null then
    return;
  end if;

  insert into public.notifications (
    user_id,
    type,
    title,
    message,
    reference_id,
    reference_type
  ) values (
    target_user_id,
    notification_type,
    notification_title,
    notification_message,
    target_reference_id,
    target_reference_type
  );
end;
$$;

create or replace function public.notify_enquiry_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  customer_id uuid;
begin
  if new.sender_role <> 'marketing' then
    return new;
  end if;

  select conversation.customer_id
  into customer_id
  from public.enquiry_conversations conversation
  where conversation.id = new.conversation_id;

  perform public.create_customer_notification(
    customer_id,
    'message',
    'New message from Green Off-Grid',
    left(new.body, 180),
    new.conversation_id::text,
    'enquiry'
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_enquiry_message on public.enquiry_messages;
create trigger trg_notify_enquiry_message
after insert on public.enquiry_messages
for each row
execute function public.notify_enquiry_message();

create or replace function public.notify_order_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.create_customer_notification(
    new.user_id,
    'order',
    'Order placed',
    'Your order has been placed and is ready to track.',
    new.id::text,
    'order'
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_order_created on public.orders;
create trigger trg_notify_order_created
after insert on public.orders
for each row
execute function public.notify_order_created();

create or replace function public.notify_order_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    perform public.create_customer_notification(
      new.user_id,
      'order_status',
      'Order status updated',
      'Your order is now marked as ' || replace(new.status, '_', ' ') || '.',
      new.id::text,
      'order'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_order_status_changed on public.orders;
create trigger trg_notify_order_status_changed
after update of status on public.orders
for each row
execute function public.notify_order_status_changed();

create or replace function public.notify_application_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.create_customer_notification(
    new.user_id,
    'application',
    'Package application submitted',
    'Your application for ' || coalesce(new.package_title, 'your package') || ' was submitted.',
    new.id::text,
    'application'
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_application_created on public.applications;
create trigger trg_notify_application_created
after insert on public.applications
for each row
execute function public.notify_application_created();

create or replace function public.notify_application_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    perform public.create_customer_notification(
      new.user_id,
      'application_status',
      'Application status updated',
      'Your package application is now ' || new.status || '.',
      new.id::text,
      'application'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_application_status_changed on public.applications;
create trigger trg_notify_application_status_changed
after update of status on public.applications
for each row
execute function public.notify_application_status_changed();

revoke all on function public.create_customer_notification(
  uuid, text, text, text, text, text
) from public;
