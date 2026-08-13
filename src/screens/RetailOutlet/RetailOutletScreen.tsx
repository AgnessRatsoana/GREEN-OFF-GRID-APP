import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import { PACKAGES } from '../../data/packages';
import { RootStackParamList } from '../../navigation/types';
import { useApplicationsStore } from '../../store/applicationsStore';
import { appTheme } from '../../theme';

export function RetailOutletScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const applications = useApplicationsStore((s) => s.applications);

  const appliedPackages = PACKAGES.filter((pkg) =>
    applications.some((application) => application.packageId === pkg.id),
  );
  const hasActiveApplication = appliedPackages.length > 0;
  const recommendedPackage = !hasActiveApplication ? PACKAGES[0] : null;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Packages</Text>
        <View style={styles.headerIcon}>
          <Ionicons name="cube-outline" size={20} color="#24b8b8" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
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
              {appliedPackages.map((pkg) => {
                const application = applications.find((entry) => entry.packageId === pkg.id);

                return (
                  <Pressable
                    key={pkg.id}
                    style={styles.appliedCard}
                    onPress={() =>
                      navigation.navigate(ROUTES.APPLICATION_STATUS, {
                        packageId: pkg.id,
                        status: application?.status,
                      })
                    }
                  >
                    <Image source={pkg.imageSource} style={styles.appliedImage} contentFit="cover" />
                    <View style={styles.appliedContent}>
                      <Text style={styles.appliedTitle}>{pkg.title}</Text>
                      <View style={styles.statusPill}>
                        <Text style={styles.statusPillText}>{application?.status ?? 'Submitted'}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#6f8c8c" />
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(36,184,184,0.18)',
  },
  headerTitle: {
    color: '#1a3f3f',
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
    borderColor: 'rgba(36,184,184,0.2)',
    backgroundColor: '#f7fdfd',
    padding: appTheme.spacing.md,
    rowGap: 8,
  },
  recommendLabel: {
    color: '#24b8b8',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  recommendTitle: {
    color: '#123f3f',
    fontSize: 22,
    fontWeight: '900',
  },
  recommendBody: {
    color: '#4f6e6e',
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
    backgroundColor: '#24b8b8',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  recommendBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionTitle: {
    color: '#1a3f3f',
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
    borderColor: 'rgba(36,184,184,0.18)',
    backgroundColor: '#FFFFFF',
    padding: appTheme.spacing.sm,
    columnGap: appTheme.spacing.sm,
  },
  appliedImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  appliedContent: {
    flex: 1,
    rowGap: 6,
  },
  appliedTitle: {
    color: '#1a3f3f',
    fontSize: 15,
    fontWeight: '700',
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(36,184,184,0.14)',
  },
  statusPillText: {
    color: '#0f6464',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  packageList: {
    rowGap: appTheme.spacing.sm,
  },
  packageCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.18)',
    backgroundColor: '#FFFFFF',
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
    color: '#1a3f3f',
    fontSize: 15,
    fontWeight: '800',
  },
  packagePrice: {
    color: '#0f6464',
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
    backgroundColor: '#24b8b8',
  },
  purpleBtn: {
    backgroundColor: '#b89aff',
  },
  packageBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
