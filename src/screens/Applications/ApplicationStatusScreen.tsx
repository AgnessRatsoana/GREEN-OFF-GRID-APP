import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import { PACKAGES } from '../../data/packages';
import { RootStackParamList } from '../../navigation/types';
import { useApplicationsStore } from '../../store/applicationsStore';
import { appTheme } from '../../theme';

export function ApplicationStatusScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, typeof ROUTES.APPLICATION_STATUS>>();
  const insets = useSafeAreaInsets();

  const packageId = route.params?.packageId ?? 'empower-kit';
  const pkg = PACKAGES.find((item) => item.id === packageId) ?? PACKAGES[0];
  const storedApplication = useApplicationsStore((s) => s.getApplication(packageId));
  const status = storedApplication?.status ?? route.params?.status ?? 'Submitted';

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={appTheme.colors.primaryAccent} />
        </Pressable>
        <Text style={styles.headerTitle}>Application status</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
            <Text style={styles.statusText}>{status}</Text>
          </View>

          <Text style={styles.packageTitle}>{pkg.title}</Text>
          <Text style={styles.subtitle}>Your application has been received and is now in review.</Text>
        </View>

        <View style={styles.timelineWrap}>
          <Text style={styles.sectionTitle}>Application progress</Text>

          {[
            { label: 'Submitted', done: true },
            { label: 'Document review', done: true },
            { label: 'Consultation', done: false },
            { label: 'Approved / follow-up', done: false },
          ].map((item, index) => (
            <View key={item.label} style={styles.timelineRow}>
              <View style={[styles.timelineDot, item.done && styles.timelineDotDone]} />
              <View style={styles.timelineTextWrap}>
                <Text style={[styles.timelineLabel, item.done && styles.timelineLabelDone]}>{item.label}</Text>
                <Text style={styles.timelineMeta}>
                  {index === 0 && 'Application received'}
                  {index === 1 && 'Your package details are being reviewed'}
                  {index === 2 && 'A consultant will contact you'}
                  {index === 3 && 'Final approval and onboarding'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Next steps</Text>
          <Text style={styles.infoText}>We will contact you with the next actions, documentation needed, and your onboarding timeline.</Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate(ROUTES.MAIN_DRAWER)}>
          <Text style={styles.primaryButtonText}>Back to dashboard</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: appTheme.spacing.md,
    marginBottom: appTheme.spacing.sm,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(36, 184, 184, 0.3)',
    backgroundColor: '#f4fcfc',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#123f3f',
  },
  headerSpacer: {
    width: 38,
  },
  body: {
    paddingHorizontal: appTheme.spacing.md,
    rowGap: appTheme.spacing.md,
  },
  statusCard: {
    backgroundColor: '#f5fdfd',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.15)',
    padding: appTheme.spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#24b8b8',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    columnGap: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  packageTitle: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: '900',
    color: '#123f3f',
  },
  subtitle: {
    marginTop: 8,
    color: '#4f6e6e',
    fontSize: 15,
    lineHeight: 22,
  },
  timelineWrap: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.12)',
    padding: appTheme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#123f3f',
    marginBottom: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: 12,
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    backgroundColor: '#dfeaea',
  },
  timelineDotDone: {
    backgroundColor: '#24b8b8',
  },
  timelineTextWrap: {
    flex: 1,
  },
  timelineLabel: {
    color: '#6e8a8a',
    fontWeight: '700',
    fontSize: 14,
  },
  timelineLabelDone: {
    color: '#123f3f',
  },
  timelineMeta: {
    color: '#4f6e6e',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#f9fdfd',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.12)',
    padding: appTheme.spacing.md,
  },
  infoText: {
    color: '#4f6e6e',
    fontSize: 14,
    lineHeight: 22,
  },
  primaryButton: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: appTheme.spacing.sm,
    backgroundColor: '#24b8b8',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
