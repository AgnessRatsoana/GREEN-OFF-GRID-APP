import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { FranchiseCarousel } from '../../components/cards/FranchiseCarousel';
import { ExistingClientChecklistSection } from '../../components/cards/ExistingClientChecklistSection';
import { FranchiseOpportunitySection } from '../../components/cards/FranchiseOpportunitySection';
import { FranchisePackages } from '../../components/cards/FranchisePackages';
import { InbuiltFranchiseServices } from '../../components/cards/InbuiltFranchiseServices';
import { FloatingBottomNav } from '../../components/common/FloatingBottomNav';
import { FloatingProfileMenuButton } from '../../components/common/FloatingProfileMenuButton';
import { appTheme } from '../../theme';

export function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const textScale = useMemo(() => {
    if (width >= 430) {
      return 1.15;
    }

    if (width >= 390) {
      return 1.07;
    }

    return 1;
  }, [width]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + appTheme.spacing.xs,
            paddingBottom: insets.bottom + 132,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileMenuSection}>
          <FloatingProfileMenuButton
            onPress={() => {
              navigation.dispatch(DrawerActions.openDrawer());
            }}
            profileImageUri={require('../../assets/images/temp-demo-profile.jpeg')}
          />
        </View>

        <View style={styles.discoverySection}>
          <Text
            style={[
              styles.discoveryTitle,
              {
                fontSize: 42 * textScale,
                lineHeight: 46 * textScale,
              },
            ]}
          >
            Discover
          </Text>
          <Text
            style={[
              styles.discoverySubtitle,
              {
                fontSize: 18 * textScale,
                lineHeight: 24 * textScale,
              },
            ]}
          >
            Your Best Franchise
          </Text>
        </View>

        <View style={styles.carouselSection}>
          <FranchiseCarousel />
        </View>

        <InbuiltFranchiseServices />

        <FranchisePackages />

        <FranchiseOpportunitySection />

        <ExistingClientChecklistSection />
      </ScrollView>

      <FloatingBottomNav activeKey="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: appTheme.spacing.md,
  },
  profileMenuSection: {
    marginBottom: appTheme.spacing.md,
  },
  discoverySection: {
    marginTop: appTheme.spacing.sm,
  },
  discoveryTitle: {
    color: appTheme.colors.textPrimary,
    fontWeight: '800',
  },
  discoverySubtitle: {
    marginTop: appTheme.spacing.xs,
    color: appTheme.colors.textSecondary,
    fontWeight: '500',
  },
  carouselSection: {
    marginTop: appTheme.spacing.lg,
  },
});
