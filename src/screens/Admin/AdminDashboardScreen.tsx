import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../../navigation/types';
import {
  type AdminDashboardMetrics,
  fetchAdminDashboardMetrics,
} from '../../services/admin/dashboard';
import { appTheme } from '../../theme';

export function AdminDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const nextMetrics = await fetchAdminDashboardMetrics();
      setMetrics(nextMetrics);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load admin metrics.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 14 }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#24b8b8" />
        </Pressable>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <View style={styles.decorIcon}>
          <Ionicons name="shield-checkmark-outline" size={22} color="#24b8b8" />
        </View>
      </View>

      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#24b8b8" />
        </View>
      ) : error ? (
        <View style={styles.centerWrap}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.helpText}>
            Run supabase/admin_dashboard_setup.sql in Supabase SQL Editor, then refresh.
          </Text>
          <Pressable style={styles.refreshBtn} onPress={loadMetrics}>
            <Text style={styles.refreshBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollBody}>
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total Users</Text>
              <Text style={styles.metricValue}>{metrics?.totalUsers ?? 0}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Active 24h</Text>
              <Text style={styles.metricValue}>{metrics?.activeUsers24h ?? 0}</Text>
            </View>
          </View>

          <View style={styles.metricCardLarge}>
            <Text style={styles.metricLabel}>Total Activity Logs</Text>
            <Text style={styles.metricValue}>{metrics?.totalLogs ?? 0}</Text>
          </View>

          <View style={styles.logsCard}>
            <View style={styles.logsHeaderRow}>
              <Text style={styles.cardTitle}>Recent Activity</Text>
              <Pressable style={styles.refreshBtnSmall} onPress={loadMetrics}>
                <Text style={styles.refreshBtnSmallText}>Refresh</Text>
              </Pressable>
            </View>

            {metrics?.recentLogs?.length ? (
              metrics.recentLogs.map((item) => (
                <View key={item.id} style={styles.logRow}>
                  <Text style={styles.logEvent}>{item.event_type}</Text>
                  <Text style={styles.logMeta}>{item.actor_email || 'Unknown user'}</Text>
                  <Text style={styles.logTime}>{new Date(item.created_at).toLocaleString()}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.logMeta}>No logs yet.</Text>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: appTheme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(36,184,184,0.18)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(36,184,184,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: appTheme.spacing.sm,
  },
  headerTitle: {
    flex: 1,
    color: '#123f3f',
    fontSize: 22,
    fontWeight: '800',
  },
  decorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(36,184,184,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: appTheme.spacing.md,
  },
  title: {
    color: '#123f3f',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#5d7676',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  scrollBody: {
    paddingTop: appTheme.spacing.md,
    paddingBottom: appTheme.spacing.xl,
    rowGap: appTheme.spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    columnGap: appTheme.spacing.sm,
  },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    padding: appTheme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.2)',
    backgroundColor: '#f7fdfd',
  },
  metricCardLarge: {
    borderRadius: 16,
    padding: appTheme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.2)',
    backgroundColor: '#f7fdfd',
  },
  metricLabel: {
    color: '#4f6f6f',
    fontSize: 13,
    fontWeight: '600',
  },
  metricValue: {
    color: '#123f3f',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 6,
  },
  card: {
    marginTop: appTheme.spacing.lg,
    borderRadius: 18,
    padding: appTheme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(36, 184, 184, 0.2)',
    backgroundColor: '#f7fdfd',
  },
  cardTitle: {
    color: '#0f6464',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: appTheme.spacing.sm,
  },
  cardItem: {
    color: '#355858',
    fontSize: 14,
    lineHeight: 20,
  },
  logsCard: {
    borderRadius: 18,
    padding: appTheme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(36, 184, 184, 0.2)',
    backgroundColor: '#f7fdfd',
    rowGap: appTheme.spacing.sm,
  },
  logsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logRow: {
    borderRadius: 12,
    padding: appTheme.spacing.sm,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.14)',
  },
  logEvent: {
    color: '#123f3f',
    fontSize: 13,
    fontWeight: '700',
  },
  logMeta: {
    color: '#587272',
    fontSize: 12,
    marginTop: 3,
  },
  logTime: {
    color: '#6e8383',
    fontSize: 11,
    marginTop: 4,
  },
  errorText: {
    color: '#bf3a3a',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  helpText: {
    marginTop: appTheme.spacing.sm,
    color: '#5d7676',
    fontSize: 13,
    textAlign: 'center',
  },
  refreshBtn: {
    marginTop: appTheme.spacing.md,
    borderRadius: 12,
    backgroundColor: '#24b8b8',
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
  },
  refreshBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  refreshBtnSmall: {
    borderRadius: 10,
    backgroundColor: '#24b8b8',
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: 6,
  },
  refreshBtnSmallText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
