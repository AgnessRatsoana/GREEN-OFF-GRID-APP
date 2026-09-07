import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import { MARKETPLACE_PRODUCTS } from '../../data/marketplace';
import { PACKAGES } from '../../data/packages';
import { RootStackParamList } from '../../navigation/types';
import { useCartStore } from '../../store/cartStore';
import { useFavouritesStore } from '../../store/favouritesStore';
import { appTheme } from '../../theme';
import type { AppTheme } from '../../theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { FLOATING_NAV_CONTENT_INSET } from '../../components/common/FloatingBottomNav';

export function FavouritesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const favourites = useFavouritesStore((s) => s.favourites);
  const toggle = useFavouritesStore((s) => s.toggle);
  const addItem = useCartStore((s) => s.addItem);
  const theme = useAppTheme();
  const styles = createStyles(theme);

  const savedPackages = PACKAGES.filter((p) => favourites.includes(p.id));
  const savedProducts = MARKETPLACE_PRODUCTS.filter((p) => favourites.includes(p.id));
  const totalSaved = savedPackages.length + savedProducts.length;


  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#b89aff" />
        </Pressable>
        <Text style={styles.headerTitle}>Favourites</Text>
        <View style={styles.heartDecor}>
          <Ionicons name="heart" size={22} color="#b89aff" />
        </View>
      </View>

      {totalSaved === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={72} color="#b89aff" style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No favourites yet</Text>
          <Text style={styles.emptyBody}>
            Tap the heart on any accessory or package to save it here.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + FLOATING_NAV_CONTENT_INSET }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.countLabel}>
            {totalSaved} {totalSaved === 1 ? 'item' : 'items'} saved
          </Text>

          {savedProducts.length ? <Text style={styles.groupTitle}>Accessories</Text> : null}
          {savedProducts.length ? (
            <View style={styles.accessoriesRow}>
              {savedProducts.map((item) => {
                const rating = (item as typeof item & { rating?: number }).rating ?? 4.8;

                return (
                  <Pressable
                    key={item.id}
                    style={styles.accessoryCard}
                    onPress={() => navigation.navigate(ROUTES.PRODUCT_DETAILS, { productId: item.id })}
                  >
                    <View style={styles.accessoryImageWrap}>
                      <Image source={require('../../assets/images/demoAccesories.jpg')} style={styles.accessoryImage} contentFit="cover" />
                      <Pressable
                        style={[styles.heartBtn, styles.heartBtnActive]}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggle(item.id);
                        }}
                        hitSlop={8}
                      >
                        <Ionicons name="heart" size={16} color="#FFFFFF" />
                      </Pressable>
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={11} color="#F4C542" />
                        <Text style={styles.ratingBadgeText}>{rating.toFixed(1)}</Text>
                      </View>
                    </View>

                    <View style={styles.accessoryContent}>
                      <Text style={styles.productName}>{item.name}</Text>
                      {item.description ? <Text style={styles.productDescription}>{item.description}</Text> : null}
                      <Text style={styles.categoryText}>{item.category || 'General'}</Text>
                      <View style={styles.cardFooter}>
                        <Text style={styles.priceText}>R {item.price.toLocaleString()}</Text>
                        <Pressable
                          style={styles.addButton}
                          onPress={() => addItem({ id: item.id, name: item.name, price: item.price, type: 'accessory' })}
                        >
                          <Text style={styles.addButtonText}>Add</Text>
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {savedPackages.length ? <Text style={[styles.groupTitle, styles.franchiseLabel]}>Packages</Text> : null}
          {savedPackages.map((item) => {
            const isTeal = item.buttonVariant === 'teal';

            return (
              <Pressable
                key={item.id}
                style={styles.franchiseCard}
                onPress={() => navigation.navigate(ROUTES.PACKAGE_DETAILS, { packageId: item.id })}
              >
                <View style={styles.franchiseImageWrap}>
                  <Image source={item.imageSource} style={styles.franchiseImage} contentFit="cover" />
                  <Pressable
                    style={[styles.heartBtn, styles.heartBtnActive]}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggle(item.id);
                    }}
                    hitSlop={8}
                  >
                    <Ionicons name="heart" size={16} color="#FFFFFF" />
                  </Pressable>
                </View>

                <View style={styles.franchiseContent}>
                  <Text style={styles.franchiseTitle}>{item.title}</Text>

                  <View style={styles.bulletList}>
                    {item.bullets.map((bullet) => (
                      <Text key={bullet} style={styles.bulletText}>
                        - {bullet}
                      </Text>
                    ))}
                  </View>

                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#F4C542" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                  </View>

                  <Text style={styles.fromText}>From</Text>
                  <Text style={styles.priceText}>{item.price}</Text>

                  <Pressable
                    style={[styles.btn, isTeal ? styles.tealBtn : styles.purpleBtn]}
                    onPress={(e) => {
                      e.stopPropagation();
                      navigation.navigate(ROUTES.APPLICATION_FORM, { packageId: item.id });
                    }}
                  >
                    <Text style={styles.btnText}>{item.buttonLabel}</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
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
    letterSpacing: 0.5,
  },
  heartDecor: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(184,154,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.6,
  },
  emptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
  },
  emptyBody: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  list: {
    padding: appTheme.spacing.md,
    rowGap: appTheme.spacing.md,
  },
  countLabel: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  groupTitle: {
    color: theme.colors.primaryAccent,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  franchiseLabel: {
    marginTop: 8,
  },
  accessoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  accessoryCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  accessoryImageWrap: {
    height: 160,
    width: '100%',
    position: 'relative',
  },
  accessoryImage: {
    width: '100%',
    height: '100%',
  },
  accessoryContent: {
    padding: appTheme.spacing.md,
  },
  productName: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  productDescription: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  categoryText: {
    color: theme.colors.primaryAccent,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  cardFooter: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    borderRadius: 999,
    backgroundColor: theme.colors.primaryAccent,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  heartBtn: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#b89aff',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heartBtnActive: {
    backgroundColor: '#b89aff',
    borderColor: '#b89aff',
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ratingBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  franchiseCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    position: 'relative',
  },
  franchiseImageWrap: {
    height: 170,
    width: '100%',
    position: 'relative',
  },
  franchiseImage: {
    width: '100%',
    height: '100%',
  },
  franchiseContent: {
    paddingHorizontal: appTheme.spacing.md,
    paddingTop: appTheme.spacing.md,
    paddingBottom: appTheme.spacing.md,
  },
  franchiseTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  bulletList: {
    marginTop: appTheme.spacing.sm,
    rowGap: 4,
  },
  bulletText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  ratingRow: {
    marginTop: appTheme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
  },
  ratingText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  fromText: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400',
  },
  priceText: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
  },
  btn: {
    marginTop: appTheme.spacing.sm,
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: appTheme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tealBtn: {
    backgroundColor: theme.colors.primaryAccent,
  },
  purpleBtn: {
    backgroundColor: theme.colors.supportPurple,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
});
