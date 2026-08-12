import { DrawerActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { FranchiseCarousel } from '../../components/cards/FranchiseCarousel';
import { AccessoriesShowcaseSection } from '../../components/cards/AccessoriesShowcaseSection';
import { ExistingClientChecklistSection } from '../../components/cards/ExistingClientChecklistSection';
import { FranchiseOpportunitySection } from '../../components/cards/FranchiseOpportunitySection';
import { FranchisePackages } from '../../components/cards/FranchisePackages';
import { InbuiltFranchiseServices } from '../../components/cards/InbuiltFranchiseServices';
import { MarketplaceAccessoriesSection } from '../../components/cards/MarketplaceAccessoriesSection';
import { FloatingProfileMenuButton } from '../../components/common/FloatingProfileMenuButton';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { appTheme } from '../../theme';

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const user = useAuthStore((s) => s.user);

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
        <View style={styles.topRow}>
          <FloatingProfileMenuButton
            onPress={() => {
              navigation.dispatch(DrawerActions.openDrawer());
            }}
            profileImageUri={user?.avatarUrl || null}
          />
          <Image
            source={require('../../assets/images/Green-Off-Grid-Logo.jpg')}
            style={styles.logo}
            contentFit="contain"
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

        <AccessoriesShowcaseSection />

        <FranchisePackages />

        <FranchiseOpportunitySection />

        <MarketplaceAccessoriesSection />

        <ExistingClientChecklistSection />
      </ScrollView>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    width: 138,
    height: 50,
  },
  discoverySection: {
    marginTop: appTheme.spacing.lg,
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
