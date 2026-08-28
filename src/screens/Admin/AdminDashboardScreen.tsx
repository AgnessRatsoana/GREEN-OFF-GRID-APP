import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '../../store/authStore';
import { RootStackParamList } from '../../navigation/types';

import {
  type AdminDashboardMetrics,
  fetchAdminDashboardMetrics,
} from '../../services/admin/dashboard';

import {
  inviteMarketingUser,
  type InviteMarketingUserResult,
} from '../../services/admin/marketingInvitations';

import { appTheme } from '../../theme';

export function AdminDashboardScreen() {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList>
    >();

  const insets = useSafeAreaInsets();

  const isAdmin = useAuthStore(
    (state) => state.user?.role === 'admin',
  );

  /*
   * DASHBOARD DATA
   */
  const [metrics, setMetrics] =
    useState<AdminDashboardMetrics | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  /*
   * MARKETING EMPLOYEE FORM
   */
  const [fullName, setFullName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [employeeNumber, setEmployeeNumber] =
    useState('');

  const [contactNumber, setContactNumber] =
    useState('');

  /*
   * INVITATION STATE
   */
  const [inviteLoading, setInviteLoading] =
    useState(false);

  const [inviteError, setInviteError] =
    useState<string | null>(null);

  const [inviteSuccess, setInviteSuccess] =
    useState<string | null>(null);

  const [createdEmployee, setCreatedEmployee] =
    useState<InviteMarketingUserResult | null>(
      null,
    );

  const [copySuccess, setCopySuccess] =
    useState(false);

  /*
   * Only administrators may access this
   * dashboard.
   */
  useEffect(() => {
    if (!isAdmin) {
      navigation.goBack();
    }
  }, [isAdmin, navigation]);

  /*
   * LOAD ADMIN DASHBOARD METRICS
   */
  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const nextMetrics =
        await fetchAdminDashboardMetrics();

      setMetrics(nextMetrics);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to load admin metrics.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadMetrics();
    }
  }, [isAdmin]);

  /*
   * CREATE MARKETING EMPLOYEE
   */
  const handleInviteMarketingUser =
    async () => {
      setInviteError(null);
      setInviteSuccess(null);
      setCopySuccess(false);
      setCreatedEmployee(null);

      const cleanFullName =
        fullName.trim();

      const cleanEmail =
        email.trim().toLowerCase();

      const cleanEmployeeNumber =
        employeeNumber.trim();

      const cleanContactNumber =
        contactNumber.trim();

      /*
       * Basic validation.
       */
      if (
        !cleanFullName ||
        !cleanEmail ||
        !cleanEmployeeNumber
      ) {
        setInviteError(
          'Full name, email and employee number are required.',
        );

        return;
      }

      try {
        setInviteLoading(true);

        const result =
          await inviteMarketingUser({
            fullName:
              cleanFullName,

            email:
              cleanEmail,

            employeeNumber:
              cleanEmployeeNumber,

            contactNumber:
              cleanContactNumber ||
              undefined,
          });

        /*
         * Keep the returned credentials
         * in local component state so the
         * administrator can view them.
         */
        setCreatedEmployee(result);

        setInviteSuccess(
          'Marketing employee created successfully.',
        );

        /*
         * Clear form after successful
         * employee creation.
         */
        setFullName('');
        setEmail('');
        setEmployeeNumber('');
        setContactNumber('');

        /*
         * Refresh activity metrics.
         */
        await loadMetrics();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Unable to create marketing employee.';

        setInviteError(message);
      } finally {
        setInviteLoading(false);
      }
    };

  /*
   * BUILD PROFESSIONAL INVITATION TEXT
   */
  const buildInvitationText = () => {
    if (!createdEmployee) {
      return '';
    }

    const expiry =
      new Date(
        createdEmployee.temporaryAccessExpiresAt,
      ).toLocaleString();

    return `GREEN OFF-GRID
MARKETING TEAM INVITATION

Welcome to Green Off-Grid.

You have been invited to join the Green Off-Grid marketing team.

YOUR ACCOUNT DETAILS

Email:
${createdEmployee.email}

Employee Number:
${createdEmployee.employeeNumber}

Temporary Password:
${createdEmployee.temporaryPassword ?? 'Not available'}

Temporary Access Expires:
${expiry}

NEXT STEPS

1. Open the Green Off-Grid application.
2. Sign in using the email and temporary password above.
3. You will be required to change your temporary password.
4. Create your permanent password.
5. Complete your employee profile.
6. Continue to the Marketing Dashboard.

SECURITY NOTICE

Your temporary password is intended only for your first login.

Please do not share your password with anyone else.

If you did not expect this invitation, please contact your administrator.

Green Off-Grid
`;
  };

  /*
   * COPY INVITATION
   */
  const handleCopyInvitation =
    async () => {
      try {
        const invitation =
          buildInvitationText();

        await Clipboard.setStringAsync(
          invitation,
        );

        setCopySuccess(true);

        setTimeout(() => {
          setCopySuccess(false);
        }, 3000);
      } catch (err) {
        setInviteError(
          'Unable to copy the invitation.',
        );
      }
    };

  /*
   * SHARE INVITATION
   */
  const handleShareInvitation =
    async () => {
      try {
        const invitation =
          buildInvitationText();

        await Share.share({
          message: invitation,
        });
      } catch (err) {
        /*
         * Sharing can be cancelled by the
         * administrator. We do not display
         * an error for a normal cancellation.
         */
        console.log(
          'Invitation sharing cancelled.',
        );
      }
    };

  /*
   * CREATE ANOTHER EMPLOYEE
   */
  const handleCreateAnother =
    () => {
      setCreatedEmployee(null);
      setInviteSuccess(null);
      setInviteError(null);
      setCopySuccess(false);
    };

  /*
   * RENDER
   */
  return (
    <View
      style={[
        styles.root,
        {
          paddingTop:
            insets.top + 14,
        },
      ]}
    >
      {/* HEADER */}

      <View style={styles.header}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>
            Admin Dashboard
          </Text>

          <Text style={styles.headerSubtitle}>
            Green Off-Grid Administration
          </Text>
        </View>

        <View style={styles.decorIcon}>
          <Text style={styles.decorIconText}>
            A
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator
            size="large"
            color="#24b8b8"
          />
        </View>
      ) : error ? (
        <View style={styles.centerWrap}>
          <Text style={styles.errorText}>
            {error}
          </Text>

          <Text style={styles.helpText}>
            Run
            {' '}
            supabase/admin_dashboard_setup.sql
            {' '}
            in Supabase SQL Editor, then refresh.
          </Text>

          <Pressable
            style={styles.refreshBtn}
            onPress={loadMetrics}
          >
            <Text style={styles.refreshBtnText}>
              Retry
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={
            styles.scrollBody
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ============================== */}
          {/* METRICS */}
          {/* ============================== */}

          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>
                Total Users
              </Text>

              <Text style={styles.metricValue}>
                {metrics?.totalUsers ?? 0}
              </Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>
                Active 24h
              </Text>

              <Text style={styles.metricValue}>
                {metrics?.activeUsers24h ?? 0}
              </Text>
            </View>
          </View>

          <View style={styles.metricCardLarge}>
            <Text style={styles.metricLabel}>
              Total Activity Logs
            </Text>

            <Text style={styles.metricValue}>
              {metrics?.totalLogs ?? 0}
            </Text>
          </View>

          {/* ============================== */}
          {/* CREATE MARKETING EMPLOYEE */}
          {/* ============================== */}

          {!createdEmployee ? (
            <View style={styles.inviteCard}>
              <Text style={styles.cardTitle}>
                Create Marketing Employee
              </Text>

              <Text style={styles.cardDescription}>
                Create a temporary marketing employee
                account. The employee will receive
                temporary login credentials that must
                be changed during their first login.
              </Text>

              <TextInput
                placeholder="Full name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                style={styles.input}
                placeholderTextColor="#7b8a8a"
              />

              <TextInput
                placeholder="Work email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                placeholderTextColor="#7b8a8a"
              />

              <TextInput
                placeholder="Employee number"
                value={employeeNumber}
                onChangeText={setEmployeeNumber}
                autoCapitalize="characters"
                autoCorrect={false}
                style={styles.input}
                placeholderTextColor="#7b8a8a"
              />

              <TextInput
                placeholder="Contact number (optional)"
                value={contactNumber}
                onChangeText={setContactNumber}
                keyboardType="phone-pad"
                style={styles.input}
                placeholderTextColor="#7b8a8a"
              />

              {inviteError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorBoxText}>
                    {inviteError}
                  </Text>
                </View>
              ) : null}

              {inviteSuccess ? (
                <View style={styles.successBox}>
                  <Text style={styles.successText}>
                    {inviteSuccess}
                  </Text>
                </View>
              ) : null}

              <Pressable
                style={[
                  styles.inviteButton,
                  inviteLoading &&
                    styles.inviteButtonDisabled,
                ]}
                onPress={
                  handleInviteMarketingUser
                }
                disabled={inviteLoading}
              >
                {inviteLoading ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={
                      styles.inviteButtonText
                    }
                  >
                    Create Marketing Employee
                  </Text>
                )}
              </Pressable>
            </View>
          ) : (
            /* ============================== */
            /* PROFESSIONAL INVITATION */
            /* ============================== */

            <View style={styles.invitationCard}>
              {/* LOGO */}

              <View style={styles.logoContainer}>
                <Image
                  source={require(
                    '../../assets/images/Green-Off-Grid-Logo.jpg',
                  )}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              {/* BRAND */}

              <Text style={styles.invitationBrand}>
                GREEN OFF-GRID
              </Text>

              <Text style={styles.invitationHeading}>
                Marketing Team Invitation
              </Text>

              <View style={styles.invitationDivider} />

              {/* GREETING */}

              <Text style={styles.invitationGreeting}>
                Welcome to Green Off-Grid.
              </Text>

              <Text style={styles.invitationBody}>
                Hello {createdEmployee.email},
              </Text>

              <Text style={styles.invitationBody}>
                You have been invited to join the
                Green Off-Grid marketing team.
              </Text>

              {/* ACCOUNT DETAILS */}

              <View style={styles.detailsCard}>
                <Text style={styles.detailsHeading}>
                  ACCOUNT DETAILS
                </Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    Email
                  </Text>

                  <Text style={styles.detailValue}>
                    {createdEmployee.email}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    Employee Number
                  </Text>

                  <Text style={styles.detailValue}>
                    {createdEmployee.employeeNumber}
                  </Text>
                </View>

                <View style={styles.passwordRow}>
                  <Text style={styles.detailLabel}>
                    Temporary Password
                  </Text>

                  <Text
                    style={
                      styles.passwordValue
                    }
                  >
                    {createdEmployee.temporaryPassword ??
                      'Not available'}
                  </Text>
                </View>
              </View>

              {/* EXPIRATION */}

              <View style={styles.expiryCard}>
                <Text style={styles.expiryTitle}>
                  TEMPORARY ACCESS
                </Text>

                <Text style={styles.expiryText}>
                  This temporary account expires on:
                </Text>

                <Text style={styles.expiryDate}>
                  {new Date(
                    createdEmployee.temporaryAccessExpiresAt,
                  ).toLocaleString()}
                </Text>
              </View>

              {/* NEXT STEPS */}

              <View style={styles.stepsCard}>
                <Text style={styles.stepsHeading}>
                  NEXT STEPS
                </Text>

                <Text style={styles.stepText}>
                  <Text style={styles.stepNumber}>
                    1.
                  </Text>{' '}
                  Open the Green Off-Grid application.
                </Text>

                <Text style={styles.stepText}>
                  <Text style={styles.stepNumber}>
                    2.
                  </Text>{' '}
                  Sign in using your email and
                  temporary password.
                </Text>

                <Text style={styles.stepText}>
                  <Text style={styles.stepNumber}>
                    3.
                  </Text>{' '}
                  Change your temporary password.
                </Text>

                <Text style={styles.stepText}>
                  <Text style={styles.stepNumber}>
                    4.
                  </Text>{' '}
                  Create your permanent password.
                </Text>

                <Text style={styles.stepText}>
                  <Text style={styles.stepNumber}>
                    5.
                  </Text>{' '}
                  Complete your employee profile.
                </Text>

                <Text style={styles.stepText}>
                  <Text style={styles.stepNumber}>
                    6.
                  </Text>{' '}
                  Continue to the Marketing Dashboard.
                </Text>
              </View>

              {/* SECURITY NOTICE */}

              <View style={styles.securityCard}>
                <Text style={styles.securityTitle}>
                  SECURITY NOTICE
                </Text>

                <Text style={styles.securityText}>
                  Your temporary password is intended
                  only for your first login.
                </Text>

                <Text style={styles.securityText}>
                  Please do not share your password
                  with anyone else.
                </Text>

                <Text style={styles.securityText}>
                  If you did not expect this invitation,
                  please contact your administrator.
                </Text>
              </View>

              {/* SUCCESS */}

              <View style={styles.createdBadge}>
                <Text style={styles.createdBadgeText}>
                  ✓ Employee account created successfully
                </Text>
              </View>

              {/* ACTIONS */}

              <View style={styles.actionRow}>
                <Pressable
                  style={styles.copyButton}
                  onPress={
                    handleCopyInvitation
                  }
                >
                  <Text style={styles.copyButtonText}>
                    {copySuccess
                      ? '✓ Copied'
                      : 'Copy Invitation'}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.shareButton}
                  onPress={
                    handleShareInvitation
                  }
                >
                  <Text style={styles.shareButtonText}>
                    Share Invitation
                  </Text>
                </Pressable>
              </View>

              {/* CREATE ANOTHER */}

              <Pressable
                style={styles.createAnotherButton}
                onPress={
                  handleCreateAnother
                }
              >
                <Text
                  style={
                    styles.createAnotherText
                  }
                >
                  Create Another Employee
                </Text>
              </Pressable>
            </View>
          )}

          {/* ============================== */}
          {/* RECENT ACTIVITY */}
          {/* ============================== */}

          <View style={styles.logsCard}>
            <View
              style={styles.logsHeaderRow}
            >
              <Text style={styles.cardTitle}>
                Recent Activity
              </Text>

              <Pressable
                style={
                  styles.refreshBtnSmall
                }
                onPress={loadMetrics}
              >
                <Text
                  style={
                    styles.refreshBtnSmallText
                  }
                >
                  Refresh
                </Text>
              </Pressable>
            </View>

            {metrics?.recentLogs?.length ? (
              metrics.recentLogs.map(
                (item) => (
                  <View
                    key={item.id}
                    style={styles.logRow}
                  >
                    <Text
                      style={styles.logEvent}
                    >
                      {item.event_type}
                    </Text>

                    <Text
                      style={styles.logMeta}
                    >
                      {item.actor_email ||
                        'Unknown user'}
                    </Text>

                    <Text
                      style={styles.logTime}
                    >
                      {new Date(
                        item.created_at,
                      ).toLocaleString()}
                    </Text>
                  </View>
                ),
              )
            ) : (
              <Text style={styles.logMeta}>
                No logs yet.
              </Text>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

/*
 * ============================================================
 * STYLES
 * ============================================================
 */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal:
      appTheme.spacing.md,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor:
      'rgba(36,184,184,0.18)',
  },

  headerTextWrap: {
    flex: 1,
  },

  headerTitle: {
    color: '#123f3f',
    fontSize: 22,
    fontWeight: '800',
  },

  headerSubtitle: {
    color: '#6e8383',
    fontSize: 12,
    marginTop: 3,
  },

  decorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor:
      'rgba(36,184,184,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  decorIconText: {
    color: '#24b8b8',
    fontSize: 18,
    fontWeight: '800',
  },

  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal:
      appTheme.spacing.md,
  },

  scrollBody: {
    paddingTop:
      appTheme.spacing.md,
    paddingBottom:
      appTheme.spacing.xl,
    rowGap:
      appTheme.spacing.md,
  },

  /*
   * METRICS
   */

  metricsRow: {
    flexDirection: 'row',
    columnGap:
      appTheme.spacing.sm,
  },

  metricCard: {
    flex: 1,
    borderRadius: 16,
    padding:
      appTheme.spacing.md,
    borderWidth: 1,
    borderColor:
      'rgba(36,184,184,0.2)',
    backgroundColor: '#f7fdfd',
  },

  metricCardLarge: {
    borderRadius: 16,
    padding:
      appTheme.spacing.md,
    borderWidth: 1,
    borderColor:
      'rgba(36,184,184,0.2)',
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

  /*
   * CREATE EMPLOYEE
   */

  inviteCard: {
    borderRadius: 18,
    padding:
      appTheme.spacing.md,
    borderWidth: 1,
    borderColor:
      'rgba(36,184,184,0.2)',
    backgroundColor: '#f7fdfd',
    rowGap:
      appTheme.spacing.sm,
  },

  cardTitle: {
    color: '#0f6464',
    fontSize: 16,
    fontWeight: '700',
  },

  cardDescription: {
    color: '#587272',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },

  input: {
    borderWidth: 1,
    borderColor:
      'rgba(36,184,184,0.28)',
    borderRadius: 14,
    paddingHorizontal:
      appTheme.spacing.md,
    paddingVertical:
      appTheme.spacing.sm,
    fontSize: 15,
    color: '#213232',
    backgroundColor: '#FFFFFF',
  },

  inviteButton: {
    marginTop: 4,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical:
      appTheme.spacing.sm,
    backgroundColor: '#24b8b8',
  },

  inviteButtonDisabled: {
    opacity: 0.7,
  },

  inviteButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  /*
   * ERROR / SUCCESS
   */

  errorBox: {
    borderRadius: 12,
    padding:
      appTheme.spacing.sm,
    backgroundColor: '#fff4f4',
    borderWidth: 1,
    borderColor: '#efc1c1',
  },

  errorBoxText: {
    color: '#bf3a3a',
    fontSize: 13,
    lineHeight: 19,
  },

  successBox: {
    borderRadius: 12,
    padding:
      appTheme.spacing.sm,
    backgroundColor: '#eefaf5',
    borderWidth: 1,
    borderColor: '#b9e6d1',
  },

  successText: {
    color: '#16734a',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },

  /*
   * PROFESSIONAL INVITATION
   */

  invitationCard: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor:
      'rgba(36,184,184,0.22)',
    backgroundColor: '#FFFFFF',
    shadowColor: '#123f3f',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },

  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  logo: {
    width: 170,
    height: 80,
  },

  invitationBrand: {
    color: '#24b8b8',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 2,
    marginTop: 2,
  },

  invitationHeading: {
    color: '#123f3f',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
  },

  invitationDivider: {
    height: 1,
    backgroundColor:
      'rgba(36,184,184,0.18)',
    marginVertical: 18,
  },

  invitationGreeting: {
    color: '#123f3f',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },

  invitationBody: {
    color: '#587272',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 8,
  },

  /*
   * ACCOUNT DETAILS
   */

  detailsCard: {
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#f7fdfd',
    borderWidth: 1,
    borderColor:
      'rgba(36,184,184,0.18)',
  },

  detailsHeading: {
    color: '#0f6464',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },

  detailRow: {
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor:
      'rgba(36,184,184,0.10)',
  },

  passwordRow: {
    paddingTop: 12,
  },

  detailLabel: {
    color: '#6e8383',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },

  detailValue: {
    color: '#123f3f',
    fontSize: 14,
    fontWeight: '700',
  },

  passwordValue: {
    color: '#0f6464',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  /*
   * EXPIRY
   */

  expiryCard: {
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#fffaf0',
    borderWidth: 1,
    borderColor: '#ead9ae',
  },

  expiryTitle: {
    color: '#87651d',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },

  expiryText: {
    color: '#806c3d',
    fontSize: 12,
    marginTop: 7,
  },

  expiryDate: {
    color: '#624b14',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },

  /*
   * STEPS
   */

  stepsCard: {
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#f7fdfd',
    borderWidth: 1,
    borderColor:
      'rgba(36,184,184,0.18)',
  },

  stepsHeading: {
    color: '#0f6464',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },

  stepText: {
    color: '#587272',
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 5,
  },

  stepNumber: {
    color: '#24b8b8',
    fontWeight: '800',
  },

  /*
   * SECURITY
   */

  securityCard: {
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#f3f7f7',
    borderWidth: 1,
    borderColor:
      'rgba(18,63,63,0.10)',
  },

  securityTitle: {
    color: '#123f3f',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },

  securityText: {
    color: '#587272',
    fontSize: 12,
    lineHeight: 19,
    marginBottom: 5,
  },

  /*
   * CREATED BADGE
   */

  createdBadge: {
    marginTop: 14,
    borderRadius: 12,
    padding: 11,
    backgroundColor: '#eefaf5',
    borderWidth: 1,
    borderColor: '#b9e6d1',
  },

  createdBadgeText: {
    color: '#16734a',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },

  /*
   * ACTION BUTTONS
   */

  actionRow: {
    flexDirection: 'row',
    columnGap: 10,
    marginTop: 14,
  },

  copyButton: {
    flex: 1,
    borderRadius: 13,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#123f3f',
  },

  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  shareButton: {
    flex: 1,
    borderRadius: 13,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#24b8b8',
  },

  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  createAnotherButton: {
    marginTop: 10,
    borderRadius: 13,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor:
      'rgba(36,184,184,0.28)',
    backgroundColor: '#FFFFFF',
  },

  createAnotherText: {
    color: '#0f6464',
    fontSize: 13,
    fontWeight: '700',
  },

  /*
   * RECENT ACTIVITY
   */

  logsCard: {
    borderRadius: 18,
    padding:
      appTheme.spacing.md,
    borderWidth: 1,
    borderColor:
      'rgba(36,184,184,0.2)',
    backgroundColor: '#f7fdfd',
    rowGap:
      appTheme.spacing.sm,
  },

  logsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  logRow: {
    borderRadius: 12,
    padding:
      appTheme.spacing.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor:
      'rgba(36,184,184,0.14)',
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

  /*
   * GENERAL ERRORS
   */

  errorText: {
    color: '#bf3a3a',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },

  helpText: {
    marginTop:
      appTheme.spacing.sm,
    color: '#5d7676',
    fontSize: 13,
    textAlign: 'center',
  },

  /*
   * REFRESH
   */

  refreshBtn: {
    marginTop:
      appTheme.spacing.md,
    borderRadius: 12,
    backgroundColor: '#24b8b8',
    paddingHorizontal:
      appTheme.spacing.md,
    paddingVertical:
      appTheme.spacing.sm,
  },

  refreshBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  refreshBtnSmall: {
    borderRadius: 10,
    backgroundColor: '#24b8b8',
    paddingHorizontal:
      appTheme.spacing.sm,
    paddingVertical: 6,
  },

  refreshBtnSmallText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});