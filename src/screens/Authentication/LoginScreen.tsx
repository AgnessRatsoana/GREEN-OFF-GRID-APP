
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
import { loginWithSupabase } from '../../services/auth/authActions';
import { saveAuthTokens } from '../../services/storage/secureStore';
import { useAuthStore } from '../../store/authStore';
import { appTheme } from '../../theme';

export function LoginScreen() {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList>
    >();

  const insets = useSafeAreaInsets();

  const setSession =
    useAuthStore((s) => s.setSession);

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [error, setError] =
    useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const handleLogin = async () => {
    /*
     * ============================================================
     * VALIDATION
     * ============================================================
     */

    if (
      !email.trim() ||
      !password.trim()
    ) {
      setError(
        'Please enter both email and password.'
      );

      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      /*
       * ==========================================================
       * SUPABASE LOGIN
       * ==========================================================
       */

      const payload =
        await loginWithSupabase(
          email.trim().toLowerCase(),
          password
        );

      /*
       * ==========================================================
       * LOGIN DEBUG
       * ==========================================================
       */

      console.log(
        '========================================'
      );

      console.log(
        '===== GREEN OFF-GRID LOGIN DEBUG ====='
      );

      console.log(
        'Email:',
        payload.user.email
      );

      console.log(
        'Role:',
        payload.user.role
      );

      console.log(
        'Account Type:',
        payload.user.accountType
      );

      console.log(
        'User ID:',
        payload.user.id
      );

      console.log(
        'Employee Number:',
        payload.user.employeeNumber
      );

      console.log(
        'Must Reset Password:',
        payload.user.mustResetPassword
      );

      console.log(
        'Employee Profile Completed:',
        payload.user.employeeProfileCompleted
      );

      console.log(
        'Temporary Access Expires:',
        payload.user.temporaryAccessExpiresAt
      );

      console.log(
        '========================================'
      );

      /*
       * ==========================================================
       * SAVE SESSION
       * ==========================================================
       */

      await saveAuthTokens(
        payload.tokens
      );

      setSession(payload);

      /*
       * ==========================================================
       * ROLE-BASED ROUTING
       * ==========================================================
       */

      const user =
        payload.user;

      /*
       * ==========================================================
       * ADMIN
       * ==========================================================
       *
       * Admin users go directly to the Admin Dashboard.
       */

      if (
        user.role === 'admin'
      ) {
        console.log(
          '➡️ ADMIN DETECTED'
        );

        console.log(
          '➡️ ROUTING → ADMIN DASHBOARD'
        );

        navigation.reset({
          index: 0,
          routes: [
            {
              name:
                ROUTES.ADMIN_DASHBOARD,
            },
          ],
        });

        return;
      }

      /*
       * ==========================================================
       * MARKETING EMPLOYEE
       * ==========================================================
       *
       * Marketing employees do NOT go to the customer MainDrawer.
       */

      if (
        user.role === 'marketing'
      ) {
        console.log(
          '➡️ MARKETING EMPLOYEE DETECTED'
        );

        /*
         * --------------------------------------------------------
         * FIRST LOGIN
         * --------------------------------------------------------
         *
         * The admin-created temporary password must be changed
         * before the employee can continue.
         */

        if (
          user.mustResetPassword === true
        ) {
          console.log(
            '➡️ TEMPORARY PASSWORD DETECTED'
          );

          console.log(
            '➡️ ROUTING → RESET PASSWORD'
          );

          navigation.reset({
            index: 0,
            routes: [
              {
                name:
                  ROUTES.RESET_PASSWORD,
              },
            ],
          });

          return;
        }

        /*
         * --------------------------------------------------------
         * PROFILE NOT COMPLETED
         * --------------------------------------------------------
         *
         * The employee has already changed their password,
         * but the employee profile screen has not been built yet.
         */

        if (
          user.employeeProfileCompleted !== true
        ) {
          console.log(
            '➡️ MARKETING PROFILE INCOMPLETE'
          );

          console.log(
            '⚠️ Employee Profile screen is not built yet.'
          );

          /*
           * IMPORTANT:
           *
           * We intentionally do not send the employee
           * to MainDrawer because MainDrawer is the
           * customer application.
           *
           * The next screen we build will be:
           *
           * EmployeeProfileScreen
           */

          setError(
            'Your password has been updated. Employee profile setup will be available next.'
          );

          return;
        }

        /*
         * --------------------------------------------------------
         * MARKETING DASHBOARD
         * --------------------------------------------------------
         *
         * This will be connected after we build the
         * Marketing Dashboard screen and route.
         */

        console.log(
          '➡️ MARKETING EMPLOYEE FULLY ONBOARDED'
        );

        console.log(
          '⚠️ Marketing Dashboard has not been built yet.'
        );

        setError(
          'Your employee account is ready. Marketing Dashboard setup is coming next.'
        );

        return;
      }

      /*
       * ==========================================================
       * NORMAL CLIENT
       * ==========================================================
       *
       * Individual and business customers continue
       * through the existing customer application.
       */

      console.log(
        '➡️ CLIENT DETECTED'
      );

      console.log(
        '➡️ ROUTING → MAIN DRAWER'
      );

      navigation.reset({
        index: 0,
        routes: [
          {
            name:
              ROUTES.MAIN_DRAWER,
          },
        ],
      });
    } catch (err) {
      /*
       * ==========================================================
       * LOGIN ERROR
       * ==========================================================
       */

      console.error(
        'LOGIN ERROR:',
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : 'Login failed. Please try again.';

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
        style={
          styles.headerSection
        }
      >
        <Text
          style={styles.title}
        >
          Welcome Back
        </Text>

        <Text
          style={styles.subtitle}
        >
          Log in to continue with your
          franchise journey.
        </Text>
      </View>

      <View
        style={styles.formSection}
      >
        <TextInput
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholderTextColor="#7b8a8a"
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          placeholderTextColor="#7b8a8a"
        />

        {error ? (
          <Text
            style={styles.errorText}
          >
            {error}
          </Text>
        ) : null}

        <Pressable
          style={[
            styles.loginButton,
            isSubmitting &&
              styles.loginButtonDisabled,
          ]}
          onPress={
            handleLogin
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
            <Text
              style={
                styles.loginButtonText
              }
            >
              Log In
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() =>
            navigation.navigate(
              ROUTES.REGISTER
            )
          }
        >
          <Text
            style={
              styles.switchText
            }
          >
            New here?{' '}
            <Text
              style={
                styles.switchTextStrong
              }
            >
              Create an account
            </Text>
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            navigation.navigate(
              ROUTES.FORGOT_PASSWORD
            )
          }
        >
          <Text
            style={
              styles.forgotText
            }
          >
            Forgot password?
          </Text>
        </Pressable>
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
      rowGap:
        appTheme.spacing.xs,
    },

    title: {
      fontSize: 30,
      fontWeight: '800',
      color: '#0d3d3d',
    },

    subtitle: {
      fontSize: 15,
      lineHeight: 22,
      color: '#4c6969',
    },

    formSection: {
      marginTop:
        appTheme.spacing.xl,
      rowGap:
        appTheme.spacing.sm,
    },

    input: {
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

    errorText: {
      color: '#d14444',
      fontSize: 13,
    },

    loginButton: {
      marginTop:
        appTheme.spacing.sm,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent:
        'center',
      paddingVertical:
        appTheme.spacing.sm,
      backgroundColor:
        '#24b8b8',
    },

    loginButtonDisabled: {
      opacity: 0.7,
    },

    loginButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },

    switchText: {
      marginTop:
        appTheme.spacing.sm,
      textAlign: 'center',
      color: '#4c6969',
    },

    switchTextStrong: {
      color: '#b89aff',
      fontWeight: '700',
    },

    forgotText: {
      marginTop:
        appTheme.spacing.xs,
      textAlign: 'center',
      color: '#0f6464',
      fontSize: 13,
      fontWeight: '700',
    },
  });

