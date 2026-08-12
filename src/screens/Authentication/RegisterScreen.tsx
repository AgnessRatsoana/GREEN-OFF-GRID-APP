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

export function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const setSession = useAuthStore((s) => s.setSession);

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please complete all fields.');
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
        <Ionicons name="arrow-back" size={20} color={appTheme.colors.primaryAccent} />
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: appTheme.spacing.md,
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
  headerSection: {
    marginTop: appTheme.spacing.lg,
    rowGap: appTheme.spacing.xs,
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
    marginTop: appTheme.spacing.xl,
    rowGap: appTheme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(36, 184, 184, 0.28)',
    borderRadius: 16,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
    fontSize: 15,
    color: '#213232',
    backgroundColor: '#fbffff',
  },
  errorText: {
    color: '#d14444',
    fontSize: 13,
  },
  successText: {
    color: '#0f6464',
    fontSize: 13,
  },
  registerButton: {
    marginTop: appTheme.spacing.sm,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: appTheme.spacing.sm,
    backgroundColor: '#24b8b8',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  switchText: {
    marginTop: appTheme.spacing.sm,
    textAlign: 'center',
    color: '#4c6969',
  },
  switchTextStrong: {
    color: '#b89aff',
    fontWeight: '700',
  },
});
