import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import { RootStackParamList } from '../../navigation/types';
import { updatePassword } from '../../services/auth/authActions';
import { clearAuthTokens } from '../../services/storage/secureStore';
import { useAuthStore } from '../../store/authStore';
import { appTheme } from '../../theme';

export function ResetPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const clearSession = useAuthStore((s) => s.clearSession);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      setError('Please enter and confirm your new password.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setMessage(null);

      await updatePassword(password);
      setMessage('Password updated successfully.');
      await clearAuthTokens();
      clearSession();
      navigation.replace(ROUTES.LOGIN);
    } catch (err) {
      const nextMessage = err instanceof Error ? err.message : 'Unable to update password.';
      setError(nextMessage);
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
        <Text style={styles.title}>New Password</Text>
        <Text style={styles.subtitle}>
          Use this screen after opening your recovery link from email.
        </Text>
      </View>

      <View style={styles.formSection}>
        <TextInput
          placeholder="New password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          placeholderTextColor="#7b8a8a"
        />
        <TextInput
          placeholder="Confirm password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
          placeholderTextColor="#7b8a8a"
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {message ? <Text style={styles.successText}>{message}</Text> : null}

        <Pressable style={styles.primaryButton} onPress={handleUpdate} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Update Password</Text>
          )}
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
  primaryButton: {
    marginTop: appTheme.spacing.sm,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: appTheme.spacing.sm,
    backgroundColor: '#24b8b8',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
