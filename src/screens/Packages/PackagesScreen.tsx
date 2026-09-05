import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import {
  fetchMarketplaceProducts,
  type MarketplaceProduct,
} from '../../services/marketplace/marketplace';
import { PACKAGES } from '../../data/packages';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { FLOATING_NAV_CONTENT_INSET } from '../../components/common/FloatingBottomNav';
import { useCartStore } from '../../store/cartStore';
import { useFavouritesStore } from '../../store/favouritesStore';
import { appTheme } from '../../theme';
import { getBusinessPrice } from '../../utils/pricing';

const FILTERS = [
  'All',
  'Accessories',
  'Franchises',
  'Lights',
  'Wires',
  'Inverters',
  'Batteries',
  'Solar panels',
];

export function PackagesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const insets = useSafeAreaInsets();

  const isBusiness = useAuthStore(
    (s) => s.user?.accountType === 'business',
  );

  const toggle = useFavouritesStore((s) => s.toggle);
  const favourites = useFavouritesStore((s) => s.favourites);

  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  const cartItemsHas = (id: string) => cartItems.some((entry) => entry.id === id);

  const cartCount = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.quantity, 0),
  );

  // ---------------------------------------------------------
  // SUPABASE MARKETPLACE DATA
  // ---------------------------------------------------------

  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      setProductsError(null);

      const marketplaceProducts = await fetchMarketplaceProducts();

      setProducts(marketplaceProducts);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load marketplace products.';

      setProductsError(message);
    } finally {
      setLoadingProducts(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  // ---------------------------------------------------------
  // SEARCH / FILTER
  // ---------------------------------------------------------

  const [searchText, setSearchText] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  const searchTranslate = useRef(new Animated.Value(0)).current;

  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isFavourite = (id: string) => favourites.includes(id);

  const filteredProducts = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query);

      const matchesFilter =
        activeFilter === 'All' ||
        activeFilter === 'Accessories' ||
        activeFilter === 'Franchises' ||
        product.category.toLowerCase() === activeFilter.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, products, searchText]);

  const franchiseResults = useMemo(() => {
    if (!searchText.trim()) {
      return PACKAGES;
    }

    const query = searchText.trim().toLowerCase();

    return PACKAGES.filter(
      (pkg) =>
        pkg.title.toLowerCase().includes(query) ||
        pkg.description.toLowerCase().includes(query) ||
        pkg.bullets.some((item) =>
          item.toLowerCase().includes(query),
        ),
    );
  }, [searchText]);

  // ---------------------------------------------------------
  // SEARCH ANIMATION
  // ---------------------------------------------------------

  const handleScroll = () => {
    Animated.timing(searchTranslate, {
      toValue: -12,
      duration: 180,
      useNativeDriver: true,
    }).start();

    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
    }

    hideTimeout.current = setTimeout(() => {
      Animated.timing(searchTranslate, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }, 220);
  };

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

  return (
    <View style={styles.root}>
      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
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

        <Text style={styles.headerTitle}>Marketplace</Text>

        <View style={styles.headerActions}>
          {/* SEARCH */}
          <Pressable
            style={styles.iconButton}
            onPress={() => {
              setSearchVisible((prev) => !prev);
              setFilterVisible(false);
            }}
            hitSlop={8}
          >
            <Ionicons
              name="search-outline"
              size={20}
              color="#0f6464"
            />
          </Pressable>

          {/* FILTER */}
          <Pressable
            style={styles.iconButton}
            onPress={() => {
              setFilterVisible((prev) => !prev);
              setSearchVisible(false);
            }}
            hitSlop={8}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color="#0f6464"
            />
          </Pressable>

          {/* CART */}
          <Pressable
            style={styles.cartButton}
            onPress={() =>
              navigation.navigate(ROUTES.CART)
            }
            hitSlop={8}
          >
            <Ionicons
              name="cart-outline"
              size={20}
              color="#0f6464"
            />

            {cartCount > 0 ? (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cartCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      {/* SEARCH / FILTER PANEL */}
      <Animated.View
        style={[
          styles.toolPanel,
          {
            transform: [
              {
                translateY: searchTranslate,
              },
            ],
          },
        ]}
      >
        {searchVisible ? (
          <View style={styles.searchWrap}>
            <Ionicons
              name="search-outline"
              size={18}
              color="#6b7d7d"
              style={styles.searchIcon}
            />

            <TextInput
              value={searchText}
              placeholder="Search accessories or franchises"
              placeholderTextColor="#7d8e8e"
              onChangeText={setSearchText}
              style={styles.searchInput}
              autoFocus
            />
          </View>
        ) : null}

        {filterVisible ? (
          <View style={styles.filterRow}>
            {FILTERS.map((filter) => (
              <Pressable
                key={filter}
                style={[
                  styles.filterChip,
                  activeFilter === filter &&
                    styles.filterChipActive,
                ]}
                onPress={() => {
                  setActiveFilter(filter);
                  setFilterVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    activeFilter === filter &&
                      styles.filterChipTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </Animated.View>

      {/* MAIN CONTENT */}
      <ScrollView
        contentContainerStyle={[
          styles.list,
          {
            paddingBottom: insets.bottom + FLOATING_NAV_CONTENT_INSET,
          },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={80}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#24b8b8"
          />
        }
      >
        {/* ================================================= */}
        {/* ACCESSORIES                                      */}
        {/* ================================================= */}

        <Text style={styles.sectionLabel}>
          Accessories
        </Text>

        {loadingProducts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color="#24b8b8"
            />

            <Text style={styles.loadingText}>
              Loading marketplace products...
            </Text>
          </View>
        ) : productsError ? (
          <View style={styles.errorContainer}>
            <Ionicons
              name="cloud-offline-outline"
              size={42}
              color="#E63946"
            />

            <Text style={styles.errorTitle}>
              Unable to load products
            </Text>

            <Text style={styles.errorText}>
              {productsError}
            </Text>

            <Pressable
              style={styles.retryButton}
              onPress={loadProducts}
            >
              <Ionicons
                name="refresh-outline"
                size={16}
                color="#FFFFFF"
              />

              <Text style={styles.retryButtonText}>
                Retry
              </Text>
            </Pressable>
          </View>
        ) : filteredProducts.length ? (
          <View style={styles.accessoriesRow}>
            {filteredProducts.map((item) => {
              const saved = isFavourite(item.id);

              const rating =
                (
                  item as MarketplaceProduct & {
                    rating?: number;
                  }
                ).rating ?? 4.8;

              const displayPrice = isBusiness
                ? getBusinessPrice(item.price)
                : item.price;

              return (
                <Pressable
                  key={item.id}
                  style={styles.accessoryCard}
                  onPress={() =>
                    navigation.navigate(
                      ROUTES.PRODUCT_DETAILS,
                      {
                        productId: item.id,
                      },
                    )
                  }
                >
                  {/* PRODUCT IMAGE */}
                  <View
                    style={styles.accessoryImageWrap}
                  >
                    <Image
                      source={
                        item.imageUrl
                          ? { uri: item.imageUrl }
                          : require('../../assets/images/demoAccesories.jpg')
                      }
                      style={styles.accessoryImage}
                      contentFit="cover"
                    />

                    {/* FAVOURITE */}
                    <Pressable
                      style={[
                        styles.heartBtn,
                        saved &&
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

                    {/* RATING */}
                    <View
                      style={styles.ratingBadge}
                    >
                      <Ionicons
                        name="star"
                        size={11}
                        color="#F4C542"
                      />

                      <Text
                        style={
                          styles.ratingBadgeText
                        }
                      >
                        {rating.toFixed(1)}
                      </Text>
                    </View>
                  </View>

                  {/* PRODUCT CONTENT */}
                  <View
                    style={styles.accessoryContent}
                  >
                    <Text
                      style={styles.productName}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>

                    {item.description ? (
                      <Text
                        style={
                          styles.productDescription
                        }
                        numberOfLines={3}
                      >
                        {item.description}
                      </Text>
                    ) : null}

                    {item.brand ? (
                      <Text
                        style={styles.brandText}
                        numberOfLines={1}
                      >
                        {item.brand}
                      </Text>
                    ) : null}

                    <Text
                      style={styles.categoryText}
                    >
                      {item.category || 'General'}
                    </Text>

                    {/* FOOTER */}
                    <View
                      style={styles.cardFooter}
                    >
                      {isBusiness ? (
                        <View
                          style={styles.priceRow}
                        >
                          <Text
                            style={
                              styles.originalPriceStrike
                            }
                          >
                            R{' '}
                            {item.price.toLocaleString()}
                          </Text>

                          <Text
                            style={
                              styles.priceText
                            }
                          >
                            R{' '}
                            {displayPrice.toLocaleString()}
                          </Text>
                        </View>
                      ) : (
                        <Text
                          style={styles.priceText}
                        >
                          R{' '}
                          {displayPrice.toLocaleString()}
                        </Text>
                      )}

                      <Pressable
                        style={[styles.addButton, cartItemsHas(item.id) && styles.addButtonAdded]}
                        onPress={(e) => {
                          e.stopPropagation();

                          addItem({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            type: 'accessory',
                            imageUrl: item.imageUrl,
                          });
                        }}
                      >
                        <Text
                          style={
                            styles.addButtonText
                          }
                        >
                          {cartItemsHas(item.id) ? 'Added ✓' : 'Add'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyText}>
            No accessories match your search.
          </Text>
        )}

        {/* ================================================= */}
        {/* FRANCHISES                                       */}
        {/* ================================================= */}

        <Text
          style={[
            styles.sectionLabel,
            styles.franchiseLabel,
          ]}
        >
          Franchises
        </Text>

        {franchiseResults.length ? (
          franchiseResults.map((item) => {
            const saved = isFavourite(item.id);
            const isTeal =
              item.buttonVariant === 'teal';

            return (
              <Pressable
                key={item.id}
                style={styles.franchiseCard}
                onPress={() =>
                  navigation.navigate(
                    ROUTES.PACKAGE_DETAILS,
                    {
                      packageId: item.id,
                    },
                  )
                }
              >
                <View
                  style={styles.franchiseImageWrap}
                >
                  <Image
                    source={item.imageSource}
                    style={styles.franchiseImage}
                    contentFit="cover"
                  />

                  <Pressable
                    style={[
                      styles.heartBtn,
                      saved &&
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

                <View
                  style={styles.franchiseContent}
                >
                  <Text
                    style={styles.franchiseTitle}
                  >
                    {item.title}
                  </Text>

                  <View style={styles.bulletList}>
                    {item.bullets.map((bullet) => (
                      <Text
                        key={bullet}
                        style={styles.bulletText}
                      >
                        - {bullet}
                      </Text>
                    ))}
                  </View>

                  <View
                    style={styles.ratingRow}
                  >
                    <Ionicons
                      name="star"
                      size={12}
                      color="#F4C542"
                    />

                    <Text
                      style={styles.ratingText}
                    >
                      {item.rating}
                    </Text>
                  </View>

                  <Text style={styles.fromText}>
                    From
                  </Text>

                  <Text
                    style={styles.priceText}
                  >
                    {item.price}
                  </Text>

                  <Pressable
                    style={[
                      styles.btn,
                      isTeal
                        ? styles.tealBtn
                        : styles.purpleBtn,
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();

                      navigation.navigate(
                        ROUTES.APPLICATION_FORM,
                        {
                          packageId: item.id,
                        },
                      );
                    }}
                  >
                    <Text style={styles.btnText}>
                      {item.buttonLabel}
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          })
        ) : (
          <Text style={styles.emptyText}>
            No franchise matches your search.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

// ===========================================================
// STYLES
// ===========================================================

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: appTheme.spacing.md,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(36,184,184,0.18)',
    backgroundColor: '#FFFFFF',
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
    letterSpacing: 0.5,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },

  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(36,184,184,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cartButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(36,184,184,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  cartBadge: {
    position: 'absolute',
    right: -5,
    top: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E63946',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  toolPanel: {
    paddingHorizontal: appTheme.spacing.md,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7F7',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    color: '#1a3f3f',
    fontSize: 14,
    paddingVertical: 0,
  },

  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },

  filterChip: {
    backgroundColor: '#F5F7F7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.18)',
  },

  filterChipActive: {
    backgroundColor: '#24b8b8',
    borderColor: '#24b8b8',
  },

  filterChipText: {
    color: '#1a3f3f',
    fontSize: 11,
    fontWeight: '700',
  },

  filterChipTextActive: {
    color: '#FFFFFF',
  },

  list: {
    paddingHorizontal: appTheme.spacing.md,
    paddingTop: 12,
    rowGap: 18,
  },

  sectionLabel: {
    color: '#1a3f3f',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    marginBottom: 4,
  },

  franchiseLabel: {
    marginTop: 8,
  },

  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },

  loadingText: {
    marginTop: 12,
    color: '#5a7474',
    fontSize: 14,
    fontWeight: '600',
  },

  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    borderRadius: 20,
    backgroundColor: '#FFF7F7',
    borderWidth: 1,
    borderColor: 'rgba(230,57,70,0.15)',
  },

  errorTitle: {
    marginTop: 12,
    color: '#1a3f3f',
    fontSize: 17,
    fontWeight: '800',
  },

  errorText: {
    marginTop: 8,
    color: '#6b7d7d',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },

  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 6,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#24b8b8',
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  accessoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },

  accessoryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.18)',
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
    color: '#111111',
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '800',
  },

  productDescription: {
    color: '#5a7474',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },

  brandText: {
    color: '#6b7d7d',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    marginTop: 6,
  },

  categoryText: {
    color: '#24b8b8',
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

  priceText: {
    color: '#111111',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
  },

  priceRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    rowGap: 2,
  },

  originalPriceStrike: {
    color: '#9fb1b1',
    fontSize: 12,
    textDecorationLine: 'line-through',
  },

  addButton: {
    borderRadius: 999,
    backgroundColor: '#24b8b8',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  addButtonAdded: {
    backgroundColor: '#178a6a',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.18)',
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
    color: '#111111',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },

  bulletList: {
    marginTop: appTheme.spacing.sm,
    rowGap: 4,
  },

  bulletText: {
    color: '#111111',
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
    color: '#111111',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },

  fromText: {
    marginTop: 2,
    color: '#C7C7C7',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400',
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
    backgroundColor: '#24b8b8',
  },

  purpleBtn: {
    backgroundColor: '#b89aff',
  },

  btnText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },

  emptyText: {
    color: '#5a7474',
    fontSize: 13,
    lineHeight: 18,
  },
});