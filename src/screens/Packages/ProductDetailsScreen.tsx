import React, { useEffect, useState } from 'react';

import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import { MARKETPLACE_PRODUCTS } from '../../data/marketplace';
import { PACKAGES } from '../../data/packages';
import { fetchMarketplaceProductById, type MarketplaceProduct } from '../../services/marketplace/marketplace';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useFavouritesStore } from '../../store/favouritesStore';
import { appTheme } from '../../theme';
import { FLOATING_NAV_CONTENT_INSET } from '../../components/common/FloatingBottomNav';
import {
  BUSINESS_DISCOUNT_MIN_QUANTITY,
  getBusinessLineUnitPrice,
  getBusinessPrice,
  isBusinessDiscountEligible,
} from '../../utils/pricing';

export function ProductDetailsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, typeof ROUTES.PRODUCT_DETAILS>>();
  const insets = useSafeAreaInsets();
  const isBusiness = useAuthStore((s) => s.user?.accountType === 'business');
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const [quantity, setQuantity] = useState(10);
  const toggle = useFavouritesStore((s) => s.toggle);
  const favourites = useFavouritesStore((s) => s.favourites);
  const isFavourite = (id: string) => favourites.includes(id);

  const [product, setProduct] = useState<MarketplaceProduct | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const isInCart = product ? cartItems.some((entry) => entry.id === product.id) : false;

  useEffect(() => {
    let isMounted = true;

    const loadProduct = async () => {
      if (!route.params?.productId) {
        setIsLoadingProduct(false);
        return;
      }

      setIsLoadingProduct(true);

      // Legacy Home catalogue IDs (e.g. "product-09") are not Supabase UUIDs;
      // querying the uuid column with them causes a 400. Use the static record.
      const isSupabaseId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        route.params.productId,
      );

      try {
        const loadedProduct = isSupabaseId
          ? await fetchMarketplaceProductById(route.params.productId)
          : null;
        if (isMounted) {
          if (loadedProduct) {
            setProduct(loadedProduct);
          } else {
            throw new Error('Not a Supabase product');
          }
        }
      } catch {
        if (isMounted) {
          const catalogueProduct = MARKETPLACE_PRODUCTS.find(
            (item) => item.id === route.params?.productId,
          );

          setProduct(
            catalogueProduct
              ? {
                  ...catalogueProduct,
                  costPrice: null,
                  imageUrl: null,
                  isActive: true,
                  createdAt: '',
                  updatedAt: '',
                }
              : null,
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingProduct(false);
        }
      }
    };

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [route.params?.productId]);

  if (isLoadingProduct) {
    return (
      <View style={[styles.root, styles.centerWrap]}>
        <Text style={styles.errorText}>Loading product...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.root, styles.centerWrap]}>
        <Text style={styles.errorText}>Product not found.</Text>
      </View>
    );
  }

  const recommendedProducts = MARKETPLACE_PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4);
  const recommendedPackage = PACKAGES[0];
  const saved = isFavourite(product.id);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#24b8b8" />
        </Pressable>
        <Text style={styles.headerTitle}>Product Details</Text>
        <Pressable
          style={[styles.heartBtn, saved && styles.heartBtnActive]}
          onPress={() => toggle(product.id)}
          hitSlop={8}
        >
          <Ionicons name={saved ? 'heart' : 'heart-outline'} size={16} color={saved ? '#FFFFFF' : '#b89aff'} />
        </Pressable>
        <Pressable
          style={styles.messageBtn}
          onPress={() => navigation.navigate(ROUTES.ENQUIRY, { itemType: 'product', itemId: product.id })}
          hitSlop={8}
          accessibilityLabel="Enquire about this product"
        >
          <Ionicons name="chatbubble-ellipses-outline" size={17} color="#24b8b8" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + FLOATING_NAV_CONTENT_INSET }]} showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          <Image source={require('../../assets/images/demoAccesories.jpg')} style={styles.heroImage} contentFit="cover" />
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={11} color="#F4C542" />
            <Text style={styles.ratingBadgeText}>4.8</Text>
          </View>
        </View>

        <Text style={styles.productName}>{product.name}</Text>
        {product.description ? <Text style={styles.productDescription}>{product.description}</Text> : null}
        <Text style={styles.metaText}>Category: {product.category || 'General'}</Text>
        <Text style={styles.metaText}>SKU: {product.sku || 'N/A'}</Text>
        {isBusiness ? (
          isBusinessDiscountEligible(quantity) ? (
            <View style={styles.priceRow}>
              <Text style={styles.originalPriceStrike}>R {product.price.toLocaleString()}</Text>
              <Text style={styles.priceText}>R {getBusinessPrice(product.price).toLocaleString()}</Text>
            </View>
          ) : (
            <Text style={styles.priceText}>R {product.price.toLocaleString()}</Text>
          )
        ) : (
          <Text style={styles.priceText}>R {product.price.toLocaleString()}</Text>
        )}

        {isBusiness && (
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Quantity</Text>

            <View style={styles.quantityControls}>
              <Pressable
                style={styles.quantityButton}
                onPress={() => setQuantity((prev) => Math.max(1, prev - 1))}
              >
                <Text style={styles.quantityButtonText}>−</Text>
              </Pressable>

              <Text style={styles.quantityValue}>{quantity}</Text>

              <Pressable
                style={styles.quantityButton}
                onPress={() => setQuantity((prev) => prev + 1)}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </Pressable>
            </View>

            <Text style={styles.totalLabel}>Total</Text>

            <Text style={styles.totalPrice}>
              R {(getBusinessLineUnitPrice(product.price, quantity) * quantity).toLocaleString()}
            </Text>

            {!isBusinessDiscountEligible(quantity) ? (
              <View style={styles.discountNotice}>
                <Ionicons name="information-circle-outline" size={14} color="#b07908" />
                <Text style={styles.discountNoticeText}>
                  Discount not applicable below {BUSINESS_DISCOUNT_MIN_QUANTITY} quantities
                </Text>
              </View>
            ) : null}
          </View>
        )}

        <Pressable
          style={[styles.addButton, isInCart && styles.addButtonAdded]}
          onPress={() =>
            addItem(
              {
                id: product.id,
                name: product.name,
                price: product.price,
                type: 'accessory',
                imageUrl: product.imageUrl,
              },
              isBusiness ? quantity : 1
            )
          }
        >
          {isInCart ? <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" /> : null}
          <Text style={styles.addButtonText}>
            {isInCart ? 'Added' : isBusiness ? 'Add bulk order' : 'Add to Cart'}
          </Text>
        </Pressable>

        <Text style={styles.sectionTitle}>More accessories</Text>
        <View style={styles.recommendGrid}>
          {recommendedProducts.map((item) => {
            const itemSaved = isFavourite(item.id);
            return (
              <Pressable
                key={item.id}
                style={styles.recommendCard}
                onPress={() => navigation.push(ROUTES.PRODUCT_DETAILS, { productId: item.id })}
              >
                <View style={styles.recommendImageWrap}>
                  <Image source={require('../../assets/images/demoAccesories.jpg')} style={styles.recommendImage} contentFit="cover" />
                  <Pressable
                    style={[styles.cardHeartBtn, itemSaved && styles.heartBtnActive]}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggle(item.id);
                    }}
                    hitSlop={8}
                  >
                    <Ionicons name={itemSaved ? 'heart' : 'heart-outline'} size={14} color={itemSaved ? '#FFFFFF' : '#b89aff'} />
                  </Pressable>
                </View>
                <View style={styles.recommendBody}>
                  <Text numberOfLines={2} style={styles.recommendName}>{item.name}</Text>
                  <Text style={styles.recommendPrice}>R {item.price.toLocaleString()}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {recommendedPackage ? (
          <>
            <Text style={styles.sectionTitle}>Recommended package</Text>
            <Pressable
              style={styles.packageCard}
              onPress={() => navigation.navigate(ROUTES.PACKAGE_DETAILS, { packageId: recommendedPackage.id })}
            >
              <Image source={recommendedPackage.imageSource} style={styles.packageImage} contentFit="cover" />
              <View style={styles.packageBody}>
                <Text style={styles.packageTitle}>{recommendedPackage.title}</Text>
                <Text style={styles.packagePrice}>{recommendedPackage.price}</Text>
              </View>
            </Pressable>
          </>
        ) : null}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#1a3f3f',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: appTheme.spacing.md,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(36,184,184,0.18)',
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
    color: '#1a3f3f',
    fontSize: 22,
    fontWeight: '800',
  },
  heartBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#b89aff',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtnActive: {
    backgroundColor: '#b89aff',
    borderColor: '#b89aff',
  },
  messageBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#24b8b8',
    backgroundColor: 'rgba(36,184,184,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: appTheme.spacing.xs,
  },
  body: {
    padding: appTheme.spacing.md,
    rowGap: appTheme.spacing.sm,
  },
  heroWrap: {
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
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
  productName: {
    color: '#111111',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    marginTop: appTheme.spacing.sm,
  },
  productDescription: {
    color: '#5a7474',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  metaText: {
    color: '#5a7474',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  priceText: {
    color: '#111111',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
    marginTop: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
    marginTop: 6,
  },
  originalPriceStrike: {
    color: '#9fb1b1',
    fontSize: 16,
    textDecorationLine: 'line-through',
  },
  quantitySection: {
    marginTop: 8,
  },

  quantityLabel: {
    color: '#1a3f3f',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },

  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  quantityButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  quantityButtonText: {
    color: '#1a3f3f',
    fontSize: 24,
    fontWeight: '700',
  },

  quantityValue: {
    minWidth: 50,
    textAlign: 'center',
    color: '#111111',
    fontSize: 18,
    fontWeight: '700',
  },

  totalLabel: {
    color: '#1a3f3f',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },

  totalPrice: {
    color: '#111111',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  addButton: {
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: '#24b8b8',
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    columnGap: 6,
  },
  addButtonAdded: {
    backgroundColor: '#178a6a',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
  },
  discountNotice: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(176,121,8,0.35)',
    backgroundColor: '#fff8e8',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  discountNoticeText: {
    color: '#8a6207',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#1a3f3f',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    marginTop: appTheme.spacing.md,
    marginBottom: 4,
  },
  recommendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: appTheme.spacing.sm,
  },
  recommendCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.18)',
    backgroundColor: '#FFFFFF',
  },
  recommendImageWrap: {
    height: 110,
    position: 'relative',
  },
  recommendImage: {
    width: '100%',
    height: '100%',
  },
  cardHeartBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#b89aff',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendBody: {
    padding: appTheme.spacing.sm,
  },
  recommendName: {
    color: '#1a3f3f',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
  },
  recommendPrice: {
    color: '#111111',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    marginTop: 6,
  },
  packageCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.18)',
    backgroundColor: '#FFFFFF',
  },
  packageImage: {
    width: '100%',
    height: 180,
  },
  packageBody: {
    padding: appTheme.spacing.md,
  },
  packageTitle: {
    color: '#1a3f3f',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
  },
  packagePrice: {
    color: '#111111',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    marginTop: 4,
  },
});
