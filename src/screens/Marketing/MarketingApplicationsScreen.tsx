import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddressMapPreview } from '../../components/maps/AddressMapPreview';
import type { RootStackParamList } from '../../navigation/types';
import {
  fetchAllApplications,
  updateApplicationStatus,
  type Application,
  type ApplicationStatus,
} from '../../services/applications/applications';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const STATUS_TABS: Array<{ key: 'all' | ApplicationStatus; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'Submitted', label: 'Submitted' },
  { key: 'Under Review', label: 'Under Review' },
  { key: 'Consultation', label: 'Consultation' },
  { key: 'Approved', label: 'Approved' },
  { key: 'Rejected', label: 'Rejected' },
];

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  Submitted: '#24b8b8',
  'Under Review': '#f59e0b',
  Consultation: '#8b5cf6',
  Approved: '#178a6a',
  Rejected: '#d14444',
};

const NEXT_STATUS: Record<ApplicationStatus, ApplicationStatus | null> = {
  Submitted: 'Under Review',
  'Under Review': 'Consultation',
  Consultation: 'Approved',
  Approved: null,
  Rejected: null,
};

export function MarketingApplicationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationStatus>('all');

  const filteredApplications = statusFilter === 'all'
    ? applications
    : applications.filter((app) => app.status === statusFilter);

  const statusCounts = {
    all: applications.length,
    Submitted: applications.filter((a) => a.status === 'Submitted').length,
    'Under Review': applications.filter((a) => a.status === 'Under Review').length,
    Consultation: applications.filter((a) => a.status === 'Consultation').length,
    Approved: applications.filter((a) => a.status === 'Approved').length,
    Rejected: applications.filter((a) => a.status === 'Rejected').length,
  };

  const loadApplications = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      setErrorMessage(null);
      setApplications(await fetchAllApplications());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load applications.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleAdvance = async (application: Application) => {
    const nextStatus = NEXT_STATUS[application.status];
    if (!nextStatus || updatingId) return;

    setUpdatingId(application.id);
    try {
      const updated = await updateApplicationStatus(application.id, nextStatus);
      setApplications((previous) =>
        previous.map((entry) => (entry.id === application.id ? updated : entry)),
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#24b8b8" />
        </Pressable>
        <View>
          <Text style={styles.title}>Applications</Text>
          <Text style={styles.subtitle}>Review and process franchise applications</Text>
        </View>
      </View>

      {/* Status filter tabs */}
      <View style={styles.tabsRow}>
        {STATUS_TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, statusFilter === tab.key && styles.tabActive]}
            onPress={() => setStatusFilter(tab.key)}
          >
            <Text style={[styles.tabText, statusFilter === tab.key && styles.tabTextActive]}>
              {tab.label} ({statusCounts[tab.key]})
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadApplications(true)} tintColor="#24b8b8" />
        }
      >
        {isLoading ? <ActivityIndicator color="#24b8b8" style={{ marginTop: 20 }} /> : null}
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {!isLoading && !errorMessage && filteredApplications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={42} color="#89a3a3" />
            <Text style={styles.emptyTitle}>
              {statusFilter === 'all' ? 'No applications yet' : `No ${statusFilter.toLowerCase()} applications`}
            </Text>
            <Text style={styles.emptyBody}>
              {statusFilter === 'all'
                ? 'Franchise applications will appear here once submitted.'
                : 'No applications with this status.'}
            </Text>
          </View>
        ) : null}

        {filteredApplications.map((application) => {
          const nextStatus = NEXT_STATUS[application.status];
          const isUpdating = updatingId === application.id;
          const mapQuery = [application.address, application.city, application.province, 'South Africa']
            .filter(Boolean)
            .join(', ');

          return (
            <View key={application.id} style={styles.applicationCard}>
              <View style={styles.applicationHeader}>
                <View style={styles.applicationHeaderText}>
                  <Text style={styles.packageTitle}>{application.package_title}</Text>
                  <Text style={styles.applicationDate}>{formatDate(application.created_at)}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: `${STATUS_COLORS[application.status]}20` }]}>
                  <Text style={[styles.statusPillText, { color: STATUS_COLORS[application.status] }]}>
                    {application.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Applicant info */}
              <View style={styles.applicantCard}>
                <View style={styles.avatarWrap}>
                  <Ionicons name="person" size={16} color="#0f6464" />
                </View>
                <View style={styles.applicantInfo}>
                  <Text style={styles.applicantName}>{application.full_name}</Text>
                  <Text style={styles.applicantMeta}>{application.email}</Text>
                  <Text style={styles.applicantMeta}>{application.phone}</Text>
                  {application.business_name ? (
                    <Text style={styles.applicantMeta}>{application.business_name}</Text>
                  ) : null}
                  <Text style={styles.applicantAddress}>
                    {[application.address, application.city, application.province]
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                </View>
              </View>

              {/* Details */}
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Project type</Text>
                  <Text style={styles.detailValue}>{application.project_type ?? 'Not specified'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Budget</Text>
                  <Text style={styles.detailValue}>{application.budget ?? 'Not specified'}</Text>
                </View>
              </View>

              {application.notes ? (
                <View style={styles.notesCard}>
                  <Text style={styles.notesLabel}>Notes</Text>
                  <Text style={styles.notesText}>{application.notes}</Text>
                </View>
              ) : null}

              {/* Map */}
              {application.address ? (
                <AddressMapPreview query={mapQuery} style={styles.map} />
              ) : null}

              {/* Advance status */}
              {nextStatus ? (
                <Pressable
                  style={[styles.actionButton, isUpdating && styles.actionButtonDisabled]}
                  onPress={() => handleAdvance(application)}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.actionButtonText}>Move to {nextStatus}</Text>
                      <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                    </>
                  )}
                </Pressable>
              ) : (
                <View style={styles.finalNote}>
                  <Ionicons
                    name={application.status === 'Approved' ? 'checkmark-done' : 'close-circle'}
                    size={15}
                    color={STATUS_COLORS[application.status]}
                  />
                  <Text style={[styles.finalNoteText, { color: STATUS_COLORS[application.status] }]}>
                    {application.status === 'Approved' ? 'Application approved' : 'Application rejected'}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(36,184,184,0.18)',
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  title: { color: '#123f3f', fontSize: 21, fontWeight: '800' },
  subtitle: { color: '#668080', fontSize: 12, marginTop: 2 },
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 8,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 4,
  },
  tab: {
    borderRadius: 999,
    backgroundColor: '#eef3f3',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tabActive: {
    backgroundColor: '#24b8b8',
  },
  tabText: {
    color: '#668080',
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: { padding: 18, rowGap: 14 },
  errorText: { color: '#b34040', textAlign: 'center', marginTop: 12 },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.2)',
    backgroundColor: '#f9fdfd',
    alignItems: 'center',
    paddingVertical: 26,
    rowGap: 8,
  },
  emptyTitle: { color: '#1a3f3f', fontSize: 18, fontWeight: '700' },
  emptyBody: { color: '#5e7a7a', fontSize: 13, textAlign: 'center' },
  applicationCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.2)',
    backgroundColor: '#FFFFFF',
    padding: 14,
    rowGap: 10,
  },
  applicationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  applicationHeaderText: { flex: 1, marginRight: 10 },
  packageTitle: { color: '#123f3f', fontSize: 15, fontWeight: '800' },
  applicationDate: { color: '#668080', fontSize: 12, marginTop: 2 },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  applicantCard: {
    flexDirection: 'row',
    columnGap: 10,
    borderRadius: 12,
    backgroundColor: '#f7fdfd',
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.16)',
    padding: 10,
  },
  avatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(36,184,184,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applicantInfo: { flex: 1 },
  applicantName: { color: '#123f3f', fontSize: 14, fontWeight: '800' },
  applicantMeta: { color: '#668080', fontSize: 11, marginTop: 2 },
  applicantAddress: { color: '#4f6e6e', fontSize: 12, marginTop: 4 },
  detailsRow: { flexDirection: 'row', columnGap: 16 },
  detailItem: { flex: 1 },
  detailLabel: { color: '#597575', fontSize: 11, fontWeight: '600' },
  detailValue: { color: '#123f3f', fontSize: 13, fontWeight: '700', marginTop: 2 },
  notesCard: {
    borderRadius: 10,
    backgroundColor: '#fffbf5',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    padding: 10,
  },
  notesLabel: { color: '#b07908', fontSize: 11, fontWeight: '700' },
  notesText: { color: '#4f6e6e', fontSize: 12, marginTop: 4, lineHeight: 18 },
  map: { height: 160 },
  actionButton: {
    borderRadius: 12,
    backgroundColor: '#24b8b8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 8,
    paddingVertical: 11,
  },
  actionButtonDisabled: { opacity: 0.55 },
  actionButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  finalNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 6,
    paddingVertical: 8,
  },
  finalNoteText: { fontSize: 13, fontWeight: '700' },
});
