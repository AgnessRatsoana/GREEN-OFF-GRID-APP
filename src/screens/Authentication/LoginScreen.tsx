import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import { RootStackParamList } from '../../navigation/types';
import { loginWithSupabase } from '../../services/auth/authActions';
import { saveAuthTokens } from '../../services/storage/secureStore';
import { useAuthStore } from '../../store/authStore';
import { appTheme } from '../../theme';

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = await loginWithSupabase(email.trim().toLowerCase(), password);
      await saveAuthTokens(payload.tokens);
      setSession(payload);

      navigation.replace(ROUTES.MAIN_DRAWER);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
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
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Log in to continue with your franchise journey.</Text>
      </View>

      <View style={styles.formSection}>
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

        <Pressable style={styles.loginButton} onPress={handleLogin} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>Log In</Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.navigate(ROUTES.REGISTER)}>
          <Text style={styles.switchText}>
            New here? <Text style={styles.switchTextStrong}>Create an account</Text>
          </Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate(ROUTES.FORGOT_PASSWORD)}>
          <Text style={styles.forgotText}>Forgot password?</Text>
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
  loginButton: {
    marginTop: appTheme.spacing.sm,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: appTheme.spacing.sm,
    backgroundColor: '#24b8b8',
  },
  loginButtonText: {
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
  forgotText: {
    marginTop: appTheme.spacing.xs,
    textAlign: 'center',
    color: '#0f6464',
    fontSize: 13,
    fontWeight: '700',
  },
});
