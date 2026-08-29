
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ROUTES } from '../../../constants/routes';
import type { RootStackParamList } from '../../../navigation/types';

type NavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

export function AddProductScreen() {
  const navigation =
    useNavigation<NavigationProp>();

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSaveProduct = () => {
    Alert.alert(
      'Product',
      'Product creation will be connected to Supabase next.'
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.background}
      />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={
            styles.contentContainer
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* HEADER */}

          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
              onPress={handleBack}
            >
              <Ionicons
                name="arrow-back"
                size={21}
                color={COLORS.text}
              />
            </Pressable>

            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>
                MARKETING
              </Text>

              <Text style={styles.title}>
                Add Product
              </Text>

              <Text style={styles.subtitle}>
                Create a product for the Green Off-Grid
                catalogue.
              </Text>
            </View>
          </View>

          {/* PRODUCT INFORMATION */}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Product Information
            </Text>

            <Text style={styles.sectionSubtitle}>
              Enter the information customers will see
              in the catalogue.
            </Text>
          </View>

          <View style={styles.formCard}>
            <FormField
              label="Product Name"
              placeholder="Enter product name"
              required
            />

            <FormField
              label="Category"
              placeholder="e.g. Solar Equipment"
              required
            />

            <FormField
              label="Price"
              placeholder="Enter product price"
              keyboardType="decimal-pad"
              prefix="R"
              required
            />

            <View style={styles.field}>
              <Text style={styles.label}>
                Description
                <Text style={styles.required}> *</Text>
              </Text>

              <TextInput
                placeholder="Describe the product, its features and benefits."
                placeholderTextColor={COLORS.muted}
                style={[
                  styles.input,
                  styles.descriptionInput,
                ]}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* PRODUCT IMAGE */}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Product Image
            </Text>

            <Text style={styles.sectionSubtitle}>
              Add a clear image that represents the
              product.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.imageUpload,
              pressed && styles.pressed,
            ]}
            onPress={() => {
              Alert.alert(
                'Product Image',
                'Image selection will be connected next.'
              );
            }}
          >
            <View style={styles.imageIcon}>
              <Ionicons
                name="cloud-upload-outline"
                size={29}
                color={COLORS.teal}
              />
            </View>

            <Text style={styles.imageTitle}>
              Upload Product Image
            </Text>

            <Text style={styles.imageDescription}>
              Select an image from your device.
            </Text>

            <Text style={styles.imageHint}>
              Recommended: JPG or PNG
            </Text>
          </Pressable>

          {/* AVAILABILITY */}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Availability
            </Text>

            <Text style={styles.sectionSubtitle}>
              Control whether customers can currently
              see this product.
            </Text>
          </View>

          <View style={styles.availabilityCard}>
            <View style={styles.availabilityIcon}>
              <Ionicons
                name="eye-outline"
                size={21}
                color={COLORS.teal}
              />
            </View>

            <View style={styles.availabilityContent}>
              <Text style={styles.availabilityTitle}>
                Product Status
              </Text>

              <Text style={styles.availabilityDescription}>
                New products will be saved as active
                catalogue items.
              </Text>
            </View>

            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />

              <Text style={styles.activeText}>
                Active
              </Text>
            </View>
          </View>

          {/* SAVE */}

          <View style={styles.bottomActions}>
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.pressed,
              ]}
              onPress={handleBack}
            >
              <Text style={styles.cancelButtonText}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.pressed,
              ]}
              onPress={handleSaveProduct}
            >
              <Ionicons
                name="checkmark"
                size={20}
                color={COLORS.white}
              />

              <Text style={styles.saveButtonText}>
                Save Product
              </Text>
            </Pressable>
          </View>

          <Text style={styles.footerText}>
            Green Off-Grid Marketing Workspace
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ============================================================
   FORM FIELD
============================================================ */

interface FormFieldProps {
  label: string;
  placeholder: string;
  required?: boolean;
  keyboardType?: 'default' | 'decimal-pad';
  prefix?: string;
}

function FormField({
  label,
  placeholder,
  required = false,
  keyboardType = 'default',
  prefix,
}: FormFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required && (
          <Text style={styles.required}> *</Text>
        )}
      </Text>

      <View style={styles.inputWrapper}>
        {prefix && (
          <Text style={styles.inputPrefix}>
            {prefix}
          </Text>
        )}

        <TextInput
          placeholder={placeholder}
          placeholderTextColor={COLORS.muted}
          style={[
            styles.input,
            prefix && styles.inputWithPrefix,
          ]}
          keyboardType={keyboardType}
          autoCapitalize={
            label === 'Product Name'
              ? 'words'
              : 'sentences'
          }
        />
      </View>
    </View>
  );
}

/* ============================================================
   COLORS
============================================================ */

const COLORS = {
  background: '#F7FAFA',
  surface: '#FFFFFF',
  border: '#E2EBEB',

  teal: '#24B8B8',
  tealDark: '#0D6464',
  tealLight: '#EEF9F9',

  text: '#163838',
  secondaryText: '#557070',
  muted: '#8A9B9B',

  white: '#FFFFFF',

  danger: '#C94A4A',
  success: '#27835C',
};

/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  keyboardContainer: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  /* ----------------------------------------------------------
     HEADER
  ---------------------------------------------------------- */

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 28,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 13,
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: COLORS.tealDark,
    marginBottom: 4,
  },

  title: {
    fontSize: 29,
    fontWeight: '800',
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.secondaryText,
  },

  /* ----------------------------------------------------------
     SECTIONS
  ---------------------------------------------------------- */

  sectionHeader: {
    marginBottom: 13,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.text,
  },

  sectionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.secondaryText,
  },

  /* ----------------------------------------------------------
     FORM
  ---------------------------------------------------------- */

  formCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 28,
  },

  field: {
    marginBottom: 18,
  },

  label: {
    marginBottom: 7,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },

  required: {
    color: COLORS.danger,
  },

  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },

  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FBFDFD',
    fontSize: 14,
    color: COLORS.text,
  },

  inputWithPrefix: {
    paddingLeft: 34,
  },

  inputPrefix: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.tealDark,
  },

  descriptionInput: {
    minHeight: 125,
    paddingTop: 13,
  },

  /* ----------------------------------------------------------
     IMAGE
  ---------------------------------------------------------- */

  imageUpload: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.teal,
    marginBottom: 28,
  },

  imageIcon: {
    width: 58,
    height: 58,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.tealLight,
    marginBottom: 13,
  },

  imageTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },

  imageDescription: {
    marginTop: 5,
    fontSize: 12,
    color: COLORS.secondaryText,
  },

  imageHint: {
    marginTop: 6,
    fontSize: 10,
    color: COLORS.muted,
  },

  /* ----------------------------------------------------------
     AVAILABILITY
  ---------------------------------------------------------- */

  availabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 28,
  },

  availabilityIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.tealLight,
  },

  availabilityContent: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  availabilityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },

  availabilityDescription: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.secondaryText,
  },

  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#EFF9F4',
  },

  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 5,
  },

  activeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
  },

  /* ----------------------------------------------------------
     ACTIONS
  ---------------------------------------------------------- */

  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  cancelButton: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 9,
  },

  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondaryText,
  },

  saveButton: {
    flex: 1.35,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: COLORS.teal,
    marginLeft: 9,
  },

  saveButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
  },

  /* ----------------------------------------------------------
     FOOTER
  ---------------------------------------------------------- */

  footerText: {
    textAlign: 'center',
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 4,
  },

  pressed: {
    opacity: 0.72,
  },
});

