import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  useNavigation,
} from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ROUTES } from '../../../constants/routes';
import { RootStackParamList } from '../../../navigation/types';
import {
  fetchMarketplaceProducts,
  MarketplaceProduct,
} from '../../../services/marketplace/marketplace';

type NavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

export function MarketingProductsScreen() {
  const navigation =
    useNavigation<NavigationProp>();

  const [products, setProducts] = useState<
    MarketplaceProduct[]
  >([]);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(
    null,
  );

  const loadProducts = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const data =
          await fetchMarketplaceProducts();

        setProducts(data);
      } catch (err) {
        console.error(
          'MarketingProductsScreen:',
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load marketplace products.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) =>
      [
        product.name,
        product.category,
        product.brand,
        product.sku,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [products, search]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleAddProduct = () => {
    navigation.navigate(ROUTES.ADD_PRODUCT);
  };

  const formatPrice = (price: number) => {
    return `R ${price.toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getProductImage = (
    product: MarketplaceProduct,
  ) => {
    return product.imageUrl?.trim() || null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.background}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProducts(true)}
            tintColor={COLORS.teal}
            colors={[COLORS.teal]}
          />
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
            onPress={handleBack}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color={COLORS.text}
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              MARKETING
            </Text>

            <Text style={styles.title}>
              Products
            </Text>

            <Text style={styles.subtitle}>
              Manage products available in the
              Green Off-Grid catalogue.
            </Text>
          </View>
        </View>

        {/* SUMMARY */}

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons
              name="cube-outline"
              size={24}
              color={COLORS.teal}
            />
          </View>

          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>
              Catalogue
            </Text>

            <Text style={styles.summaryValue}>
              {products.length}
            </Text>

            <Text style={styles.summaryDescription}>
              Active marketplace products
            </Text>
          </View>

          <View style={styles.summaryStatus}>
            <View style={styles.summaryStatusDot} />

            <Text style={styles.summaryStatusText}>
              Live
            </Text>
          </View>
        </View>

        {/* SEARCH + ADD */}

        <View style={styles.toolbar}>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={19}
              color={COLORS.muted}
            />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search products"
              placeholderTextColor={COLORS.muted}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
            ]}
            onPress={handleAddProduct}
          >
            <Ionicons
              name="add"
              size={22}
              color={COLORS.white}
            />

            <Text style={styles.addButtonText}>
              Add
            </Text>
          </Pressable>
        </View>

        {/* SECTION HEADER */}

        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>
              Product Catalogue
            </Text>

            <Text style={styles.sectionSubtitle}>
              View and manage your catalogue items.
            </Text>
          </View>

          <Text style={styles.productCount}>
            {filteredProducts.length}
          </Text>
        </View>

        {/* LOADING */}

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator
              size="large"
              color={COLORS.teal}
            />

            <Text style={styles.stateTitle}>
              Loading catalogue
            </Text>

            <Text style={styles.stateDescription}>
              Fetching the latest marketplace
              products.
            </Text>
          </View>
        ) : error ? (
          /* ERROR */

          <View style={styles.stateCard}>
            <View style={styles.errorIcon}>
              <Ionicons
                name="alert-circle-outline"
                size={30}
                color={COLORS.danger}
              />
            </View>

            <Text style={styles.stateTitle}>
              Unable to load products
            </Text>

            <Text style={styles.stateDescription}>
              {error}
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.pressed,
              ]}
              onPress={() => loadProducts()}
            >
              <Ionicons
                name="refresh-outline"
                size={18}
                color={COLORS.white}
              />

              <Text style={styles.retryButtonText}>
                Try Again
              </Text>
            </Pressable>
          </View>
        ) : filteredProducts.length === 0 ? (
          /* EMPTY */

          <View style={styles.stateCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name={
                  search.trim()
                    ? 'search-outline'
                    : 'cube-outline'
                }
                size={30}
                color={COLORS.teal}
              />
            </View>

            <Text style={styles.stateTitle}>
              {search.trim()
                ? 'No matching products'
                : 'No products yet'}
            </Text>

            <Text style={styles.stateDescription}>
              {search.trim()
                ? 'Try searching with a different product name, category, brand or SKU.'
                : 'Your product catalogue is currently empty. Add a product to begin building the catalogue.'}
            </Text>

            {!search.trim() && (
              <Pressable
                style={({ pressed }) => [
                  styles.emptyButton,
                  pressed && styles.pressed,
                ]}
                onPress={handleAddProduct}
              >
                <Ionicons
                  name="add"
                  size={19}
                  color={COLORS.white}
                />

                <Text style={styles.emptyButtonText}>
                  Add Product
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          /* PRODUCT LIST */

          <View style={styles.productList}>
            {filteredProducts.map((product) => {
              const imageUrl =
                getProductImage(product);

              return (
                <Pressable
                  key={product.id}
                  style={({ pressed }) => [
                    styles.productCard,
                    pressed && styles.pressed,
                  ]}
                >
                  {/* PRODUCT IMAGE */}

                  <View style={styles.productImage}>
                    {imageUrl ? (
                      <Image
                        source={{
                          uri: imageUrl,
                        }}
                        style={styles.productImageContent}
                        resizeMode="cover"
                        onError={(event) => {
                          console.warn(
                            `Failed to load image for ${product.name}`,
                            event.nativeEvent
                              .error,
                          );
                        }}
                      />
                    ) : (
                      <View
                        style={
                          styles.productImagePlaceholder
                        }
                      >
                        <Ionicons
                          name="image-outline"
                          size={25}
                          color={COLORS.muted}
                        />

                        <Text
                          style={
                            styles.noImageText
                          }
                        >
                          No image
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* PRODUCT DETAILS */}

                  <View
                    style={styles.productContent}
                  >
                    <Text
                      style={styles.productName}
                      numberOfLines={2}
                    >
                      {product.name}
                    </Text>

                    <Text
                      style={
                        styles.productCategory
                      }
                      numberOfLines={1}
                    >
                      {product.category ||
                        'Uncategorised'}
                    </Text>

                    <Text
                      style={styles.productBrand}
                      numberOfLines={1}
                    >
                      {product.brand ||
                        'Green Off-Grid'}
                    </Text>

                    <Text
                      style={styles.productPrice}
                    >
                      {formatPrice(product.price)}
                    </Text>
                  </View>

                  {/* RIGHT SIDE */}

                  <View style={styles.productRight}>
                    <View style={styles.productStatus}>
                      <View
                        style={
                          styles.productStatusDot
                        }
                      />

                      <Text
                        style={
                          styles.productStatusText
                        }
                      >
                        Active
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={COLORS.muted}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* MANAGEMENT INFORMATION */}

        {!loading && !error && (
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="information-circle-outline"
                size={21}
                color={COLORS.tealDark}
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>
                Catalogue management
              </Text>

              <Text style={styles.infoText}>
                Product images are loaded directly
                from the marketplace database. The
                marketing workspace can later be
                extended to replace these demo images
                with the correct product images stored
                in the marketplace-products bucket.
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.footerText}>
          Green Off-Grid Marketing Workspace
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const COLORS = {
  background: '#F7FAFA',
  surface: '#FFFFFF',
  border: '#E2EBEB',

  teal: '#24B8B8',
  tealDark: '#0D6464',
  tealLight: '#EEF9F9',

  text: '#163838',
  secondaryText: '#557070',
  muted: '#8A9B9B',

  white: '#FFFFFF',
  danger: '#C94A4A',
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 22,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 13,
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: COLORS.tealDark,
    marginBottom: 4,
  },

  title: {
    fontSize: 29,
    fontWeight: '800',
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.secondaryText,
  },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.tealDark,
    marginBottom: 20,
  },

  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.14)',
  },

  summaryContent: {
    flex: 1,
    marginLeft: 13,
  },

  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },

  summaryValue: {
    marginTop: 1,
    fontSize: 25,
    fontWeight: '800',
    color: COLORS.white,
  },

  summaryDescription: {
    marginTop: 1,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },

  summaryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor:
      'rgba(255,255,255,0.11)',
  },

  summaryStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#7BE0AE',
    marginRight: 5,
  },

  summaryStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },

  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  searchContainer: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  searchInput: {
    flex: 1,
    marginLeft: 9,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 0,
  },

  addButton: {
    height: 48,
    paddingHorizontal: 16,
    marginLeft: 9,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.teal,
  },

  addButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  sectionHeaderText: {
    flex: 1,
    marginRight: 12,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.text,
  },

  sectionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.secondaryText,
  },

  productCount: {
    minWidth: 32,
    height: 32,
    borderRadius: 10,
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingTop: 7,
    backgroundColor: COLORS.tealLight,
    color: COLORS.tealDark,
    fontSize: 13,
    fontWeight: '800',
  },

  stateCard: {
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 42,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  stateTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },

  stateDescription: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    color: COLORS.secondaryText,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.tealLight,
  },

  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDEEEE',
  },

  retryButton: {
    marginTop: 19,
    height: 44,
    paddingHorizontal: 17,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.teal,
  },

  retryButtonText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },

  emptyButton: {
    marginTop: 19,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.teal,
  },

  emptyButtonText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },

  productList: {
    gap: 10,
  },

  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    minHeight: 104,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  productImage: {
    width: 72,
    height: 72,
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: COLORS.tealLight,
  },

  productImageContent: {
    width: '100%',
    height: '100%',
  },

  productImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.tealLight,
  },

  noImageText: {
    marginTop: 3,
    fontSize: 8,
    fontWeight: '600',
    color: COLORS.muted,
  },

  productContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 7,
  },

  productName: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
    color: COLORS.text,
  },

  productCategory: {
    marginTop: 3,
    fontSize: 10,
    color: COLORS.secondaryText,
  },

  productBrand: {
    marginTop: 2,
    fontSize: 10,
    color: COLORS.muted,
  },

  productPrice: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.tealDark,
  },

  productRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 65,
  },

  productStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: COLORS.tealLight,
  },

  productStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#27835C',
    marginRight: 5,
  },

  productStatusText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.tealDark,
  },

  infoCard: {
    flexDirection: 'row',
    marginTop: 24,
    padding: 15,
    borderRadius: 16,
    backgroundColor: COLORS.tealLight,
    borderWidth: 1,
    borderColor: '#D8EEEE',
  },

  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },

  infoContent: {
    flex: 1,
    marginLeft: 11,
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.tealDark,
  },

  infoText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.secondaryText,
  },

  footerText: {
    marginTop: 25,
    textAlign: 'center',
    fontSize: 10,
    color: COLORS.muted,
  },

  pressed: {
    opacity: 0.72,
  },
});