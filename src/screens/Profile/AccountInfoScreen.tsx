import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { RootStackParamList } from '../../navigation/types';
import {
  deactivateAccount,
  deleteAccountPermanently,
} from '../../services/auth/authActions';
import { clearAuthTokens } from '../../services/storage/secureStore';
import { useAuthStore } from '../../store/authStore';
import { appTheme } from '../../theme';
import type { AppTheme } from '../../theme';

const COMPLIANCE_BADGES = [
  'SA Law Governed',
  'Consumer Protection Act 68',
  'POPIA Compliant',
  '256-bit Encrypted Records',
  'SANS & NRS 097',
  'Grid Interconnection Certified',
  'Mentec Foundation',
  'Level 1 B-BBEE Partner',
];

const POLICY_LINKS = [
  'Terms & Conditions',
  'POPIA Privacy Policy',
  'Returns & Refunds',
  'Franchise Agreement Terms',
];

export function AccountInfoScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endSessionLocally = async () => {
    await clearAuthTokens();
    clearSession();
    navigation.reset({ index: 0, routes: [{ name: ROUTES.LOGIN }] });
  };

  const handleDeactivate = () => {
    if (!user) {
      return;
    }

    Alert.alert(
      'Deactivate Account',
      'Your account will be deactivated and you will be logged out. Contact support to reactivate it. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              setError(null);
              setIsDeactivating(true);
              await deactivateAccount(user.id);
              await endSessionLocally();
            } catch (deactivateError) {
              setError(
                deactivateError instanceof Error
                  ? deactivateError.message
                  : 'Unable to deactivate your account.'
              );
            } finally {
              setIsDeactivating(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    if (!user) {
      return;
    }

    Alert.alert(
      'Delete Account',
      'This permanently deletes your account and all associated data. This cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setError(null);
              setIsDeleting(true);
              await deleteAccountPermanently();
              await endSessionLocally();
            } catch (deleteError) {
              setError(
                deleteError instanceof Error
                  ? deleteError.message
                  : 'Unable to delete your account.'
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.primaryAccent} />
        </Pressable>
        <Text style={styles.headerTitle}>Account Info</Text>
        <View style={styles.iconDecor}>
          <Ionicons name="shield-checkmark-outline" size={22} color={theme.colors.primaryAccent} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Legal Governance & Compliance Disclosures</Text>
        <Text style={styles.sectionSubtitle}>
          Official terms of operation for Green Off-Grid Sales (Pty) Ltd and Mentec Foundation NPC partners.
        </Text>

        <View style={styles.badgeRow}>
          {COMPLIANCE_BADGES.map((badge) => (
            <View key={badge} style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ))}
        </View>

        <View style={styles.policyLinkRow}>
          {POLICY_LINKS.map((link) => (
            <View key={link} style={styles.policyLinkPill}>
              <Text style={styles.policyLinkText}>{link}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. General Terms of Sale & Platform Use</Text>
          <Text style={styles.paragraph}>
            Welcome to Green Off-Grid Sales (Pty) Ltd ("Green Off-Grid"). By browsing this portal, creating an
            account, or submitting orders for solar components and containerized franchise outlets, you agree to
            be bound by these Terms and Conditions.
          </Text>

          <Text style={styles.subTitle}>1.1 Commercial Equipment Specifications</Text>
          <Text style={styles.paragraph}>
            All solar panels, hybrid inverters, lithium batteries, and containerized power stations sold on this
            platform comply with South African National Standards (SANS) and NRS 097 grid interconnection
            standards. Specifications provided on product details pages reflect certified manufacturer testing.
          </Text>

          <Text style={styles.subTitle}>1.2 Pricing, VAT & Payment Terms</Text>
          <Text style={styles.paragraph}>
            All prices displayed on this portal include 15% South African Value Added Tax (VAT) unless otherwise
            indicated for export transactions within SADC territories. Orders are dispatched upon verified payment
            settlement via the secure Yoco card gateway (Visa, Mastercard, AMEX & Yoco Pay).
          </Text>

          <Text style={styles.footerNote}>Last Revised: September 2026 | Green Off-Grid Legal Governance Desk</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.dangerCard}>
          <Text style={styles.dangerCardTitle}>Account Actions</Text>

          <Pressable
            style={[styles.secondaryDangerButton, isDeactivating && styles.disabledButton]}
            onPress={handleDeactivate}
            disabled={isDeactivating || isDeleting}
          >
            {isDeactivating ? (
              <ActivityIndicator color={theme.colors.textPrimary} />
            ) : (
              <Text style={styles.secondaryDangerButtonText}>Deactivate Account</Text>
            )}
          </Pressable>

          <Pressable
            style={[styles.dangerButton, isDeleting && styles.disabledButton]}
            onPress={handleDelete}
            disabled={isDeactivating || isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.dangerButtonText}>Delete Account</Text>
            )}
          </Pressable>
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
    paddingHorizontal: appTheme.spacing.md,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  iconDecor: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(36,184,184,0.1)',
  },
  scrollContent: {
    paddingHorizontal: appTheme.spacing.md,
    paddingTop: appTheme.spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  badgeRow: {
    marginTop: appTheme.spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: theme.colors.primaryAccent,
    fontSize: 11,
    fontWeight: '700',
  },
  policyLinkRow: {
    marginTop: appTheme.spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  policyLinkPill: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(36,184,184,0.1)',
  },
  policyLinkText: {
    color: theme.colors.primaryAccent,
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    marginTop: appTheme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: appTheme.spacing.md,
    gap: 8,
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  subTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  paragraph: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  footerNote: {
    marginTop: appTheme.spacing.sm,
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontStyle: 'italic',
  },
  errorText: {
    color: '#d14444',
    fontSize: 13,
    marginTop: appTheme.spacing.md,
  },
  dangerCard: {
    marginTop: appTheme.spacing.xl,
    gap: 10,
  },
  dangerCardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  secondaryDangerButton: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#d14444',
    backgroundColor: 'transparent',
  },
  secondaryDangerButtonText: {
    color: '#d14444',
    fontSize: 15,
    fontWeight: '700',
  },
  dangerButton: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    backgroundColor: '#d14444',
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
