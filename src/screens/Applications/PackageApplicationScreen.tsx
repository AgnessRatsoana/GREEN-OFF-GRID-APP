import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
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
import { PACKAGES } from '../../data/packages';
import { RootStackParamList } from '../../navigation/types';
import { createApplication } from '../../services/applications/applications';
import { appTheme } from '../../theme';

type Stage = 'details' | 'location' | 'review';

const stageTitles: Record<Stage, string> = {
  details: 'Key details',
  location: 'Location & setup',
  review: 'Review & submit',
};

export function PackageApplicationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, typeof ROUTES.APPLICATION_FORM>>();
  const insets = useSafeAreaInsets();

  const pkg = useMemo(
    () => PACKAGES.find((item) => item.id === route.params?.packageId),
    [route.params?.packageId],
  );

  const [stage, setStage] = useState<Stage>('details');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [projectType, setProjectType] = useState('Residential');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);


  if (!pkg) {
    return (
      <View style={styles.rootCenter}>
        <Text style={styles.emptyText}>Package not found.</Text>
      </View>
    );
  }

  const nextStage = () => {
    if (stage === 'details') {
      setStage('location');
      return;
    }

    if (stage === 'location') {
      setStage('review');
    }
  };

  const previousStage = () => {
    if (stage === 'location') {
      setStage('details');
      return;
    }

    if (stage === 'review') {
      setStage('location');
    }
  };

  const handleSubmit = async () => {
  try {
    setSubmitted(false);

    const application = await createApplication({
      packageId: pkg.id,
      packageTitle: pkg.title,

      fullName,
      email,
      phone,

      businessName,

      city,
      province,

      projectType: projectType as
        | 'Residential'
        | 'Commercial'
        | 'Industrial',

      budget,
      notes,
    });

    setSubmitted(true);

    navigation.navigate(ROUTES.APPLICATION_STATUS, {
      applicationId: application.id,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to submit your application.';

    console.error('Application submission failed:', message);

    setSubmitted(false);
  }
};

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + appTheme.spacing.md }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={appTheme.colors.primaryAccent} />
        </Pressable>
        <Text style={styles.headerTitle}>Application</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.packageBadgeWrap}>
        <Text style={styles.packageBadge}>{pkg.title}</Text>
      </View>

      <View style={styles.progressWrap}>
        {(['details', 'location', 'review'] as Stage[]).map((key) => {
          const isActive = stage === key;
          const isDone = ['details', 'location', 'review'].indexOf(key) < ['details', 'location', 'review'].indexOf(stage);

          return (
            <View key={key} style={styles.progressItem}>
              <View style={[styles.progressDot, isActive && styles.progressDotActive, isDone && styles.progressDotDone]} />
              <Text style={[styles.progressLabel, isActive && styles.progressLabelActive]}>{stageTitles[key]}</Text>
            </View>
          );
        })}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {stage === 'details' ? (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Your information</Text>

            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full name"
              style={styles.input}
              placeholderTextColor="#7b8a8a"
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              placeholderTextColor="#7b8a8a"
            />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Contact number"
              keyboardType="phone-pad"
              style={styles.input}
              placeholderTextColor="#7b8a8a"
            />
            <TextInput
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Business / brand name"
              style={styles.input}
              placeholderTextColor="#7b8a8a"
            />
          </View>
        ) : null}

        {stage === 'location' ? (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Location and demand</Text>

            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="City / town"
              style={styles.input}
              placeholderTextColor="#7b8a8a"
            />
            <TextInput
              value={province}
              onChangeText={setProvince}
              placeholder="Province"
              style={styles.input}
              placeholderTextColor="#7b8a8a"
            />
            <Text style={styles.smallLabel}>Project type</Text>
            <View style={styles.segmentRow}>
              {['Residential', 'Commercial', 'Industrial'].map((option) => (
                <Pressable
                  key={option}
                  style={[styles.segmentButton, projectType === option && styles.segmentButtonActive]}
                  onPress={() => setProjectType(option)}
                >
                  <Text style={[styles.segmentText, projectType === option && styles.segmentTextActive]}>{option}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={budget}
              onChangeText={setBudget}
              placeholder="Estimated budget (e.g. R200 000)"
              style={styles.input}
              placeholderTextColor="#7b8a8a"
            />
          </View>
        ) : null}

        {stage === 'review' ? (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Review your request</Text>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>Package</Text>
              <Text style={styles.reviewValue}>{pkg.title}</Text>
              <Text style={styles.reviewLabel}>Applicant</Text>
              <Text style={styles.reviewValue}>{fullName || 'Not provided'}</Text>
              <Text style={styles.reviewLabel}>Email</Text>
              <Text style={styles.reviewValue}>{email || 'Not provided'}</Text>
              <Text style={styles.reviewLabel}>Phone</Text>
              <Text style={styles.reviewValue}>{phone || 'Not provided'}</Text>
              <Text style={styles.reviewLabel}>Location</Text>
              <Text style={styles.reviewValue}>{city || 'Not provided'}, {province || 'Not provided'}</Text>
              <Text style={styles.reviewLabel}>Project type</Text>
              <Text style={styles.reviewValue}>{projectType}</Text>
              <Text style={styles.reviewLabel}>Budget</Text>
              <Text style={styles.reviewValue}>{budget || 'Not provided'}</Text>
            </View>

            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes or requirements"
              multiline
              numberOfLines={5}
              style={[styles.input, styles.textArea]}
              placeholderTextColor="#7b8a8a"
            />
          </View>
        ) : null}

        {submitted ? <Text style={styles.successMessage}>Application submitted. You can track the status from your dashboard.</Text> : null}
      </ScrollView>

      <View style={styles.footerActions}>
        {stage !== 'details' ? (
          <Pressable style={styles.secondaryButton} onPress={previousStage}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.secondaryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>
        )}

        {stage !== 'review' ? (
          <Pressable style={styles.primaryButton} onPress={nextStage}>
            <Text style={styles.primaryButtonText}>Next</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.primaryButton} onPress={handleSubmit}>
            <Text style={styles.primaryButtonText}>Submit</Text>
          </Pressable>
        )}
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
  rootCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  emptyText: {
    color: '#123f3f',
    fontSize: 16,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: appTheme.spacing.sm,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#123f3f',
  },
  headerSpacer: {
    width: 38,
  },
  packageBadgeWrap: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(36, 184, 184, 0.12)',
    borderRadius: 999,
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: 6,
    marginBottom: 16,
  },
  packageBadge: {
    color: '#0f6464',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: appTheme.spacing.md,
  },
  progressItem: {
    flex: 1,
    alignItems: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#dfeaea',
    marginBottom: 8,
  },
  progressDotActive: {
    backgroundColor: '#24b8b8',
  },
  progressDotDone: {
    backgroundColor: '#0f6464',
  },
  progressLabel: {
    fontSize: 10,
    color: '#6f8c8c',
    textAlign: 'center',
  },
  progressLabelActive: {
    color: '#123f3f',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  formSection: {
    rowGap: appTheme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#123f3f',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(36, 184, 184, 0.24)',
    borderRadius: 16,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
    fontSize: 15,
    color: '#213232',
    backgroundColor: '#fbffff',
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  smallLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#123f3f',
    marginTop: 6,
  },
  segmentRow: {
    flexDirection: 'row',
    columnGap: 8,
    flexWrap: 'wrap',
    rowGap: 8,
  },
  segmentButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(36, 184, 184, 0.28)',
    backgroundColor: '#f9fdfd',
  },
  segmentButtonActive: {
    backgroundColor: '#24b8b8',
    borderColor: '#24b8b8',
  },
  segmentText: {
    color: '#214d4d',
    fontSize: 12,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  reviewCard: {
    backgroundColor: '#f6fdfd',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(36, 184, 184, 0.18)',
    padding: appTheme.spacing.md,
  },
  reviewLabel: {
    color: '#668080',
    fontSize: 12,
    marginTop: 10,
    marginBottom: 4,
    fontWeight: '700',
  },
  reviewValue: {
    color: '#123f3f',
    fontSize: 15,
    fontWeight: '700',
  },
  successMessage: {
    color: '#0f6464',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: appTheme.spacing.sm,
    paddingVertical: appTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(36, 184, 184, 0.18)',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: appTheme.spacing.sm,
    backgroundColor: '#24b8b8',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: appTheme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(36, 184, 184, 0.22)',
    backgroundColor: '#f4fcfc',
  },
  secondaryButtonText: {
    color: '#123f3f',
    fontSize: 15,
    fontWeight: '800',
  },
});
