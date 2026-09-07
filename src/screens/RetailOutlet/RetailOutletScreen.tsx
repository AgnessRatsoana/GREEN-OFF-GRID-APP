import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import { PACKAGES } from '../../data/packages';
import { RootStackParamList } from '../../navigation/types';
import { fetchMyApplications, type Application } from '../../services/applications/applications';
import { appTheme } from '../../theme';
import type { AppTheme } from '../../theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { FLOATING_NAV_CONTENT_INSET } from '../../components/common/FloatingBottomNav';

const STATUS_COLORS: Record<string, string> = {
  Submitted: '#24b8b8',
  'Under Review': '#f59e0b',
  Consultation: '#8b5cf6',
  Approved: '#178a6a',
  Rejected: '#d14444',
};

export function RetailOutletScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const theme = useAppTheme();
  const styles = createStyles(theme);

  // Load the customer's real applications from Supabase.
  const loadApplications = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    try {
      setApplications(await fetchMyApplications());
    } catch {
      // Keep existing list on failure.
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Refresh whenever the screen gains focus so status changes show up.
  useFocusEffect(
    useCallback(() => {
      loadApplications();
    }, []),
  );

  const hasActiveApplication = applications.length > 0;
  const recommendedPackage = !hasActiveApplication ? PACKAGES[0] : null;

  const getPackage = (packageId: string) => PACKAGES.find((pkg) => pkg.id === packageId);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Packages</Text>
        <View style={styles.headerIcon}>
          <Ionicons name="cube-outline" size={20} color={theme.colors.primaryAccent} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + FLOATING_NAV_CONTENT_INSET }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadApplications(true)} tintColor={theme.colors.primaryAccent} />
        }
      >
        {isLoading ? <ActivityIndicator color={theme.colors.primaryAccent} style={{ marginBottom: 12 }} /> : null}

        {recommendedPackage ? (
          <View style={styles.recommendCard}>
            <Text style={styles.recommendLabel}>Recommended for you</Text>
            <Text style={styles.recommendTitle}>{recommendedPackage.title}</Text>
            <Text style={styles.recommendBody}>
              You have no active package application yet. Start with this package to unlock your franchise journey.
            </Text>
            <Pressable
              style={styles.recommendBtn}
              onPress={() => navigation.navigate(ROUTES.PACKAGE_DETAILS, { packageId: recommendedPackage.id })}
            >
              <Text style={styles.recommendBtnText}>View package</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>Your applications</Text>
            <View style={styles.appliedList}>
              {applications.map((application) => {
                const pkg = getPackage(application.package_id);
                const statusColor = STATUS_COLORS[application.status] ?? '#24b8b8';

                return (
                  <Pressable
                    key={application.id}
                    style={styles.appliedCard}
                    onPress={() =>
                      navigation.navigate(ROUTES.APPLICATION_STATUS, {
                        applicationId: application.id,
                      })
                    }
                  >
                    {pkg ? (
                      <Image source={pkg.imageSource} style={styles.appliedImage} contentFit="cover" />
                    ) : (
                      <View style={[styles.appliedImage, styles.appliedImageFallback]}>
                        <Ionicons name="cube-outline" size={22} color={theme.colors.primaryAccent} />
                      </View>
                    )}
                    <View style={styles.appliedContent}>
                      <Text style={styles.appliedTitle}>{application.package_title}</Text>
                      <Text style={styles.appliedDate}>
                        Applied {new Date(application.created_at).toLocaleDateString()}
                      </Text>
                      <View style={[styles.statusPill, { backgroundColor: `${statusColor}20` }]}>
                        <Text style={[styles.statusPillText, { color: statusColor }]}>{application.status}</Text>
                      </View>
                    </View>
                    <View style={styles.trackWrap}>
                      <Text style={styles.trackText}>Track</Text>
                      <Ionicons name="chevron-forward" size={16} color={theme.colors.primaryAccent} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Available packages</Text>
        <View style={styles.packageList}>
          {PACKAGES.map((pkg) => {
            const isTeal = pkg.buttonVariant === 'teal';

            return (
              <Pressable
                key={pkg.id}
                style={styles.packageCard}
                onPress={() => navigation.navigate(ROUTES.PACKAGE_DETAILS, { packageId: pkg.id })}
              >
                <Image source={pkg.imageSource} style={styles.packageImage} contentFit="cover" />
                <View style={styles.packageContent}>
                  <Text style={styles.packageTitle}>{pkg.title}</Text>
                  <Text style={styles.packagePrice}>{pkg.price}</Text>
                  <View style={[styles.packageBtn, isTeal ? styles.tealBtn : styles.purpleBtn]}>
                    <Text style={styles.packageBtnText}>{pkg.buttonLabel}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: appTheme.spacing.md,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(36,184,184,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: appTheme.spacing.md,
    rowGap: appTheme.spacing.md,
  },
  recommendCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: appTheme.spacing.md,
    rowGap: 8,
  },
  recommendLabel: {
    color: theme.colors.primaryAccent,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  recommendTitle: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
  },
  recommendBody: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  recommendBtn: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    columnGap: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.primaryAccent,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  recommendBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: appTheme.spacing.sm,
  },
  appliedList: {
    rowGap: appTheme.spacing.sm,
  },
  appliedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: appTheme.spacing.sm,
    columnGap: appTheme.spacing.sm,
  },
  appliedImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  appliedImageFallback: {
    backgroundColor: 'rgba(36,184,184,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appliedContent: {
    flex: 1,
    rowGap: 4,
  },
  appliedTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  appliedDate: {
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  trackWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 2,
  },
  trackText: {
    color: theme.colors.primaryAccent,
    fontSize: 12,
    fontWeight: '700',
  },
  packageList: {
    rowGap: appTheme.spacing.sm,
  },
  packageCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 124,
  },
  packageImage: {
    width: 120,
    height: '100%',
  },
  packageContent: {
    flex: 1,
    padding: appTheme.spacing.sm,
    justifyContent: 'center',
    rowGap: 4,
  },
  packageTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  packagePrice: {
    color: theme.colors.primaryAccent,
    fontSize: 18,
    fontWeight: '900',
  },
  packageBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tealBtn: {
    backgroundColor: theme.colors.primaryAccent,
  },
  purpleBtn: {
    backgroundColor: theme.colors.supportPurple,
  },
  packageBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
