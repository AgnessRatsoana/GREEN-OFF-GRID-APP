import { Ionicons } from '@expo/vector-icons';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import { PACKAGES } from '../../data/packages';
import { RootStackParamList } from '../../navigation/types';
import {
  type Application,
  fetchMyApplication,
} from '../../services/applications/applications';
import { appTheme } from '../../theme';

export function ApplicationStatusScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const route =
    useRoute<
      RouteProp<RootStackParamList, typeof ROUTES.APPLICATION_STATUS>
    >();

  const insets = useSafeAreaInsets();

  const [application, setApplication] =
    useState<Application | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const applicationId = route.params.applicationId;

  useEffect(() => {
    let mounted = true;

    const loadApplication = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await fetchMyApplication(applicationId);

        if (!mounted) {
          return;
        }

        if (!result) {
          setError('Application not found.');
          return;
        }

        setApplication(result);
      } catch (err) {
        if (!mounted) {
          return;
        }

        const message =
          err instanceof Error
            ? err.message
            : 'Unable to load your application.';

        setError(message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadApplication();

    return () => {
      mounted = false;
    };
  }, [applicationId]);

  const pkg =
    PACKAGES.find(
      (item) => item.id === application?.package_id,
    ) ?? PACKAGES[0];

  const status = application?.status ?? 'Submitted';

  const getStatusIcon = () => {
    switch (status) {
      case 'Approved':
        return 'checkmark-circle';

      case 'Rejected':
        return 'close-circle';

      case 'Consultation':
        return 'people-circle';

      case 'Under Review':
        return 'time';

      default:
        return 'checkmark-circle';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'Approved':
        return '#16845b';

      case 'Rejected':
        return '#c53d3d';

      case 'Consultation':
        return '#7357c7';

      case 'Under Review':
        return '#d18a19';

      default:
        return '#24b8b8';
    }
  };

  const getTimeline = () => {
    const stages = [
      {
        label: 'Submitted',
        description: 'Application received',
      },
      {
        label: 'Under Review',
        description: 'Your package details are being reviewed',
      },
      {
        label: 'Consultation',
        description: 'A consultant will contact you',
      },
      {
        label: 'Approved',
        description: 'Final approval and onboarding',
      },
    ];

    const currentIndex = stages.findIndex(
      (stage) => stage.label === status,
    );

    return stages.map((stage, index) => ({
      ...stage,
      done:
        currentIndex >= 0
          ? index <= currentIndex
          : index === 0,
    }));
  };

  if (loading) {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator
          size="large"
          color={appTheme.colors.primaryAccent}
        />

        <Text style={styles.loadingText}>
          Loading your application...
        </Text>
      </View>
    );
  }

  if (error || !application) {
    return (
      <View
        style={[
          styles.centerWrap,
          {
            paddingTop: insets.top + appTheme.spacing.md,
            paddingBottom: insets.bottom + appTheme.spacing.md,
          },
        ]}
      >
        <Ionicons
          name="alert-circle-outline"
          size={52}
          color="#c53d3d"
        />

        <Text style={styles.errorTitle}>
          Unable to load application
        </Text>

        <Text style={styles.errorText}>
          {error || 'Application not found.'}
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.primaryButtonText}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
          },
        ]}
      >
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={appTheme.colors.primaryAccent}
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          Application status
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.body,
          {
            paddingBottom: insets.bottom + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* STATUS CARD */}

        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: getStatusColor(),
              },
            ]}
          >
            <Ionicons
              name={getStatusIcon() as any}
              size={18}
              color="#FFFFFF"
            />

            <Text style={styles.statusText}>
              {status}
            </Text>
          </View>

          <Text style={styles.packageTitle}>
            {application.package_title || pkg.title}
          </Text>

          <Text style={styles.subtitle}>
            {status === 'Approved'
              ? 'Your application has been approved. Our team will guide you through the next onboarding steps.'
              : status === 'Rejected'
                ? 'Your application has been reviewed. Please contact our team if you would like more information.'
                : status === 'Consultation'
                  ? 'Your application has reached the consultation stage. A franchise consultant will contact you.'
                  : status === 'Under Review'
                    ? 'Our team is currently reviewing your application and package requirements.'
                    : 'Your application has been received and is now in the review process.'}
          </Text>
        </View>

        {/* APPLICATION DETAILS */}

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>
            Application details
          </Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              Applicant
            </Text>

            <Text style={styles.detailValue}>
              {application.full_name}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              Email
            </Text>

            <Text style={styles.detailValue}>
              {application.email}
            </Text>
          </View>

          {application.business_name ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                Business
              </Text>

              <Text style={styles.detailValue}>
                {application.business_name}
              </Text>
            </View>
          ) : null}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              Location
            </Text>

            <Text style={styles.detailValue}>
              {application.city || 'Not provided'}
              {application.province
                ? `, ${application.province}`
                : ''}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              Project type
            </Text>

            <Text style={styles.detailValue}>
              {application.project_type || 'Not provided'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              Submitted
            </Text>

            <Text style={styles.detailValue}>
              {new Date(
                application.created_at,
              ).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* TIMELINE */}

        <View style={styles.timelineWrap}>
          <Text style={styles.sectionTitle}>
            Application progress
          </Text>

          {getTimeline().map((item, index) => (
            <View
              key={item.label}
              style={styles.timelineRow}
            >
              <View style={styles.timelineIndicator}>
                <View
                  style={[
                    styles.timelineDot,
                    item.done &&
                      styles.timelineDotDone,
                  ]}
                />

                {index < 3 ? (
                  <View
                    style={[
                      styles.timelineLine,
                      item.done &&
                        styles.timelineLineDone,
                    ]}
                  />
                ) : null}
              </View>

              <View style={styles.timelineTextWrap}>
                <Text
                  style={[
                    styles.timelineLabel,
                    item.done &&
                      styles.timelineLabelDone,
                  ]}
                >
                  {item.label}
                </Text>

                <Text style={styles.timelineMeta}>
                  {item.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* NEXT STEPS */}

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>
            Next steps
          </Text>

          <Text style={styles.infoText}>
            We will contact you with the next actions,
            documentation needed, and your onboarding
            timeline.
          </Text>
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            navigation.navigate(ROUTES.MAIN_DRAWER)
          }
        >
          <Text style={styles.primaryButtonText}>
            Back to dashboard
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: appTheme.spacing.lg,
    backgroundColor: '#FFFFFF',
  },

  loadingText: {
    marginTop: 12,
    color: '#4f6e6e',
    fontSize: 14,
  },

  errorTitle: {
    marginTop: 14,
    color: '#123f3f',
    fontSize: 20,
    fontWeight: '800',
  },

  errorText: {
    marginTop: 8,
    color: '#5f7575',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: appTheme.spacing.md,
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

  body: {
    paddingHorizontal: appTheme.spacing.md,
    rowGap: appTheme.spacing.md,
  },

  statusCard: {
    backgroundColor: '#f5fdfd',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.15)',
    padding: appTheme.spacing.md,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    columnGap: 8,
  },

  statusText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
  },

  packageTitle: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: '900',
    color: '#123f3f',
  },

  subtitle: {
    marginTop: 8,
    color: '#4f6e6e',
    fontSize: 15,
    lineHeight: 22,
  },

  infoCard: {
    backgroundColor: '#f9fdfd',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.12)',
    padding: appTheme.spacing.md,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#123f3f',
    marginBottom: 16,
  },

  detailRow: {
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(36,184,184,0.08)',
  },

  detailLabel: {
    color: '#668080',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },

  detailValue: {
    color: '#123f3f',
    fontSize: 14,
    fontWeight: '700',
  },

  timelineWrap: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.12)',
    padding: appTheme.spacing.md,
  },

  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 68,
  },

  timelineIndicator: {
    width: 24,
    alignItems: 'center',
  },

  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#dfeaea',
    marginTop: 4,
  },

  timelineDotDone: {
    backgroundColor: '#24b8b8',
  },

  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e5eeee',
    marginTop: 4,
    marginBottom: -4,
  },

  timelineLineDone: {
    backgroundColor: '#24b8b8',
  },

  timelineTextWrap: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 14,
  },

  timelineLabel: {
    color: '#6e8a8a',
    fontWeight: '700',
    fontSize: 14,
  },

  timelineLabelDone: {
    color: '#123f3f',
  },

  timelineMeta: {
    color: '#4f6e6e',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  infoText: {
    color: '#4f6e6e',
    fontSize: 14,
    lineHeight: 22,
  },

  primaryButton: {
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
});