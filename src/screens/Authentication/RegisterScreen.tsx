import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import { RootStackParamList } from '../../navigation/types';
import { registerWithSupabase } from '../../services/auth/authActions';
import { saveAuthTokens } from '../../services/storage/secureStore';
import { useAuthStore } from '../../store/authStore';
import { appTheme } from '../../theme';
import type { AppTheme } from '../../theme';
import { useAppTheme } from '../../hooks/useAppTheme';

export function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const setSession = useAuthStore((s) => s.setSession);

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [accountType, setAccountType] = useState<'individual' | 'business'>('individual');
  const [businessName, setBusinessName] = useState<string>('');
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const theme = useAppTheme();
  const styles = createStyles(theme);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please complete all fields.');
      return;
    }

    if (accountType === 'business' && (!businessName.trim() || !businessRegistrationNumber.trim() || !contactNumber.trim())) {
      setError('Please complete all business details.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      const payload = await registerWithSupabase(
        email.trim().toLowerCase(),
        password,
        name.trim(),
        accountType,
        accountType === 'business'
          ? {
              businessName: businessName.trim(),
              businessRegistrationNumber: businessRegistrationNumber.trim(),
              contactNumber: contactNumber.trim(),
            }
          : undefined,
      );

      if (payload) {
        await saveAuthTokens(payload.tokens);
        setSession(payload);
        navigation.replace(ROUTES.MAIN_DRAWER);
        return;
      }

      setSuccess('A confirmation email has been sent. Please verify your email, then log in.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + appTheme.spacing.md }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={20} color={theme.colors.primaryAccent} />
      </Pressable>

      <View style={styles.headerSection}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Register and unlock your personalized profile menu.</Text>
      </View>

      <View style={styles.formSection}>
        <TextInput
          placeholder="Full name"
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholderTextColor="#7b8a8a"
        />
        <TextInput
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholderTextColor="#7b8a8a"
        />
        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          placeholderTextColor="#7b8a8a"
        />

        <Text style={styles.fieldLabel}>Account Type</Text>
        <View style={styles.accountTypeRow}>
          <Pressable
            style={[styles.accountTypeOption, accountType === 'individual' && styles.accountTypeOptionActive]}
            onPress={() => setAccountType('individual')}
          >
            <Text style={[styles.accountTypeText, accountType === 'individual' && styles.accountTypeTextActive]}>Individual</Text>
          </Pressable>
          <Pressable
            style={[styles.accountTypeOption, accountType === 'business' && styles.accountTypeOptionActive]}
            onPress={() => setAccountType('business')}
          >
            <Text style={[styles.accountTypeText, accountType === 'business' && styles.accountTypeTextActive]}>Business</Text>
          </Pressable>
        </View>

        {accountType === 'business' ? (
          <>
            <TextInput
              placeholder="Business name"
              value={businessName}
              onChangeText={setBusinessName}
              style={styles.input}
              placeholderTextColor="#7b8a8a"
            />
            <TextInput
              placeholder="Business registration number"
              value={businessRegistrationNumber}
              onChangeText={setBusinessRegistrationNumber}
              style={styles.input}
              placeholderTextColor="#7b8a8a"
            />
            <TextInput
              placeholder="Contact number"
              keyboardType="phone-pad"
              value={contactNumber}
              onChangeText={setContactNumber}
              style={styles.input}
              placeholderTextColor="#7b8a8a"
            />
          </>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
    {success ? <Text style={styles.successText}>{success}</Text> : null}

        <Pressable style={styles.registerButton} onPress={handleRegister} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.registerButtonText}>Register</Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.navigate(ROUTES.LOGIN)}>
          <Text style={styles.switchText}>
            Already have an account? <Text style={styles.switchTextStrong}>Log in</Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: appTheme.spacing.md,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  headerSection: {
    marginTop: appTheme.spacing.lg,
    rowGap: appTheme.spacing.xs,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textSecondary,
  },
  formSection: {
    marginTop: appTheme.spacing.xl,
    rowGap: appTheme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
    fontSize: 15,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
  },
  errorText: {
    color: '#d14444',
    fontSize: 13,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: 4,
  },
  accountTypeRow: {
    flexDirection: 'row',
    columnGap: appTheme.spacing.sm,
  },
  accountTypeOption: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: appTheme.spacing.sm,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  accountTypeOptionActive: {
    backgroundColor: theme.colors.primaryAccent,
    borderColor: theme.colors.primaryAccent,
  },
  accountTypeText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  accountTypeTextActive: {
    color: '#FFFFFF',
  },
  successText: {
    color: theme.colors.primaryAccent,
    fontSize: 13,
  },
  registerButton: {
    marginTop: appTheme.spacing.sm,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: appTheme.spacing.sm,
    backgroundColor: theme.colors.primaryAccent,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  switchText: {
    marginTop: appTheme.spacing.sm,
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
  switchTextStrong: {
    color: theme.colors.supportPurple,
    fontWeight: '700',
  },
});
