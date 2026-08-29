
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import { RootStackParamList } from '../../navigation/types';
import {
  completeEmployeePasswordSetup,
} from '../../services/auth/authActions';
import { useAuthStore } from '../../store/authStore';
import { appTheme } from '../../theme';

export function ResetPasswordScreen() {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList>
    >();

  const insets =
    useSafeAreaInsets();

  const user =
    useAuthStore((s) => s.user);

  const [password, setPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [error, setError] =
    useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const handleUpdate = async () => {
    /*
     * ============================================================
     * VALIDATION
     * ============================================================
     */

    const trimmedPassword =
      password.trim();

    const trimmedConfirmPassword =
      confirmPassword.trim();

    if (
      !trimmedPassword ||
      !trimmedConfirmPassword
    ) {
      setError(
        'Please enter and confirm your new password.'
      );

      return;
    }

    if (
      trimmedPassword.length < 8
    ) {
      setError(
        'Your new password must be at least 8 characters long.'
      );

      return;
    }

    if (
      trimmedPassword !==
      trimmedConfirmPassword
    ) {
      setError(
        'Passwords do not match.'
      );

      return;
    }

    /*
     * ============================================================
     * EMPLOYEE CHECK
     * ============================================================
     */

    if (
      user?.role !== 'marketing'
    ) {
      setError(
        'This password setup is only available for marketing employees.'
      );

      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      /*
       * ==========================================================
       * UPDATE PASSWORD + EMPLOYEE PROFILE STATE
       * ==========================================================
       */

      await completeEmployeePasswordSetup(
        trimmedPassword
      );

      console.log(
        '========================================'
      );

      console.log(
        '✅ MARKETING PASSWORD UPDATED'
      );

      console.log(
        'Employee:',
        user.email
      );

      console.log(
        'Employee Number:',
        user.employeeNumber
      );

      console.log(
        'must_reset_password → false'
      );

      console.log(
        '========================================'
      );

      /*
       * ==========================================================
       * NEXT STEP
       * ==========================================================
       *
       * The employee profile screen will be connected here.
       *
       * We are deliberately not logging the employee out.
       */

      navigation.replace(
        ROUTES.EMPLOYEE_PROFILE
      );
    } catch (err) {
      console.error(
        'EMPLOYEE PASSWORD SETUP ERROR:',
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : 'Unable to update your password. Please try again.';

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
      <Pressable
        style={styles.backButton}
        onPress={() => {
          if (
            navigation.canGoBack()
          ) {
            navigation.goBack();
          }
        }}
        disabled={isSubmitting}
      >
        <Ionicons
          name="arrow-back"
          size={20}
          color={
            appTheme.colors
              .primaryAccent
          }
        />
      </Pressable>

      <View
        style={styles.headerSection}
      >
        <Text
          style={styles.eyebrow}
        >
          EMPLOYEE ONBOARDING
        </Text>

        <Text
          style={styles.title}
        >
          Create Your New Password
        </Text>

        <Text
          style={styles.subtitle}
        >
          Your temporary password has been
          accepted. Create a secure permanent
          password to continue.
        </Text>
      </View>

      <View
        style={styles.infoCard}
      >
        <View
          style={styles.infoIcon}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={22}
            color="#24b8b8"
          />
        </View>

        <View
          style={styles.infoContent}
        >
          <Text
            style={styles.infoTitle}
          >
            Secure your account
          </Text>

          <Text
            style={styles.infoText}
          >
            Use at least 8 characters. Avoid
            using your employee number or
            easily guessed information.
          </Text>
        </View>
      </View>

      <View
        style={styles.formSection}
      >
        <Text
          style={styles.label}
        >
          New Password
        </Text>

        <TextInput
          placeholder="Enter your new password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          placeholderTextColor="#7b8a8a"
          editable={!isSubmitting}
        />

        <Text
          style={styles.label}
        >
          Confirm New Password
        </Text>

        <TextInput
          placeholder="Confirm your new password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          value={confirmPassword}
          onChangeText={
            setConfirmPassword
          }
          style={styles.input}
          placeholderTextColor="#7b8a8a"
          editable={!isSubmitting}
        />

        {error ? (
          <View
            style={styles.errorBox}
          >
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color="#d14444"
            />

            <Text
              style={styles.errorText}
            >
              {error}
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
            handleUpdate
          }
          disabled={
            isSubmitting
          }
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
                Continue
              </Text>

              <Ionicons
                name="arrow-forward"
                size={19}
                color="#FFFFFF"
              />
            </>
          )}
        </Pressable>

        <Text
          style={styles.footerText}
        >
          After creating your password, you will
          complete your employee profile before
          accessing the Marketing Dashboard.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles =
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor:
        '#FFFFFF',
      paddingHorizontal:
        appTheme.spacing.md,
    },

    backButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent:
        'center',
      borderWidth: 1,
      borderColor:
        'rgba(36, 184, 184, 0.3)',
      backgroundColor:
        '#f4fcfc',
    },

    headerSection: {
      marginTop:
        appTheme.spacing.lg,
    },

    eyebrow: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.4,
      color: '#24b8b8',
      marginBottom: 8,
    },

    title: {
      fontSize: 29,
      fontWeight: '800',
      color: '#0d3d3d',
    },

    subtitle: {
      marginTop: 8,
      fontSize: 15,
      lineHeight: 22,
      color: '#4c6969',
    },

    infoCard: {
      marginTop:
        appTheme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: 16,
      borderRadius: 16,
      backgroundColor:
        '#f4fcfc',
      borderWidth: 1,
      borderColor:
        'rgba(36, 184, 184, 0.18)',
    },

    infoIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        '#FFFFFF',
    },

    infoContent: {
      flex: 1,
      marginLeft: 12,
    },

    infoTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: '#0d3d3d',
    },

    infoText: {
      marginTop: 4,
      fontSize: 13,
      lineHeight: 19,
      color: '#4c6969',
    },

    formSection: {
      marginTop:
        appTheme.spacing.xl,
    },

    label: {
      marginBottom: 7,
      fontSize: 13,
      fontWeight: '700',
      color: '#0d3d3d',
    },

    input: {
      marginBottom:
        appTheme.spacing.md,
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
      backgroundColor:
        '#fbffff',
    },

    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom:
        appTheme.spacing.sm,
    },

    errorText: {
      flex: 1,
      color: '#d14444',
      fontSize: 13,
      lineHeight: 18,
    },

    primaryButton: {
      marginTop:
        appTheme.spacing.sm,
      minHeight: 52,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 9,
      paddingHorizontal: 20,
      backgroundColor:
        '#24b8b8',
    },

    primaryButtonDisabled: {
      opacity: 0.7,
    },

    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },

    footerText: {
      marginTop: 16,
      textAlign: 'center',
      fontSize: 12,
      lineHeight: 18,
      color: '#718585',
    },
  });

