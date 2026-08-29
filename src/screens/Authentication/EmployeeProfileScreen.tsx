
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import { RootStackParamList } from '../../navigation/types';
import { getSupabaseClient } from '../../services/auth/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import { appTheme } from '../../theme';

export function EmployeeProfileScreen() {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList>
    >();

  const insets = useSafeAreaInsets();

  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);

  const [fullName, setFullName] = useState(
    user?.name ?? ''
  );

  const [employeeNumber, setEmployeeNumber] =
    useState(user?.employeeNumber ?? '');

  const [email, setEmail] = useState(
    user?.email ?? ''
  );

  const [contactNumber, setContactNumber] =
    useState(user?.contactNumber ?? '');

  const [error, setError] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  /*
   * Keep the employee information synchronized
   * with the authenticated user.
   */
  useEffect(() => {
    setFullName(user?.name ?? '');
    setEmployeeNumber(user?.employeeNumber ?? '');
    setEmail(user?.email ?? '');
    setContactNumber(user?.contactNumber ?? '');
  }, [user]);

  const handleCompleteProfile = async () => {
    setError(null);
    setSuccessMessage(null);

    const cleanedName = fullName.trim();
    const cleanedContact = contactNumber.trim();

    if (!cleanedName) {
      setError('Please enter your full name.');
      return;
    }

    if (!employeeNumber.trim()) {
      setError('Your employee number is missing.');
      return;
    }

    if (!cleanedContact) {
      setError('Please enter your contact number.');
      return;
    }

    try {
      setIsSubmitting(true);

      const supabase = getSupabaseClient();

      const {
        data: {
          user: currentUser,
        },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !currentUser) {
        throw new Error(
          'Your session could not be verified. Please log in again.'
        );
      }

      /*
       * Make sure this screen is only being used
       * by a marketing employee.
       */
      const {
        data: profile,
        error: profileLookupError,
      } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          account_type,
          business_name,
          business_registration_number,
          contact_number,
          employee_number,
          employee_profile_completed,
          must_reset_password,
          temporary_access_expires_at,
          intruder_flagged,
          intruder_flagged_at,
          invited_at,
          last_login_at
        `)
        .eq('id', currentUser.id)
        .single();

      if (profileLookupError || !profile) {
        throw new Error(
          'Unable to load your employee profile.'
        );
      }

      if (profile.role !== 'marketing') {
        throw new Error(
          'This profile is only available to marketing employees.'
        );
      }

      /*
       * Update the employee profile.
       *
       * We do NOT change the employee number here.
       * It was assigned by the administrator.
       */
      const {
        data: updatedProfile,
        error: updateError,
      } = await supabase
        .from('profiles')
        .update({
          full_name: cleanedName,
          contact_number: cleanedContact,
          employee_profile_completed: true,
        })
        .eq('id', currentUser.id)
        .select(`
          id,
          email,
          full_name,
          role,
          account_type,
          avatar_url,
          business_name,
          business_registration_number,
          contact_number,
          employee_number,
          employee_profile_completed,
          must_reset_password,
          temporary_access_expires_at,
          intruder_flagged,
          intruder_flagged_at,
          invited_at,
          last_login_at
        `)
        .single();

      if (updateError || !updatedProfile) {
        throw new Error(
          updateError?.message ??
            'Unable to save your employee profile.'
        );
      }

      /*
       * Update the local authentication state so
       * the application immediately knows that
       * employee_profile_completed is true.
       *
       * Preserve the existing session tokens.
       */
      const currentSession =
        useAuthStore.getState();

      if (
        currentSession.tokens &&
        currentUser
      ) {
        setSession({
          tokens: currentSession.tokens,

          user: {
            id: currentUser.id,

            name:
              updatedProfile.full_name ??
              cleanedName,

            email:
              currentUser.email ??
              updatedProfile.email ??
              email,

            avatarUrl:
              updatedProfile.avatar_url ??
              null,

            role: 'marketing',

            accountType:
              updatedProfile.account_type ===
              'business'
                ? 'business'
                : 'individual',

            businessName:
              updatedProfile.business_name ??
              null,

            businessRegistrationNumber:
              updatedProfile.business_registration_number ??
              null,

            contactNumber:
              updatedProfile.contact_number ??
              null,

            employeeNumber:
              updatedProfile.employee_number ??
              employeeNumber,

            employeeProfileCompleted:
              true,

            mustResetPassword:
              updatedProfile.must_reset_password ??
              false,

            temporaryAccessExpiresAt:
              updatedProfile.temporary_access_expires_at ??
              null,

            intruderFlagged:
              updatedProfile.intruder_flagged ??
              false,

            intruderFlaggedAt:
              updatedProfile.intruder_flagged_at ??
              null,

            invitedAt:
              updatedProfile.invited_at ??
              null,

            lastLoginAt:
              updatedProfile.last_login_at ??
              null,
          },
        });
      }

      setSuccessMessage(
        'Your employee profile has been completed successfully.'
      );

      /*
       * Give the user a moment to see the
       * success message before entering
       * the Marketing Dashboard.
       */
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: ROUTES.MARKETING_DASHBOARD,
            },
          ],
        });
      }, 700);
    } catch (err) {
      console.error(
        'EMPLOYEE PROFILE ERROR:',
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : 'Unable to complete your profile. Please try again.';

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[
        styles.root,
        {
          paddingTop:
            insets.top +
            appTheme.spacing.md,
        },
      ]}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={
              appTheme.colors.primaryAccent
            }
          />
        </Pressable>

        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="person-outline"
              size={30}
              color={
                appTheme.colors.primaryAccent
              }
            />
          </View>

          <Text style={styles.title}>
            Complete Your Profile
          </Text>

          <Text style={styles.subtitle}>
            Welcome to the Green Off-Grid
            marketing team. Please complete
            your employee profile before
            continuing to your dashboard.
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              Profile Setup
            </Text>

            <Text style={styles.progressValue}>
              75%
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={styles.progressFill}
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>
            Employee Information
          </Text>

          <Text style={styles.fieldLabel}>
            Full Name
          </Text>

          <TextInput
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
            placeholderTextColor="#7b8a8a"
            autoCapitalize="words"
          />

          <Text style={styles.fieldLabel}>
            Employee Number
          </Text>

          <View
            style={[
              styles.input,
              styles.readOnlyInput,
            ]}
          >
            <Text
              style={styles.readOnlyText}
            >
              {employeeNumber || 'Not assigned'}
            </Text>

            <Ionicons
              name="lock-closed-outline"
              size={18}
              color="#7b8a8a"
            />
          </View>

          <Text style={styles.helperText}>
            Your employee number was assigned
            by your administrator and cannot
            be changed.
          </Text>

          <Text style={styles.fieldLabel}>
            Work Email
          </Text>

          <View
            style={[
              styles.input,
              styles.readOnlyInput,
            ]}
          >
            <Text
              style={styles.readOnlyText}
              numberOfLines={1}
            >
              {email}
            </Text>

            <Ionicons
              name="lock-closed-outline"
              size={18}
              color="#7b8a8a"
            />
          </View>

          <Text style={styles.helperText}>
            Your work email is linked to your
            Green Off-Grid employee account.
          </Text>

          <Text style={styles.fieldLabel}>
            Contact Number
          </Text>

          <TextInput
            placeholder="Enter your contact number"
            value={contactNumber}
            onChangeText={setContactNumber}
            style={styles.input}
            placeholderTextColor="#7b8a8a"
            keyboardType="phone-pad"
          />

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color="#d14444"
              />

              <Text style={styles.errorText}>
                {error}
              </Text>
            </View>
          ) : null}

          {successMessage ? (
            <View style={styles.successBox}>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#0f6464"
              />

              <Text
                style={styles.successText}
              >
                {successMessage}
              </Text>
            </View>
          ) : null}

          <Pressable
            style={[
              styles.primaryButton,
              isSubmitting &&
                styles.primaryButtonDisabled,
            ]}
            onPress={
              handleCompleteProfile
            }
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <>
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Complete Profile
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color="#FFFFFF"
                />
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.securityNote}>
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color="#0f6464"
          />

          <Text
            style={styles.securityText}
          >
            Your employee information is
            securely stored and linked to your
            Green Off-Grid account.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal:
      appTheme.spacing.md,
  },

  scrollContent: {
    paddingBottom:
      appTheme.spacing.xl * 2,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor:
      'rgba(36, 184, 184, 0.3)',
    backgroundColor: '#f4fcfc',
  },

  headerSection: {
    marginTop:
      appTheme.spacing.lg,
    alignItems: 'center',
  },

  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eafafa',
    marginBottom:
      appTheme.spacing.md,
  },

  title: {
    fontSize: 29,
    fontWeight: '800',
    color: '#0d3d3d',
    textAlign: 'center',
  },

  subtitle: {
    marginTop:
      appTheme.spacing.xs,
    fontSize: 15,
    lineHeight: 22,
    color: '#4c6969',
    textAlign: 'center',
  },

  progressContainer: {
    marginTop:
      appTheme.spacing.xl,
    padding: appTheme.spacing.md,
    borderRadius: 16,
    backgroundColor: '#f4fcfc',
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom:
      appTheme.spacing.xs,
  },

  progressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0d3d3d',
  },

  progressValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f6464',
  },

  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#d9eeee',
    overflow: 'hidden',
  },

  progressFill: {
    width: '75%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#24b8b8',
  },

  formSection: {
    marginTop:
      appTheme.spacing.xl,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0d3d3d',
    marginBottom:
      appTheme.spacing.md,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#355454',
    marginBottom:
      appTheme.spacing.xs,
  },

  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor:
      'rgba(36, 184, 184, 0.28)',
    borderRadius: 16,
    paddingHorizontal:
      appTheme.spacing.md,
    paddingVertical:
      appTheme.spacing.sm,
    fontSize: 15,
    color: '#213232',
    backgroundColor: '#fbffff',
    marginBottom:
      appTheme.spacing.sm,
  },

  readOnlyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f4f7f7',
  },

  readOnlyText: {
    flex: 1,
    fontSize: 15,
    color: '#526565',
    marginRight:
      appTheme.spacing.sm,
  },

  helperText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#718282',
    marginTop: -2,
    marginBottom:
      appTheme.spacing.md,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: appTheme.spacing.sm,
    borderRadius: 12,
    backgroundColor: '#fff2f2',
    marginTop:
      appTheme.spacing.xs,
  },

  errorText: {
    flex: 1,
    color: '#d14444',
    fontSize: 13,
    lineHeight: 19,
  },

  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: appTheme.spacing.sm,
    borderRadius: 12,
    backgroundColor: '#eefafa',
    marginTop:
      appTheme.spacing.xs,
  },

  successText: {
    flex: 1,
    color: '#0f6464',
    fontSize: 13,
    lineHeight: 19,
  },

  primaryButton: {
    marginTop:
      appTheme.spacing.md,
    minHeight: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal:
      appTheme.spacing.md,
    backgroundColor: '#24b8b8',
  },

  primaryButtonDisabled: {
    opacity: 0.7,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  securityNote: {
    marginTop:
      appTheme.spacing.xl,
    padding: appTheme.spacing.md,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#f4fcfc',
  },

  securityText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#526565',
  },
});

