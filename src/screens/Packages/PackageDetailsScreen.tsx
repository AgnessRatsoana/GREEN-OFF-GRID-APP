import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import { PACKAGES } from '../../data/packages';
import { RootStackParamList } from '../../navigation/types';
import { useFavouritesStore } from '../../store/favouritesStore';
import { appTheme } from '../../theme';
import { FLOATING_NAV_CONTENT_INSET } from '../../components/common/FloatingBottomNav';

export function PackageDetailsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, typeof ROUTES.PACKAGE_DETAILS>>();
  const insets = useSafeAreaInsets();
  const toggle = useFavouritesStore((s) => s.toggle);
  const favourites = useFavouritesStore((s) => s.favourites);
  const isFavourite = (id: string) => favourites.includes(id);

  const pkg = PACKAGES.find((p) => p.id === route.params?.packageId);

  if (!pkg) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.errorText}>Package not found.</Text>
      </View>
    );
  }

  const saved = isFavourite(pkg.id);
  const isTeal = pkg.buttonVariant === 'teal';

  return (
    <View style={styles.root}>
      {/* Hero image */}
      <View style={styles.heroWrap}>
        <Image source={pkg.imageSource} style={styles.heroImage} contentFit="cover" />
        <View style={styles.heroDim} />

        {/* Back button */}
        <Pressable
          style={[styles.floatBtn, { top: insets.top + 12, left: 16 }]}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </Pressable>

        {/* Heart button */}
        <Pressable
          style={[
            styles.floatBtn,
            styles.heartBtn,
            saved && styles.heartBtnActive,
            { top: insets.top + 12, right: 16 },
          ]}
          onPress={() => toggle(pkg.id)}
          hitSlop={8}
        >
          <Ionicons
            name={saved ? 'heart' : 'heart-outline'}
            size={18}
            color={saved ? '#FFFFFF' : '#b89aff'}
          />
        </Pressable>

        <Pressable
          style={[styles.floatBtn, styles.messageBtn, { top: insets.top + 12, right: 64 }]}
          onPress={() => navigation.navigate(ROUTES.ENQUIRY, { itemType: 'package', itemId: pkg.id })}
          hitSlop={8}
          accessibilityLabel="Enquire about this package"
        >
          <Ionicons name="chatbubble-ellipses-outline" size={17} color="#24b8b8" />
        </Pressable>

        {/* Package title overlay */}
        <View style={[styles.heroTextBlock, { bottom: insets.top + 20 }]}>
          <View style={[styles.variantPill, isTeal ? styles.tealPill : styles.purplePill]}>
            <Text style={styles.variantPillText}>
              {isTeal ? 'ENTRY LEVEL' : 'PREMIUM'}
            </Text>
          </View>
          <Text style={styles.heroTitle}>{pkg.title}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#F4C542" />
            <Text style={styles.ratingText}>{pkg.rating} rating</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + FLOATING_NAV_CONTENT_INSET }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Price */}
        <View style={styles.priceCard}>
          <Text style={styles.fromLabel}>Starting from</Text>
          <Text style={styles.price}>{pkg.price}</Text>
        </View>

        {/* Description */}
        <Text style={styles.sectionLabel}>About this package</Text>
        <Text style={styles.description}>{pkg.description}</Text>

        {/* What's included */}
        <Text style={styles.sectionLabel}>What's included</Text>
        <View style={styles.bulletList}>
          {pkg.bullets.map((b) => (
            <View key={b} style={styles.bulletRow}>
              <View style={styles.bulletDot}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>

        {/* Why choose */}
        <View style={styles.whyCard}>
          <Ionicons name="leaf" size={18} color="#1f9c91" style={{ marginBottom: 8 }} />
          <Text style={styles.whyTitle}>Why Green Off-Grid?</Text>
          <Text style={styles.whyBody}>
            We are the leading off-grid energy franchise in South Africa, committed to
            sustainable impact and community empowerment. Every package is backed by our
            national support network.
          </Text>
        </View>

        {/* CTA */}
        <Pressable
          style={[styles.cta, isTeal ? styles.tealCta : styles.purpleCta]}
          onPress={() => navigation.navigate(ROUTES.APPLICATION_FORM, { packageId: pkg.id })}
        >
          <Text style={styles.ctaText}>{pkg.buttonLabel}</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#1a3f3f',
    fontSize: 16,
  },
  heroWrap: {
    height: 320,
    width: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  floatBtn: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heartBtn: {
    borderWidth: 1.5,
    borderColor: '#b89aff',
    backgroundColor: 'transparent',
  },
  heartBtnActive: {
    backgroundColor: '#b89aff',
    borderColor: '#b89aff',
  },
  messageBtn: {
    borderWidth: 1.5,
    borderColor: '#24b8b8',
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  heroTextBlock: {
    position: 'absolute',
    left: 20,
    right: 20,
  },
  variantPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  tealPill: {
    backgroundColor: 'rgba(36,184,184,0.3)',
  },
  purplePill: {
    backgroundColor: 'rgba(184,154,255,0.3)',
  },
  variantPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 5,
  },
  ratingText: {
    color: '#eff7f7',
    fontSize: 13,
    fontWeight: '600',
  },
  body: {
    padding: appTheme.spacing.md,
    rowGap: appTheme.spacing.sm,
  },
  priceCard: {
    backgroundColor: '#f7fdfd',
    borderRadius: 16,
    padding: appTheme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.2)',
    marginBottom: 4,
  },
  fromLabel: {
    color: '#668080',
    fontSize: 12,
    marginBottom: 2,
  },
  price: {
    color: '#123f3f',
    fontSize: 32,
    fontWeight: '900',
  },
  sectionLabel: {
    color: '#24b8b8',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 8,
  },
  description: {
    color: '#4f6e6e',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 8,
  },
  bulletList: {
    rowGap: 10,
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  bulletDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#24b8b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletText: {
    color: '#4f6e6e',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  whyCard: {
    backgroundColor: 'rgba(36,184,184,0.08)',
    borderRadius: 16,
    padding: appTheme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.2)',
    marginVertical: 8,
  },
  whyTitle: {
    color: '#123f3f',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  whyBody: {
    color: '#4f6e6e',
    fontSize: 14,
    lineHeight: 22,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 8,
    borderRadius: 999,
    paddingVertical: 16,
    marginTop: 8,
  },
  tealCta: {
    backgroundColor: '#24b8b8',
  },
  purpleCta: {
    backgroundColor: '#b89aff',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
