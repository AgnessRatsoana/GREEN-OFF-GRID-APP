
import React, { useEffect, useState } from 'react';

import { Ionicons } from '@expo/vector-icons';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import {
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
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useFavouritesStore } from '../../store/favouritesStore';
import { appTheme } from '../../theme';
import { getBusinessPrice } from '../../utils/pricing';
import { getSupabaseClient } from '../../services/auth/supabaseClient';

type MarketplaceProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  brand: string | null;
  category: string | null;
  sku: string | null;
  cost_price: number | null;
  quantity: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const supabase = getSupabaseClient();

export function ProductDetailsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const route =
    useRoute<
      RouteProp<RootStackParamList, typeof ROUTES.PRODUCT_DETAILS>
    >();

  const insets = useSafeAreaInsets();

  const isBusiness = useAuthStore(
    (s) => s.user?.accountType === 'business',
  );

  const addItem = useCartStore((s) => s.addItem);

  const toggle = useFavouritesStore((s) => s.toggle);
  const favourites = useFavouritesStore((s) => s.favourites);

  const [product, setProduct] = useState<MarketplaceProduct | null>(null);

  const [recommendedProducts, setRecommendedProducts] = useState<
    MarketplaceProduct[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [quantity, setQuantity] = useState(1);

  const productId = route.params?.productId;

  const isFavourite = (id: string) =>
    favourites.includes(id);

  useEffect(() => {
    let mounted = true;

    async function loadProduct() {
      if (!productId) {
        setError('Product ID is missing.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: productError } = await supabase
          .from('marketplace_products')
          .select(`
            id,
            name,
            description,
            price,
            brand,
            category,
            sku,
            cost_price,
            quantity,
            image_url,
            is_active,
            created_at,
            updated_at
          `)
          .eq('id', productId)
          .eq('is_active', true)
          .single();

        if (productError) {
          throw productError;
        }

        if (!data) {
          throw new Error('Product was not found.');
        }

        if (!mounted) {
          return;
        }

        setProduct(data as MarketplaceProduct);

        /*
         * Load other active marketplace products.
         *
         * We deliberately keep this simple for now.
         * The recommendations come directly from Supabase.
         */
        const {
          data: recommendedData,
          error: recommendedError,
        } = await supabase
          .from('marketplace_products')
          .select(`
            id,
            name,
            description,
            price,
            brand,
            category,
            sku,
            cost_price,
            quantity,
            image_url,
            is_active,
            created_at,
            updated_at
          `)
          .eq('is_active', true)
          .neq('id', productId)
          .order('created_at', {
            ascending: false,
          })
          .limit(4);

        if (recommendedError) {
          console.warn(
            'Could not load recommended products:',
            recommendedError.message,
          );
        }

        if (mounted) {
          setRecommendedProducts(
            (recommendedData ?? []) as MarketplaceProduct[],
          );
        }
      } catch (err) {
        console.error(
          'Failed to load product:',
          err,
        );

        if (mounted) {
          setProduct(null);
          setError(
            'Unable to load this product.',
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      mounted = false;
    };
  }, [productId]);

  /*
   * Loading state
   */
  if (loading) {
    return (
      <View
        style={[
          styles.root,
          styles.centerWrap,
        ]}
      >
        <Ionicons
          name="sync-outline"
          size={28}
          color="#24b8b8"
        />

        <Text style={styles.loadingText}>
          Loading product...
        </Text>
      </View>
    );
  }

  /*
   * Product not found / database error
   */
  if (!product) {
    return (
      <View
        style={[
          styles.root,
          styles.centerWrap,
        ]}
      >
        <Ionicons
          name="alert-circle-outline"
          size={42}
          color="#b89aff"
        />

        <Text style={styles.errorText}>
          {error ?? 'Product not found.'}
        </Text>

        <Pressable
          style={styles.backToMarketplaceButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backToMarketplaceText}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  const saved = isFavourite(product.id);

  /*
   * Database stock quantity
   */
  const stock = Math.max(
    0,
    Number(product.quantity ?? 0),
  );

  const hasStock = stock > 0;

  /*
   * Business users receive the business price.
   */
  const displayedPrice = isBusiness
    ? getBusinessPrice(product.price)
    : product.price;

  const totalPrice =
    displayedPrice * quantity;

  /*
   * Use database image_url when available.
   * Fall back to the existing local demo image
   * when image_url has not yet been migrated.
   */
  const productImage = product.image_url
    ? { uri: product.image_url }
    : require('../../assets/images/demoAccesories.jpg');

  const recommendedPackage = PACKAGES[0];

  /*
   * Quantity controls.
   */
  const increaseQuantity = () => {
    if (!hasStock) {
      return;
    }

    setQuantity((prev) =>
      Math.min(stock, prev + 1),
    );
  };

  const decreaseQuantity = () => {
    setQuantity((prev) =>
      Math.max(1, prev - 1),
    );
  };

  /*
   * Add product to cart.
   */
  const handleAddToCart = () => {
    if (!hasStock) {
      return;
    }

    const requestedQuantity =
      isBusiness ? quantity : 1;

    if (requestedQuantity > stock) {
      return;
    }

    addItem(
      {
        id: product.id,
        name: product.name,
        price: displayedPrice,
        type: 'accessory',
      },
      requestedQuantity,
    );
  };

  return (
    <View style={styles.root}>
      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            paddingTop:
              insets.top + 12,
          },
        ]}
      >
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#24b8b8"
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          Product Details
        </Text>

        <Pressable
          style={[
            styles.heartBtn,
            saved && styles.heartBtnActive,
          ]}
          onPress={() => toggle(product.id)}
          hitSlop={8}
        >
          <Ionicons
            name={
              saved
                ? 'heart'
                : 'heart-outline'
            }
            size={16}
            color={
              saved
                ? '#FFFFFF'
                : '#b89aff'
            }
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.body,
          {
            paddingBottom:
              insets.bottom + 34,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* PRODUCT IMAGE */}
        <View style={styles.heroWrap}>
          <Image
            source={productImage}
            style={styles.heroImage}
            contentFit="cover"
          />

          <View style={styles.ratingBadge}>
            <Ionicons
              name="star"
              size={11}
              color="#F4C542"
            />

            <Text style={styles.ratingBadgeText}>
              4.8
            </Text>
          </View>

          {/* STOCK BADGE */}
          <View
            style={[
              styles.stockBadge,
              !hasStock &&
                styles.outOfStockBadge,
            ]}
          >
            <Ionicons
              name={
                hasStock
                  ? 'checkmark-circle-outline'
                  : 'close-circle-outline'
              }
              size={13}
              color="#FFFFFF"
            />

            <Text style={styles.stockBadgeText}>
              {hasStock
                ? `${stock} in stock`
                : 'Out of stock'}
            </Text>
          </View>
        </View>

        {/* PRODUCT NAME */}
        <Text style={styles.productName}>
          {product.name}
        </Text>

        {/* DESCRIPTION */}
        {product.description ? (
          <Text
            style={styles.productDescription}
          >
            {product.description}
          </Text>
        ) : null}

        {/* BRAND */}
        {product.brand ? (
          <Text style={styles.metaText}>
            Brand: {product.brand}
          </Text>
        ) : null}

        {/* CATEGORY */}
        <Text style={styles.metaText}>
          Category:{' '}
          {product.category ||
            'General'}
        </Text>

        {/* SKU */}
        <Text style={styles.metaText}>
          SKU: {product.sku || 'N/A'}
        </Text>

        {/* PRICE */}
        {isBusiness ? (
          <View style={styles.priceRow}>
            <Text
              style={
                styles.originalPriceStrike
              }
            >
              R{' '}
              {product.price.toLocaleString()}
            </Text>

            <Text style={styles.priceText}>
              R{' '}
              {displayedPrice.toLocaleString()}
            </Text>
          </View>
        ) : (
          <Text style={styles.priceText}>
            R{' '}
            {product.price.toLocaleString()}
          </Text>
        )}

        {/* BUSINESS QUANTITY */}
        {isBusiness && hasStock ? (
          <View style={styles.quantitySection}>
            <Text
              style={styles.quantityLabel}
            >
              Quantity
            </Text>

            <View
              style={styles.quantityControls}
            >
              <Pressable
                style={styles.quantityButton}
                onPress={decreaseQuantity}
                disabled={quantity <= 1}
              >
                <Text
                  style={[
                    styles.quantityButtonText,
                    quantity <= 1 &&
                      styles.quantityButtonDisabled,
                  ]}
                >
                  −
                </Text>
              </Pressable>

              <Text
                style={styles.quantityValue}
              >
                {quantity}
              </Text>

              <Pressable
                style={styles.quantityButton}
                onPress={increaseQuantity}
                disabled={
                  quantity >= stock
                }
              >
                <Text
                  style={[
                    styles.quantityButtonText,
                    quantity >= stock &&
                      styles.quantityButtonDisabled,
                  ]}
                >
                  +
                </Text>
              </Pressable>
            </View>

            <Text
              style={styles.availableText}
            >
              {stock} unit
              {stock === 1 ? '' : 's'}{' '}
              available
            </Text>

            <Text
              style={styles.totalLabel}
            >
              Total
            </Text>

            <Text
              style={styles.totalPrice}
            >
              R{' '}
              {totalPrice.toLocaleString()}
            </Text>
          </View>
        ) : null}

        {/* ADD TO CART */}
        <Pressable
          style={[
            styles.addButton,
            !hasStock &&
              styles.addButtonDisabled,
          ]}
          disabled={!hasStock}
          onPress={handleAddToCart}
        >
          <Ionicons
            name={
              hasStock
                ? 'cart-outline'
                : 'close-circle-outline'
            }
            size={18}
            color="#FFFFFF"
          />

          <Text style={styles.addButtonText}>
            {!hasStock
              ? 'Out of stock'
              : isBusiness
                ? 'Add bulk order'
                : 'Add to Cart'}
          </Text>
        </Pressable>

        {/* MORE PRODUCTS */}
        {recommendedProducts.length >
        0 ? (
          <>
            <Text
              style={styles.sectionTitle}
            >
              More accessories
            </Text>

            <View
              style={styles.recommendGrid}
            >
              {recommendedProducts.map(
                (item) => {
                  const itemSaved =
                    isFavourite(item.id);

                  const itemImage =
                    item.image_url
                      ? {
                          uri: item.image_url,
                        }
                      : require('../../assets/images/demoAccesories.jpg');

                  const itemStock =
                    Math.max(
                      0,
                      Number(
                        item.quantity ?? 0,
                      ),
                    );

                  return (
                    <Pressable
                      key={item.id}
                      style={
                        styles.recommendCard
                      }
                      onPress={() =>
                        navigation.push(
                          ROUTES.PRODUCT_DETAILS,
                          {
                            productId:
                              item.id,
                          },
                        )
                      }
                    >
                      <View
                        style={
                          styles.recommendImageWrap
                        }
                      >
                        <Image
                          source={itemImage}
                          style={
                            styles.recommendImage
                          }
                          contentFit="cover"
                        />

                        <Pressable
                          style={[
                            styles.cardHeartBtn,
                            itemSaved &&
                              styles.heartBtnActive,
                          ]}
                          onPress={(e) => {
                            e.stopPropagation();
                            toggle(item.id);
                          }}
                          hitSlop={8}
                        >
                          <Ionicons
                            name={
                              itemSaved
                                ? 'heart'
                                : 'heart-outline'
                            }
                            size={14}
                            color={
                              itemSaved
                                ? '#FFFFFF'
                                : '#b89aff'
                            }
                          />
                        </Pressable>

                        {itemStock <= 0 ? (
                          <View
                            style={
                              styles.cardStockOverlay
                            }
                          >
                            <Text
                              style={
                                styles.cardStockOverlayText
                              }
                            >
                              Out of stock
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <View
                        style={
                          styles.recommendBody
                        }
                      >
                        <Text
                          numberOfLines={2}
                          style={
                            styles.recommendName
                          }
                        >
                          {item.name}
                        </Text>

                        <Text
                          style={
                            styles.recommendPrice
                          }
                        >
                          R{' '}
                          {(
                            isBusiness
                              ? getBusinessPrice(
                                  item.price,
                                )
                              : item.price
                          ).toLocaleString()}
                        </Text>
                      </View>
                    </Pressable>
                  );
                },
              )}
            </View>
          </>
        ) : null}

        {/* RECOMMENDED PACKAGE */}
        {recommendedPackage ? (
          <>
            <Text
              style={styles.sectionTitle}
            >
              Recommended package
            </Text>

            <Pressable
              style={styles.packageCard}
              onPress={() =>
                navigation.navigate(
                  ROUTES.PACKAGE_DETAILS,
                  {
                    packageId:
                      recommendedPackage.id,
                  },
                )
              }
            >
              <Image
                source={
                  recommendedPackage.imageSource
                }
                style={styles.packageImage}
                contentFit="cover"
              />

              <View
                style={styles.packageBody}
              >
                <Text
                  style={styles.packageTitle}
                >
                  {
                    recommendedPackage.title
                  }
                </Text>

                <Text
                  style={styles.packagePrice}
                >
                  {
                    recommendedPackage.price
                  }
                </Text>
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
    paddingHorizontal: 24,
  },

  loadingText: {
    color: '#1a3f3f',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
  },

  errorText: {
    color: '#1a3f3f',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
  },

  backToMarketplaceButton: {
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: '#24b8b8',
  },

  backToMarketplaceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal:
      appTheme.spacing.md,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor:
      'rgba(36,184,184,0.18)',
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor:
      'rgba(36,184,184,0.1)',
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
    backgroundColor:
      'rgba(0,0,0,0.55)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  ratingBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  stockBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 5,
    backgroundColor:
      'rgba(26,63,63,0.88)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  outOfStockBadge: {
    backgroundColor:
      'rgba(150,60,60,0.9)',
  },

  stockBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
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
    textDecorationLine:
      'line-through',
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
    marginBottom: 6,
  },

  quantityButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor:
      'rgba(36,184,184,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  quantityButtonText: {
    color: '#1a3f3f',
    fontSize: 24,
    fontWeight: '700',
  },

  quantityButtonDisabled: {
    color: '#c7d2d2',
  },

  quantityValue: {
    minWidth: 50,
    textAlign: 'center',
    color: '#111111',
    fontSize: 18,
    fontWeight: '700',
  },

  availableText: {
    color: '#6b8181',
    fontSize: 12,
    marginBottom: 10,
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
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    columnGap: 7,
  },

  addButtonDisabled: {
    backgroundColor: '#b7c3c3',
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
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
    borderColor:
      'rgba(36,184,184,0.18)',
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
    backgroundColor:
      'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardStockOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor:
      'rgba(0,0,0,0.65)',
    paddingVertical: 5,
    alignItems: 'center',
  },

  cardStockOverlayText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
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
    borderColor:
      'rgba(36,184,184,0.18)',
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

