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
  const role = metadata.role === 'admin' ? 'admin' : 'client';

  await supabase.from('profiles').upsert({
    id: data.user.id,
    email: data.user.email || '',
    full_name: (metadata.full_name as string | undefined) || (metadata.name as string | undefined) || 'User',
    avatar_url: (metadata.avatar_url as string | undefined) || null,
    role,
    last_seen_at: new Date().toISOString(),
  });
}
