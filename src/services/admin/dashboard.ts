import { getSupabaseClient } from '../auth/supabaseClient';

export interface ActivityLogItem {
  id: string;
  event_type: string;
  actor_id: string | null;
  actor_email: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminDashboardMetrics {
  totalUsers: number;
  activeUsers24h: number;
  totalLogs: number;
  recentLogs: ActivityLogItem[];
}

export async function fetchAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const supabase = getSupabaseClient();
  const activeSinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [totalUsersResult, activeUsersResult, totalLogsResult, recentLogsResult] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('last_seen_at', activeSinceIso),
    supabase.from('activity_logs').select('id', { count: 'exact', head: true }),
    supabase
      .from('activity_logs')
      .select('id,event_type,actor_id,actor_email,metadata,created_at')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const firstError =
    totalUsersResult.error ||
    activeUsersResult.error ||
    totalLogsResult.error ||
    recentLogsResult.error;

  if (firstError) {
    throw new Error(
      'Admin tables are not ready yet. Run supabase/admin_dashboard_setup.sql in Supabase SQL Editor.',
    );
  }

  return {
    totalUsers: totalUsersResult.count || 0,
    activeUsers24h: activeUsersResult.count || 0,
    totalLogs: totalLogsResult.count || 0,
    recentLogs: recentLogsResult.data || [],
  };
}

export async function appendActivityLog(
  eventType: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const supabase = getSupabaseClient();
  const sessionResult = await supabase.auth.getSession();
  const user = sessionResult.data.session?.user;

  await supabase.from('activity_logs').insert({
    event_type: eventType,
    actor_id: user?.id || null,
    actor_email: user?.email || null,
    metadata: metadata || null,
  });
}

export async function syncProfileSnapshot(): Promise<void> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return;
  }

  const metadata = data.user.user_metadata ?? {};

  /*
   * IMPORTANT:
   * Do NOT overwrite the role stored in profiles.
   *
   * The profiles table is the source of truth for whether
   * a user is an admin or client.
   *
   * Previously this function did:
   *
   *   metadata.role === 'admin' ? 'admin' : 'client'
   *
   * and then upserted that value into profiles.
   *
   * If metadata.role was missing, an existing admin could
   * accidentally be changed back to client.
   */

  const profileData = {
    id: data.user.id,
    email: data.user.email || '',
    full_name:
      (metadata.full_name as string | undefined) ||
      (metadata.name as string | undefined) ||
      'User',
    avatar_url:
      (metadata.avatar_url as string | undefined) || null,

    account_type:
      metadata.account_type === 'business'
        ? 'business'
        : 'individual',

    business_name:
      (metadata.business_name as string | undefined) || null,

    business_registration_number:
      (metadata.business_registration_number as string | undefined) ||
      null,

    contact_number:
      (metadata.contact_number as string | undefined) || null,

    last_seen_at: new Date().toISOString(),
  };

  /*
   * Update the existing profile without touching role.
   */
  const { data: existingProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError) {
    console.warn(
      'Unable to check existing profile:',
      profileError.message,
    );
    return;
  }

  if (existingProfile) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', data.user.id);

    if (updateError) {
      console.warn(
        'Unable to update profile snapshot:',
        updateError.message,
      );
    }

    return;
  }

  /*
   * Only create a new profile when one does not already exist.
   *
   * New users are clients by default.
   */
  const { error: insertError } = await supabase
    .from('profiles')
    .insert({
      ...profileData,
      role: 'client',
    });

  if (insertError) {
    console.warn(
      'Unable to create profile snapshot:',
      insertError.message,
    );
  }
}