import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  fetchPreOwnedProducts,
  type MarketplaceProduct,
} from '../../services/marketplace/marketplace';
import { fetchComboDeals, type ComboDeal } from '../../services/marketing/comboDeals';
import {
  fetchMarketingPackages,
  type MarketingPackage,
} from '../../services/marketing/packages';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { FLOATING_NAV_CONTENT_INSET } from '../../components/common/FloatingBottomNav';
import { useCartStore } from '../../store/cartStore';
import { useFavouritesStore } from '../../store/favouritesStore';
import { appTheme } from '../../theme';
import type { AppTheme } from '../../theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { getBusinessPrice } from '../../utils/pricing';

const FILTERS = [
  'All',
  'Accessories',
  'Franchises',
  'Pre-owned products',
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
const [preOwnedProducts, setPreOwnedProducts] = useState<MarketplaceProduct[]>([]);
const [comboDeals, setComboDeals] = useState<ComboDeal[]>([]);
const [packages, setPackages] = useState<MarketingPackage[]>([]);

const [loadingProducts, setLoadingProducts] = useState(true);
const [loadingComboDeals, setLoadingComboDeals] = useState(true);
const [loadingPackages, setLoadingPackages] = useState(true);

  const [refreshing, setRefreshing] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      setProductsError(null);

      const [marketplaceProducts, preOwned] = await Promise.all([
        fetchMarketplaceProducts(),
        fetchPreOwnedProducts(),
      ]);

      setProducts(marketplaceProducts);
      setPreOwnedProducts(preOwned);
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

  const loadComboDeals = async () => {
    try {
      const deals = await fetchComboDeals();
      setComboDeals(deals);
    } catch (error) {
      console.error('COMBO DEALS LOAD ERROR:', error);
      setComboDeals([]);
    } finally {
      setLoadingComboDeals(false);
    }
  };

  const loadPackages = useCallback(async () => {
  try {
    const data = await fetchMarketingPackages();

    setPackages(
      data.filter((item) => item.isActive),
    );
  } catch (error) {
    console.error('PACKAGES LOAD ERROR:', error);
    setPackages([]);
  } finally {
    setLoadingPackages(false);
  }
}, []);

 useEffect(() => {
  void loadProducts();
  void loadComboDeals();
  void loadPackages();
}, [loadPackages]);

useFocusEffect(
  useCallback(() => {
    void loadPackages();
  }, [loadPackages]),
);

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
  const [selectedCategory, setSelectedCategory] = useState<
    'accessories' | 'combo' | 'preowned' | 'packages' | null
  >(null);

  const searchTranslate = useRef(new Animated.Value(0)).current;

  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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
  const query = searchText.trim().toLowerCase();

  if (!query) {
    return packages;
  }

  return packages.filter(
    (pkg) =>
      pkg.title.toLowerCase().includes(query) ||
      pkg.description.toLowerCase().includes(query) ||
      pkg.bullets.some((item) =>
        item.toLowerCase().includes(query),
      ),
  );
}, [packages, searchText]);

  const filteredPreOwnedProducts = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return preOwnedProducts.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query);

      const matchesFilter =
        activeFilter === 'All' ||
        activeFilter === 'Pre-owned products' ||
        product.category.toLowerCase() === activeFilter.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, preOwnedProducts, searchText]);

  const accessoryPreview = filteredProducts.slice(0, 6);
  const comboPreview = comboDeals.slice(0, 3);
  const preOwnedPreview = filteredPreOwnedProducts.slice(0, 6);
  const packagePreview = franchiseResults.slice(0, 3);

  const filteredCategoryProducts = useMemo(() => {
    if (!selectedCategory) {
      return [] as MarketplaceProduct[];
    }

    if (selectedCategory === 'accessories') {
      return filteredProducts;
    }

    if (selectedCategory === 'preowned') {
      return filteredPreOwnedProducts;
    }

    return [] as MarketplaceProduct[];
  }, [filteredPreOwnedProducts, filteredProducts, selectedCategory]);

  const filteredComboDeals = useMemo(() => {
    if (selectedCategory !== 'combo') {
      return [] as ComboDeal[];
    }

    return comboDeals;
  }, [comboDeals, selectedCategory]);

  const filteredPackages = useMemo(() => {
  if (selectedCategory !== 'packages') {
    return [] as MarketingPackage[];
  }

  return franchiseResults;
}, [franchiseResults, selectedCategory]);

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

  const renderSectionFooter = (
    category: 'accessories' | 'combo' | 'preowned' | 'packages',
    hasMore: boolean,
  ) => {
    if (!hasMore) {
      return null;
    }

    return (
      <View style={styles.sectionFooterRow}>
        <Pressable
          style={styles.seeMoreButton}
          onPress={() => setSelectedCategory(category)}
        >
          <Text style={styles.seeMoreText}>See more</Text>
        </Pressable>
      </View>
    );
  };

  const renderCategoryOnlyView = () => {
    if (!selectedCategory) {
      return null;
    }

    const headerTitle =
      selectedCategory === 'accessories'
        ? 'Accessories'
        : selectedCategory === 'combo'
          ? 'Combo deals'
          : selectedCategory === 'preowned'
            ? 'Pre-owned products'
            : 'Packages';

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
            style={styles.backBtn}
            onPress={() => setSelectedCategory(null)}
            hitSlop={8}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={theme.colors.primaryAccent}
            />
          </Pressable>

          <Text style={styles.headerTitle}>{headerTitle}</Text>

          <View style={styles.headerActions}>
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
                color={theme.colors.primaryAccent}
              />
            </Pressable>

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
                color={theme.colors.primaryAccent}
              />
            </Pressable>

            <Pressable
              style={styles.cartButton}
              onPress={() => navigation.navigate(ROUTES.CART)}
              hitSlop={8}
            >
              <Ionicons
                name="cart-outline"
                size={20}
                color={theme.colors.primaryAccent}
              />

              {cartCount > 0 ? (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </View>

        <Animated.View
          style={[
            styles.toolPanel,
            {
              transform: [{ translateY: searchTranslate }],
            },
          ]}
        >
          {searchVisible ? (
            <View style={styles.searchWrap}>
              <Ionicons
                name="search-outline"
                size={18}
                color={theme.colors.textSecondary}
                style={styles.searchIcon}
              />

              <TextInput
                value={searchText}
                placeholder="Search accessories or franchises"
                placeholderTextColor={theme.colors.textSecondary}
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
                    activeFilter === filter && styles.filterChipActive,
                  ]}
                  onPress={() => {
                    setActiveFilter(filter);
                    setFilterVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      activeFilter === filter && styles.filterChipTextActive,
                    ]}
                  >
                    {filter}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </Animated.View>

        <ScrollView
          contentContainerStyle={[
            styles.list,
            {
              paddingBottom: insets.bottom + FLOATING_NAV_CONTENT_INSET,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {selectedCategory === 'accessories' && filteredCategoryProducts.length ? (
            <View style={styles.accessoriesRow}>
              {filteredCategoryProducts.map((item) => {
                const saved = isFavourite(item.id);
                const rating = (item as MarketplaceProduct & { rating?: number }).rating ?? 4.8;
                const displayPrice = isBusiness ? getBusinessPrice(item.price) : item.price;

                return (
                  <Pressable
                    key={item.id}
                    style={styles.accessoryCard}
                    onPress={() => navigation.navigate(ROUTES.PRODUCT_DETAILS, { productId: item.id })}
                  >
                    <View style={styles.accessoryImageWrap}>
                      <Image
                        source={item.imageUrl ? { uri: item.imageUrl } : require('../../assets/images/demoAccesories.jpg')}
                        style={styles.accessoryImage}
                        contentFit="cover"
                      />
                      <Pressable
                        style={[styles.heartBtn, saved && styles.heartBtnActive]}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggle(item.id);
                        }}
                        hitSlop={8}
                      >
                        <Ionicons
                          name={saved ? 'heart' : 'heart-outline'}
                          size={16}
                          color={saved ? '#FFFFFF' : '#b89aff'}
                        />
                      </Pressable>
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={11} color="#F4C542" />
                        <Text style={styles.ratingBadgeText}>{rating.toFixed(1)}</Text>
                      </View>
                    </View>

                    <View style={styles.accessoryContent}>
                      <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                      {item.description ? (
                        <Text style={styles.productDescription} numberOfLines={3}>
                          {item.description}
                        </Text>
                      ) : null}
                      {item.brand ? (
                        <Text style={styles.brandText} numberOfLines={1}>{item.brand}</Text>
                      ) : null}
                      <Text style={styles.categoryText}>{item.category || 'General'}</Text>
                      <View style={styles.cardFooter}>
                        {isBusiness ? (
                          <View style={styles.priceRow}>
                            <Text style={styles.originalPriceStrike}>R {item.price.toLocaleString()}</Text>
                            <Text style={styles.priceText}>R {displayPrice.toLocaleString()}</Text>
                          </View>
                        ) : (
                          <Text style={styles.priceText}>R {displayPrice.toLocaleString()}</Text>
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
                          <Text style={styles.addButtonText}>{
                            cartItemsHas(item.id) ? 'Added ✓' : 'Add'
                          }</Text>
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {selectedCategory === 'combo' && filteredComboDeals.length ? (
            <View style={styles.accessoriesRow}>
              {filteredComboDeals.map((deal) => (
                <Pressable
                  key={deal.id}
                  style={styles.accessoryCard}
                  onPress={() => navigation.navigate(ROUTES.COMBO_DETAILS, { comboId: deal.id })}
                >
                  <View style={styles.accessoryImageWrap}>
                    <Image
                      source={deal.imageUrl ? { uri: deal.imageUrl } : require('../../assets/images/demoAccesories.jpg')}
                      style={styles.accessoryImage}
                      contentFit="cover"
                    />
                  </View>
                  <View style={styles.accessoryContent}>
                    <Text style={styles.productName} numberOfLines={2}>{deal.title}</Text>
                    {deal.description ? (
                      <Text style={styles.productDescription} numberOfLines={3}>
                        {deal.description}
                      </Text>
                    ) : null}
                    <View style={styles.cardFooter}>
                      <Text style={styles.priceText}>R {Number(deal.price).toLocaleString()}</Text>
                      <Pressable
                        style={[styles.addButton]}
                        onPress={(e) => {
                          e.stopPropagation();
                          addItem({
                            id: deal.id,
                            name: deal.title,
                            price: deal.price,
                            type: 'accessory',
                            imageUrl: deal.imageUrl,
                          });
                        }}
                      >
                        <Text style={styles.addButtonText}>Add</Text>
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}

          {selectedCategory === 'preowned' && filteredCategoryProducts.length ? (
            <View style={styles.accessoriesRow}>
              {filteredCategoryProducts.map((item) => {
                const saved = isFavourite(item.id);
                const rating = (item as MarketplaceProduct & { rating?: number }).rating ?? 4.8;
                const displayPrice = isBusiness ? getBusinessPrice(item.price) : item.price;

                return (
                  <Pressable
                    key={item.id}
                    style={styles.accessoryCard}
                    onPress={() => navigation.navigate(ROUTES.PRODUCT_DETAILS, { productId: item.id, catalogue: 'preowned' })}
                  >
                    <View style={styles.accessoryImageWrap}>
                      <Image
                        source={item.imageUrl ? { uri: item.imageUrl } : require('../../assets/images/demoAccesories.jpg')}
                        style={styles.accessoryImage}
                        contentFit="cover"
                      />
                      <Pressable
                        style={[styles.heartBtn, saved && styles.heartBtnActive]}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggle(item.id);
                        }}
                        hitSlop={8}
                      >
                        <Ionicons
                          name={saved ? 'heart' : 'heart-outline'}
                          size={16}
                          color={saved ? '#FFFFFF' : '#b89aff'}
                        />
                      </Pressable>
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={11} color="#F4C542" />
                        <Text style={styles.ratingBadgeText}>{rating.toFixed(1)}</Text>
                      </View>
                    </View>

                    <View style={styles.accessoryContent}>
                      <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                      {item.description ? (
                        <Text style={styles.productDescription} numberOfLines={3}>
                          {item.description}
                        </Text>
                      ) : null}
                      {item.brand ? (
                        <Text style={styles.brandText} numberOfLines={1}>{item.brand}</Text>
                      ) : null}
                      <Text style={styles.categoryText}>{item.category || 'General'}</Text>
                      <View style={styles.cardFooter}>
                        {isBusiness ? (
                          <View style={styles.priceRow}>
                            <Text style={styles.originalPriceStrike}>R {item.price.toLocaleString()}</Text>
                            <Text style={styles.priceText}>R {displayPrice.toLocaleString()}</Text>
                          </View>
                        ) : (
                          <Text style={styles.priceText}>R {displayPrice.toLocaleString()}</Text>
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
                          <Text style={styles.addButtonText}>
                            {cartItemsHas(item.id) ? 'Added ✓' : 'Add'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {selectedCategory === 'packages' && filteredPackages.length ? (
            <View style={styles.verticalCategoryList}>
              {filteredPackages.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.packageCategoryCard}
                  onPress={() => navigation.navigate(ROUTES.PACKAGE_DETAILS, { packageId: item.id })}
                >
                  <View style={styles.accessoryImageWrap}>
                    <Image
  source={
    item.imageUrl
      ? { uri: item.imageUrl }
      : require('../../assets/images/demoAccesories.jpg')
  }
  style={styles.accessoryImage}
  contentFit="cover"
/>
                  </View>
                  <View style={styles.accessoryContent}>
                    <Text style={styles.productName} numberOfLines={2}>{item.title}</Text>
                    {item.bullets.length ? (
                      <View style={styles.bulletList}>
                        {item.bullets.slice(0, 2).map((bullet) => (
                          <Text key={bullet} style={styles.bulletText}>- {bullet}</Text>
                        ))}
                      </View>
                    ) : null}
                    <View style={styles.cardFooter}>
                      <Text style={styles.fromText}>From</Text>
                      <Text style={styles.priceText}>{item.price}</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </View>
    );
  };

  if (selectedCategory) {
    return renderCategoryOnlyView();
  }

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
            color={theme.colors.primaryAccent}
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
              color={theme.colors.primaryAccent}
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
              color={theme.colors.primaryAccent}
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
              color={theme.colors.primaryAccent}
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
              color={theme.colors.textSecondary}
              style={styles.searchIcon}
            />

            <TextInput
              value={searchText}
              placeholder="Search accessories or franchises"
              placeholderTextColor={theme.colors.textSecondary}
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
            tintColor={theme.colors.primaryAccent}
          />
        }
      >
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>Accessories</Text>
        </View>

        {loadingProducts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primaryAccent} />
            <Text style={styles.loadingText}>Loading marketplace products...</Text>
          </View>
        ) : productsError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="cloud-offline-outline" size={42} color="#E63946" />
            <Text style={styles.errorTitle}>Unable to load products</Text>
            <Text style={styles.errorText}>{productsError}</Text>
            <Pressable style={styles.retryButton} onPress={loadProducts}>
              <Ionicons name="refresh-outline" size={16} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : accessoryPreview.length ? (
          <View style={styles.accessoriesRow}>
            {accessoryPreview.map((item) => {
              const saved = isFavourite(item.id);
              const rating = (item as MarketplaceProduct & { rating?: number }).rating ?? 4.8;
              const displayPrice = isBusiness ? getBusinessPrice(item.price) : item.price;

              return (
                <Pressable key={item.id} style={styles.accessoryCard} onPress={() => navigation.navigate(ROUTES.PRODUCT_DETAILS, { productId: item.id })}>
                  <View style={styles.accessoryImageWrap}>
                    <Image source={item.imageUrl ? { uri: item.imageUrl } : require('../../assets/images/demoAccesories.jpg')} style={styles.accessoryImage} contentFit="cover" />
                    <Pressable style={[styles.heartBtn, saved && styles.heartBtnActive]} onPress={(e) => { e.stopPropagation(); toggle(item.id); }} hitSlop={8}>
                      <Ionicons name={saved ? 'heart' : 'heart-outline'} size={16} color={saved ? '#FFFFFF' : '#b89aff'} />
                    </Pressable>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={11} color="#F4C542" />
                      <Text style={styles.ratingBadgeText}>{rating.toFixed(1)}</Text>
                    </View>
                  </View>
                  <View style={styles.accessoryContent}>
                    <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                    {item.description ? <Text style={styles.productDescription} numberOfLines={3}>{item.description}</Text> : null}
                    {item.brand ? <Text style={styles.brandText} numberOfLines={1}>{item.brand}</Text> : null}
                    <Text style={styles.categoryText}>{item.category || 'General'}</Text>
                    <View style={styles.cardFooter}>
                      {isBusiness ? (
                        <View style={styles.priceRow}>
                          <Text style={styles.originalPriceStrike}>R {item.price.toLocaleString()}</Text>
                          <Text style={styles.priceText}>R {displayPrice.toLocaleString()}</Text>
                        </View>
                      ) : (
                        <Text style={styles.priceText}>R {displayPrice.toLocaleString()}</Text>
                      )}
                      <Pressable style={[styles.addButton, cartItemsHas(item.id) && styles.addButtonAdded]} onPress={(e) => { e.stopPropagation(); addItem({ id: item.id, name: item.name, price: item.price, type: 'accessory', imageUrl: item.imageUrl }); }}>
                        <Text style={styles.addButtonText}>{cartItemsHas(item.id) ? 'Added ✓' : 'Add'}</Text>
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyText}>No accessories match your search.</Text>
        )}

        {renderSectionFooter('accessories', filteredProducts.length > 0)}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>Combo deals</Text>
        </View>

        {loadingComboDeals ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primaryAccent} />
            <Text style={styles.loadingText}>Loading combo deals...</Text>
          </View>
        ) : comboPreview.length ? (
          <View style={styles.accessoriesRow}>
            {comboPreview.map((deal) => (
              <Pressable key={deal.id} style={styles.accessoryCard} onPress={() => navigation.navigate(ROUTES.COMBO_DETAILS, { comboId: deal.id })}>
                <View style={styles.accessoryImageWrap}>
                  <Image source={deal.imageUrl ? { uri: deal.imageUrl } : require('../../assets/images/demoAccesories.jpg')} style={styles.accessoryImage} contentFit="cover" />
                </View>
                <View style={styles.accessoryContent}>
                  <Text style={styles.productName} numberOfLines={2}>{deal.title}</Text>
                  {deal.description ? <Text style={styles.productDescription} numberOfLines={3}>{deal.description}</Text> : null}
                  <View style={styles.cardFooter}>
                    <Text style={styles.priceText}>R {Number(deal.price).toLocaleString()}</Text>
                    <Pressable style={[styles.addButton]} onPress={(e) => { e.stopPropagation(); addItem({ id: deal.id, name: deal.title, price: deal.price, type: 'accessory', imageUrl: deal.imageUrl }); }}>
                      <Text style={styles.addButtonText}>Add</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No combo deals available.</Text>
        )}

        {renderSectionFooter('combo', comboDeals.length > 0)}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>Pre-owned products</Text>
        </View>

        {loadingProducts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primaryAccent} />
            <Text style={styles.loadingText}>Loading pre-owned products...</Text>
          </View>
        ) : preOwnedPreview.length ? (
          <View style={styles.accessoriesRow}>
            {preOwnedPreview.map((item) => {
              const saved = isFavourite(item.id);
              const rating = (item as MarketplaceProduct & { rating?: number }).rating ?? 4.8;
              const displayPrice = isBusiness ? getBusinessPrice(item.price) : item.price;

              return (
                <Pressable key={item.id} style={styles.accessoryCard} onPress={() => navigation.navigate(ROUTES.PRODUCT_DETAILS, { productId: item.id, catalogue: 'preowned' })}>
                  <View style={styles.accessoryImageWrap}>
                    <Image source={item.imageUrl ? { uri: item.imageUrl } : require('../../assets/images/demoAccesories.jpg')} style={styles.accessoryImage} contentFit="cover" />
                    <Pressable style={[styles.heartBtn, saved && styles.heartBtnActive]} onPress={(e) => { e.stopPropagation(); toggle(item.id); }} hitSlop={8}>
                      <Ionicons name={saved ? 'heart' : 'heart-outline'} size={16} color={saved ? '#FFFFFF' : '#b89aff'} />
                    </Pressable>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={11} color="#F4C542" />
                      <Text style={styles.ratingBadgeText}>{rating.toFixed(1)}</Text>
                    </View>
                  </View>
                  <View style={styles.accessoryContent}>
                    <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                    {item.description ? <Text style={styles.productDescription} numberOfLines={3}>{item.description}</Text> : null}
                    {item.brand ? <Text style={styles.brandText} numberOfLines={1}>{item.brand}</Text> : null}
                    <Text style={styles.categoryText}>{item.category || 'General'}</Text>
                    <View style={styles.cardFooter}>
                      {isBusiness ? (
                        <View style={styles.priceRow}>
                          <Text style={styles.originalPriceStrike}>R {item.price.toLocaleString()}</Text>
                          <Text style={styles.priceText}>R {displayPrice.toLocaleString()}</Text>
                        </View>
                      ) : (
                        <Text style={styles.priceText}>R {displayPrice.toLocaleString()}</Text>
                      )}
                      <Pressable style={[styles.addButton, cartItemsHas(item.id) && styles.addButtonAdded]} onPress={(e) => { e.stopPropagation(); addItem({ id: item.id, name: item.name, price: item.price, type: 'accessory', imageUrl: item.imageUrl }); }}>
                        <Text style={styles.addButtonText}>{cartItemsHas(item.id) ? 'Added ✓' : 'Add'}</Text>
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyText}>No pre-owned products available.</Text>
        )}

        {renderSectionFooter('preowned', true)}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>Packages</Text>
        </View>

        {packagePreview.map((item) => (
          <Pressable key={item.id} style={styles.franchiseCard} onPress={() => navigation.navigate(ROUTES.PACKAGE_DETAILS, { packageId: item.id })}>
            <View style={styles.franchiseImageWrap}>
              <Image
  source={
    item.imageUrl
      ? { uri: item.imageUrl }
      : require('../../assets/images/demoAccesories.jpg')
  }
  style={styles.accessoryImage}
  contentFit="cover"
/>
            </View>
            <View style={styles.franchiseContent}>
              <Text style={styles.franchiseTitle}>{item.title}</Text>
              <View style={styles.bulletList}>
                {item.bullets.map((bullet) => (
                  <Text key={bullet} style={styles.bulletText}>- {bullet}</Text>
                ))}
              </View>
              <Text style={styles.fromText}>From</Text>
              <Text style={styles.priceText}>
  R {Number(item.price).toLocaleString()}
</Text>
            </View>
          </Pressable>
        ))}

        {renderSectionFooter('packages', franchiseResults.length > 0)}
      </ScrollView>
    </View>
  );
}

// ===========================================================
// STYLES
// ===========================================================

const createStyles = (theme: AppTheme) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: appTheme.spacing.md,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
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
    backgroundColor: theme.colors.background,
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    color: theme.colors.textPrimary,
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
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  filterChipActive: {
    backgroundColor: theme.colors.primaryAccent,
    borderColor: theme.colors.primaryAccent,
  },

  filterChipText: {
    color: theme.colors.textPrimary,
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

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  sectionFooterRow: {
    width: '100%',
    alignItems: 'flex-end',
    marginTop: 6,
    marginBottom: 2,
  },

  sectionLabel: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },

  seeMoreButton: {
    paddingVertical: 6,
    paddingHorizontal: 0,
  },

  seeMoreText: {
    color: theme.colors.primaryAccent,
    fontSize: 13,
    fontWeight: '700',
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
    color: theme.colors.textSecondary,
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
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },

  errorText: {
    marginTop: 8,
    color: theme.colors.textSecondary,
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
    backgroundColor: theme.colors.primaryAccent,
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

  verticalCategoryList: {
    rowGap: 12,
  },

  packageCategoryCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '800',
  },

  productDescription: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },

  brandText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
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

  priceText: {
    color: theme.colors.textPrimary,
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
    color: theme.colors.textSecondary,
    fontSize: 12,
    textDecorationLine: 'line-through',
  },

  addButton: {
    borderRadius: 999,
    backgroundColor: theme.colors.primaryAccent,
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

  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});