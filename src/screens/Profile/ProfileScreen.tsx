import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
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

import { useAppTheme } from '../../hooks/useAppTheme';
import type { RootStackParamList } from '../../navigation/types';
import { updateClientProfile } from '../../services/auth/authActions';
import { pickProfileImage, uploadProfileImage } from '../../services/profile/avatar';
import { useAuthStore } from '../../store/authStore';
import { appTheme } from '../../theme';
import type { AppTheme } from '../../theme';
import { FLOATING_NAV_CONTENT_INSET } from '../../components/common/FloatingBottomNav';

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [contactNumber, setContactNumber] = useState(user?.contactNumber ?? '');
  const [businessName, setBusinessName] = useState(user?.businessName ?? '');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isBusiness = user?.accountType === 'business';
  const previewImage = selectedImageUri || user?.avatarUrl || null;

  const isDirty =
    selectedImageUri !== null ||
    name !== (user?.name ?? '') ||
    contactNumber !== (user?.contactNumber ?? '') ||
    (isBusiness && businessName !== (user?.businessName ?? ''));

  const enableEditing = () => {
    setError(null);
    setSuccess(null);
    setIsEditing(true);
  };

  const handleChooseImage = async () => {
    if (!isEditing) {
      enableEditing();
      return;
    }

    try {
      setError(null);
      const uri = await pickProfileImage();

      if (!uri) {
        return;
      }

      setSelectedImageUri(uri);
    } catch (pickerError) {
      setError(pickerError instanceof Error ? pickerError.message : 'Unable to select a profile image.');
    }
  };

  const handleSave = async () => {
    if (!user || !isDirty) {
      return;
    }

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      let finalAvatarUrl = user.avatarUrl ?? null;

      if (selectedImageUri) {
        setIsUploadingImage(true);
        finalAvatarUrl = await uploadProfileImage(selectedImageUri, user.id);
      }

      const updatedUser = await updateClientProfile(user.id, {
        fullName: name,
        contactNumber,
        avatarUrl: finalAvatarUrl,
        businessName: isBusiness ? businessName : undefined,
      });

      updateUser(updatedUser);
      setSelectedImageUri(null);
      setSuccess('Profile updated successfully.');
      setIsEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update your profile.');
    } finally {
      setIsSaving(false);
      setIsUploadingImage(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.root}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Please log in to view your profile.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.primaryAccent} />
        </Pressable>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={styles.iconDecor}>
          <Ionicons name="person-circle-outline" size={22} color={theme.colors.primaryAccent} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + FLOATING_NAV_CONTENT_INSET }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarOuter}>
            <View style={styles.avatarWrap}>
              {previewImage ? (
                <Image source={{ uri: previewImage }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Ionicons name="person" size={44} color={theme.colors.primaryAccent} />
              )}
            </View>

            <Pressable
              style={[styles.pencilBadge, isUploadingImage && styles.disabledButton]}
              onPress={handleChooseImage}
              disabled={isUploadingImage || isSaving}
              hitSlop={8}
            >
              {isUploadingImage ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="pencil" size={14} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.formCard}>
          <View style={styles.formCardHeader}>
            <Text style={styles.formCardTitle}>Account Details</Text>
            <Pressable
              style={styles.pencilButton}
              onPress={enableEditing}
              disabled={isEditing || isSaving}
              hitSlop={8}
            >
              <Ionicons name="pencil" size={16} color={theme.colors.primaryAccent} />
            </Pressable>
          </View>

          <Text style={styles.fieldLabel}>Full Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your full name"
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.input, !isEditing && styles.readOnlyInput]}
            autoCapitalize="words"
            editable={isEditing}
          />

          <Text style={styles.fieldLabel}>Email</Text>
          <View style={[styles.input, styles.readOnlyInput]}>
            <Text style={styles.readOnlyText}>{user.email}</Text>
          </View>

          <Text style={styles.fieldLabel}>Contact Number</Text>
          <TextInput
            value={contactNumber ?? ''}
            onChangeText={setContactNumber}
            placeholder="e.g. 071 234 5678"
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.input, !isEditing && styles.readOnlyInput]}
            keyboardType="phone-pad"
            editable={isEditing}
          />

          {isBusiness ? (
            <>
              <Text style={styles.fieldLabel}>Business Name</Text>
              <TextInput
                value={businessName ?? ''}
                onChangeText={setBusinessName}
                placeholder="Your business name"
                placeholderTextColor={theme.colors.textSecondary}
                style={[styles.input, !isEditing && styles.readOnlyInput]}
                editable={isEditing}
              />
            </>
          ) : null}

          <Text style={styles.fieldLabel}>Account Type</Text>
          <View style={[styles.input, styles.readOnlyInput]}>
            <Text style={styles.readOnlyText}>
              {isBusiness ? 'Business' : 'Individual'}
            </Text>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}

          {isEditing ? (
            <Pressable
              style={[styles.saveButton, (!isDirty || isSaving) && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!isDirty || isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  title: {
    color: theme.colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarOuter: {
    width: 100,
    height: 100,
    position: 'relative',
  },
  avatarWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  pencilBadge: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryAccent,
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  formCard: {
    marginTop: appTheme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: appTheme.spacing.md,
    gap: 8,
  },
  formCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formCardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  pencilButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(36,184,184,0.1)',
  },
  fieldLabel: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.background,
  },
  readOnlyInput: {
    justifyContent: 'center',
    opacity: 0.7,
  },
  readOnlyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  errorText: {
    color: '#d14444',
    fontSize: 13,
    marginTop: 6,
  },
  successText: {
    color: theme.colors.primaryAccent,
    fontSize: 13,
    marginTop: 6,
  },
  saveButton: {
    marginTop: appTheme.spacing.md,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    backgroundColor: theme.colors.primaryAccent,
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
