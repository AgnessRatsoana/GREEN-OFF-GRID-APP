import type { RealtimeChannel } from '@supabase/supabase-js';

import { getSupabaseClient } from '../auth/supabaseClient';

export type NotificationType =
  | 'message'
  | 'order'
  | 'order_status'
  | 'cart'
  | 'application'
  | 'application_status';

export type NotificationReferenceType =
  | 'enquiry'
  | 'order'
  | 'application'
  | 'cart'
  | null;

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId: string | null;
  referenceType: NotificationReferenceType;
  isRead: boolean;
  createdAt: string;
}

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  created_at: string;
}

function mapNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as NotificationType,
    title: row.title,
    message: row.message,
    referenceId: row.reference_id,
    referenceType: row.reference_type as NotificationReferenceType,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

/**
 * Fetch all notifications belonging to the currently signed-in user.
 */
export async function fetchNotifications(): Promise<AppNotification[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('notifications')
    .select(
      'id, user_id, type, title, message, reference_id, reference_type, is_read, created_at',
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as NotificationRow[]).map(mapNotification);
}

/**
 * Fetch only unread notifications for the current user.
 */
export async function fetchUnreadNotifications(): Promise<AppNotification[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('notifications')
    .select(
      'id, user_id, type, title, message, reference_id, reference_type, is_read, created_at',
    )
    .eq('is_read', false)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as NotificationRow[]).map(mapNotification);
}

/**
 * Fetch the unread notification count for the current user.
 */
export async function fetchUnreadNotificationCount(): Promise<number> {
  const supabase = getSupabaseClient();

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

/**
 * Mark one notification as read.
 */
export async function markNotificationAsRead(
  notificationId: string,
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Mark every notification belonging to the current user as read.
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  const supabase = getSupabaseClient();

  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error(userError?.message ?? 'No authenticated user found.');
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userData.user.id)
    .eq('is_read', false);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Delete one notification belonging to the current user.
 *
 * This is useful later for dismissing old notifications.
 */
export async function deleteNotification(
  notificationId: string,
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Subscribe to notification changes for the signed-in user.
 *
 * The callback receives the newly inserted notification.
 */
export async function subscribeToNotifications(
  onNotification: (notification: AppNotification) => void,
): Promise<() => void> {
  const supabase = getSupabaseClient();

  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError || !userData.user) {
    return () => undefined;
  }

  const userId = userData.user.id;

  const channel: RealtimeChannel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const notification = mapNotification(
          payload.new as NotificationRow,
        );

        onNotification(notification);
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

/**
 * Create a notification.
 *
 * IMPORTANT:
 * The mobile application should NOT use this function with
 * privileged credentials.
 *
 * Because the notifications table intentionally does not give
 * normal customers INSERT access, notification creation should
 * eventually happen through trusted backend/server logic.
 */
export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId?: string | null;
  referenceType?: NotificationReferenceType;
}): Promise<AppNotification> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      reference_id: input.referenceId ?? null,
      reference_type: input.referenceType ?? null,
    })
    .select(
      'id, user_id, type, title, message, reference_id, reference_type, is_read, created_at',
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapNotification(data as NotificationRow);
}