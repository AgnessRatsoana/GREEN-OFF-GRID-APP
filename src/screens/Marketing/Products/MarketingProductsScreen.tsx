import { Ionicons } from '@expo/vector-icons';
import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  activateMarketplaceProduct,
  deactivateMarketplaceProduct,
  deleteMarketplaceProduct,
  fetchAllMarketplaceProducts,
  type MarketplaceProduct,
} from '../../../services/marketplace/marketplace';

import { ROUTES } from '../../../constants/routes';
import type { RootStackParamList } from '../../../navigation/types';

type NavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

const COLORS = {
  background: '#F5F7F8',
  card: '#FFFFFF',
  primary: '#0F766E',
  primaryDark: '#115E59',
  text: '#172033',
  muted: '#6B7280',
  border: '#E5E7EB',
  danger: '#DC2626',
  success: '#15803D',
  warning: '#D97706',
  white: '#FFFFFF',
};

export function MarketingProductsScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [products, setProducts] = useState<
    MarketplaceProduct[]
  >([]);

  const [selectedProduct, setSelectedProduct] =
    useState<MarketplaceProduct | null>(null);

  const [detailsVisible, setDetailsVisible] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [searchQuery, setSearchQuery] =
    useState('');

  const [isProcessing, setIsProcessing] =
    useState<string | null>(null);

  /**
   * Load all products from Supabase.
   */
  const loadProducts = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setIsLoading(true);
        }

        setError(null);

        const data =
          await fetchAllMarketplaceProducts();

        setProducts(data);

        /**
         * Keep the currently-open details modal
         * synchronized with the latest database record.
         */
        setSelectedProduct((current) => {
          if (!current) {
            return null;
          }

          return (
            data.find(
              (product) =>
                product.id === current.id,
            ) ?? null
          );
        });
      } catch (loadError) {
        console.error(
          'MARKETING PRODUCTS LOAD ERROR:',
          loadError,
        );

        const message =
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load marketplace products.';

        setError(message);
      } finally {
        if (showLoader) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  /**
   * IMPORTANT:
   *
   * Refresh every time the marketing products
   * screen receives focus.
   *
   * This means:
   *
   * Add Product
   * → Save
   * → Go Back
   * → Product list automatically refreshes.
   */
  useFocusEffect(
    useCallback(() => {
      loadProducts(true);
    }, [loadProducts]),
  );

  /**
   * Pull-to-refresh.
   */
  const handleRefresh = useCallback(
    async () => {
      try {
        setIsRefreshing(true);
        await loadProducts(false);
      } finally {
        setIsRefreshing(false);
      }
    },
    [loadProducts],
  );

  /**
   * Search products.
   */
  const filteredProducts = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.name
          .toLowerCase()
          .includes(query) ||
        product.brand
          .toLowerCase()
          .includes(query) ||
        product.category
          .toLowerCase()
          .includes(query) ||
        product.sku
          .toLowerCase()
          .includes(query)
      );
    });
  }, [products, searchQuery]);

  /**
   * Open product details.
   */
  const openProductDetails = (
    product: MarketplaceProduct,
  ) => {
    setSelectedProduct(product);
    setDetailsVisible(true);
  };

  /**
   * Close product details.
   */
  const closeProductDetails = () => {
    setDetailsVisible(false);
    setSelectedProduct(null);
  };

  /**
   * Add product.
   */
  const handleAddProduct = () => {
    navigation.navigate(ROUTES.ADD_PRODUCT);
  };

  /**
   * Edit product.
   */
  const handleEditProduct = (
    product: MarketplaceProduct,
  ) => {
    closeProductDetails();

    navigation.navigate(
      ROUTES.ADD_PRODUCT,
      {
        productId: product.id,
      },
    );
  };

  /**
   * Activate / deactivate product.
   */
  const handleToggleStatus = async (
    product: MarketplaceProduct,
  ) => {
    try {
      setIsProcessing(product.id);
      setError(null);

      const updatedProduct =
        product.isActive
          ? await deactivateMarketplaceProduct(
              product.id,
            )
          : await activateMarketplaceProduct(
              product.id,
            );

      /**
       * Update the product locally immediately.
       */
      setProducts((currentProducts) =>
        currentProducts.map((currentProduct) =>
          currentProduct.id ===
          updatedProduct.id
            ? updatedProduct
            : currentProduct,
        ),
      );

      setSelectedProduct((current) =>
        current?.id === updatedProduct.id
          ? updatedProduct
          : current,
      );
    } catch (statusError) {
      console.error(
        'TOGGLE PRODUCT STATUS ERROR:',
        statusError,
      );

      const message =
        statusError instanceof Error
          ? statusError.message
          : 'Unable to update product status.';

      setError(message);

      Alert.alert(
        'Unable to Update Product',
        message,
      );
    } finally {
      setIsProcessing(null);
    }
  };

  /**
   * Confirm deletion.
   */
  const confirmDeleteProduct = (
    product: MarketplaceProduct,
  ) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to permanently delete "${product.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            handleDeleteProduct(product),
        },
      ],
    );
  };

  /**
   * Delete product.
   */
  const handleDeleteProduct = async (
    product: MarketplaceProduct,
  ) => {
    try {
      setIsProcessing(product.id);
      setError(null);

      await deleteMarketplaceProduct(
        product.id,
      );

      /**
       * Remove immediately from local list.
       */
      setProducts((currentProducts) =>
        currentProducts.filter(
          (currentProduct) =>
            currentProduct.id !== product.id,
        ),
      );

      if (
        selectedProduct?.id === product.id
      ) {
        closeProductDetails();
      }

      Alert.alert(
        'Product Deleted',
        `"${product.name}" has been removed from the marketplace.`,
      );
    } catch (deleteError) {
      console.error(
        'DELETE PRODUCT ERROR:',
        deleteError,
      );

      const message =
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete the product.';

      setError(message);

      Alert.alert(
        'Unable to Delete Product',
        message,
      );
    } finally {
      setIsProcessing(null);
    }
  };

  /**
   * Product card.
   *
   * The whole card is a Pressable so that
   * clicking anywhere on the main card opens
   * the product details.
   *
   * The action buttons stop their own action
   * from being interpreted as a card click.
   */
  const renderProductCard = ({
    item,
  }: {
    item: MarketplaceProduct;
  }) => {
    const processing =
      isProcessing === item.id;

    return (
      <Pressable
        onPress={() =>
          openProductDetails(item)
        }
        disabled={processing}
        style={({ pressed }) => [
          styles.productCard,
          pressed && styles.productCardPressed,
        ]}
        android_ripple={{
          color: '#E6FFFB',
        }}
      >
        {/* PRODUCT IMAGE */}
        <View style={styles.productImageContainer}>
          {item.imageUrl ? (
            <Image
              source={{
                uri: item.imageUrl,
              }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={
                styles.productImagePlaceholder
              }
            >
              <Ionicons
                name="image-outline"
                size={42}
                color={COLORS.muted}
              />

              <Text
                style={
                  styles.noImageText
                }
              >
                No Image
              </Text>
            </View>
          )}
        </View>

        {/* PRODUCT INFORMATION */}
        <View style={styles.productContent}>
          <View style={styles.productTopRow}>
            <View style={styles.productTitleContainer}>
              <Text
                style={styles.productName}
                numberOfLines={2}
              >
                {item.name}
              </Text>

              <Text
                style={styles.productBrand}
                numberOfLines={1}
              >
                {item.brand}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                item.isActive
                  ? styles.activeBadge
                  : styles.inactiveBadge,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  item.isActive
                    ? styles.activeDot
                    : styles.inactiveDot,
                ]}
              />

              <Text
                style={[
                  styles.statusBadgeText,
                  item.isActive
                    ? styles.activeText
                    : styles.inactiveText,
                ]}
              >
                {item.isActive
                  ? 'Active'
                  : 'Inactive'}
              </Text>
            </View>
          </View>

          <Text
            style={styles.productDescription}
            numberOfLines={2}
          >
            {item.description ||
              'No product description available.'}
          </Text>

          <View style={styles.productMetaRow}>
            <View>
              <Text style={styles.metaLabel}>
                Price
              </Text>

              <Text style={styles.productPrice}>
                R{' '}
                {Number(
                  item.price,
                ).toLocaleString(
                  'en-ZA',
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  },
                )}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>
                Stock
              </Text>

              <Text style={styles.metaValue}>
                {item.quantity}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>
                SKU
              </Text>

              <Text
                style={styles.metaValue}
                numberOfLines={1}
              >
                {item.sku || '—'}
              </Text>
            </View>
          </View>

          {/* ACTIONS */}
          <View style={styles.actionsRow}>
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                handleEditProduct(item);
              }}
              disabled={processing}
              style={[
                styles.actionButton,
                styles.editButton,
                processing &&
                  styles.disabledButton,
              ]}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={COLORS.primary}
              />

              <Text
                style={styles.editButtonText}
              >
                Edit
              </Text>
            </Pressable>

            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                handleToggleStatus(item);
              }}
              disabled={processing}
              style={[
                styles.actionButton,
                styles.statusButton,
                processing &&
                  styles.disabledButton,
              ]}
            >
              {processing ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.warning}
                />
              ) : (
                <Ionicons
                  name={
                    item.isActive
                      ? 'eye-off-outline'
                      : 'eye-outline'
                  }
                  size={18}
                  color={COLORS.warning}
                />
              )}

              <Text
                style={styles.statusButtonText}
              >
                {item.isActive
                  ? 'Deactivate'
                  : 'Activate'}
              </Text>
            </Pressable>

            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                confirmDeleteProduct(item);
              }}
              disabled={processing}
              style={[
                styles.deleteButton,
                processing &&
                  styles.disabledButton,
              ]}
            >
              <Ionicons
                name="trash-outline"
                size={19}
                color={COLORS.danger}
              />
            </Pressable>
          </View>

          {/* VIEW DETAILS */}
          <View style={styles.viewDetailsRow}>
            <Text
              style={styles.viewDetailsText}
            >
              Tap product to view full details
            </Text>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={COLORS.primary}
            />
          </View>
        </View>
      </Pressable>
    );
  };

  /**
   * Empty search/list state.
   */
  const renderEmptyState = () => {
    if (isLoading) {
      return null;
    }

    const searching =
      searchQuery.trim().length > 0;

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name={
              searching
                ? 'search-outline'
                : 'cube-outline'
            }
            size={48}
            color={COLORS.primary}
          />
        </View>

        <Text style={styles.emptyTitle}>
          {searching
            ? 'No Products Found'
            : 'No Products Yet'}
        </Text>

        <Text style={styles.emptyDescription}>
          {searching
            ? 'Try changing your search term or clear the search field.'
            : 'Start building your marketplace catalogue by adding your first product.'}
        </Text>

        {!searching && (
          <Pressable
            onPress={handleAddProduct}
            style={styles.emptyAddButton}
          >
            <Ionicons
              name="add"
              size={21}
              color={COLORS.white}
            />

            <Text
              style={styles.emptyAddButtonText}
            >
              Add Product
            </Text>
          </Pressable>
        )}
      </View>
    );
  };

  /**
   * Header.
   */
  const listHeader = () => {
    return (
      <>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                styles.totalStatIcon,
              ]}
            >
              <Ionicons
                name="cube-outline"
                size={22}
                color={COLORS.primary}
              />
            </View>

            <View>
              <Text style={styles.statLabel}>
                Total Products
              </Text>

              <Text style={styles.statValue}>
                {products.length}
              </Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                styles.activeStatIcon,
              ]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={22}
                color={COLORS.success}
              />
            </View>

            <View>
              <Text style={styles.statLabel}>
                Active
              </Text>

              <Text style={styles.statValue}>
                {
                  products.filter(
                    (product) =>
                      product.isActive,
                  ).length
                }
              </Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                styles.stockStatIcon,
              ]}
            >
              <Ionicons
                name="layers-outline"
                size={22}
                color={COLORS.warning}
              />
            </View>

            <View>
              <Text style={styles.statLabel}>
                Stock Units
              </Text>

              <Text style={styles.statValue}>
                {products.reduce(
                  (total, product) =>
                    total +
                    Number(
                      product.quantity,
                    ),
                  0,
                )}
              </Text>
            </View>
          </View>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={21}
              color={COLORS.danger}
            />

            <Text style={styles.errorText}>
              {error}
            </Text>

            <Pressable
              onPress={() =>
                loadProducts(true)
              }
            >
              <Text
                style={styles.retryText}
              >
                Retry
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.resultsHeader}>
          <View>
            <Text style={styles.resultsTitle}>
              Marketplace Catalogue
            </Text>

            <Text
              style={styles.resultsSubtitle}
            >
              {filteredProducts.length}{' '}
              {filteredProducts.length === 1
                ? 'product'
                : 'products'}
            </Text>
          </View>
        </View>
      </>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={styles.loadingContainer}
      >
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />

        <Text style={styles.loadingTitle}>
          Loading Products
        </Text>

        <Text style={styles.loadingDescription}>
          Connecting to the marketplace catalogue...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() =>
              navigation.goBack()
            }
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={23}
              color={COLORS.text}
            />
          </Pressable>

          <View>
            <Text style={styles.headerTitle}>
              Marketplace Products
            </Text>

            <Text
              style={styles.headerSubtitle}
            >
              Manage your product catalogue
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleAddProduct}
          style={styles.addButton}
        >
          <Ionicons
            name="add"
            size={21}
            color={COLORS.white}
          />

          <Text style={styles.addButtonText}>
            Add Product
          </Text>
        </Pressable>
      </View>

      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={21}
          color={COLORS.muted}
        />

        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search products, brands, categories or SKU..."
          placeholderTextColor={COLORS.muted}
          style={styles.searchInput}
          returnKeyType="search"
        />

        {searchQuery.length > 0 && (
          <Pressable
            onPress={() =>
              setSearchQuery('')
            }
          >
            <Ionicons
              name="close-circle"
              size={21}
              color={COLORS.muted}
            />
          </Pressable>
        )}
      </View>

      {/* PRODUCT LIST */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderProductCard}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          filteredProducts.length === 0 &&
            styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />

      {/* PRODUCT DETAILS MODAL */}
      <Modal
        visible={detailsVisible}
        transparent
        animationType="slide"
        onRequestClose={
          closeProductDetails
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModal}>
            <View
              style={styles.modalHeader}
            >
              <View>
                <Text
                  style={styles.modalTitle}
                >
                  Product Details
                </Text>

                <Text
                  style={styles.modalSubtitle}
                >
                  Marketplace catalogue item
                </Text>
              </View>

              <Pressable
                onPress={
                  closeProductDetails
                }
                style={styles.modalCloseButton}
              >
                <Ionicons
                  name="close"
                  size={25}
                  color={COLORS.text}
                />
              </Pressable>
            </View>

            {selectedProduct && (
              <ScrollView
                showsVerticalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.modalScrollContent
                }
              >
                {/* IMAGE */}
                <View
                  style={
                    styles.modalImageContainer
                  }
                >
                  {selectedProduct.imageUrl ? (
                    <Image
                      source={{
                        uri: selectedProduct.imageUrl,
                      }}
                      style={
                        styles.modalImage
                      }
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={
                        styles.modalImagePlaceholder
                      }
                    >
                      <Ionicons
                        name="image-outline"
                        size={58}
                        color={
                          COLORS.muted
                        }
                      />

                      <Text
                        style={
                          styles.modalNoImageText
                        }
                      >
                        No product image
                      </Text>
                    </View>
                  )}
                </View>

                {/* NAME + STATUS */}
                <View
                  style={
                    styles.detailsTitleRow
                  }
                >
                  <View
                    style={
                      styles.detailsTitleContainer
                    }
                  >
                    <Text
                      style={
                        styles.detailsProductName
                      }
                    >
                      {selectedProduct.name}
                    </Text>

                    <Text
                      style={
                        styles.detailsBrand
                      }
                    >
                      {selectedProduct.brand}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      selectedProduct.isActive
                        ? styles.activeBadge
                        : styles.inactiveBadge,
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        selectedProduct.isActive
                          ? styles.activeDot
                          : styles.inactiveDot,
                      ]}
                    />

                    <Text
                      style={[
                        styles.statusBadgeText,
                        selectedProduct.isActive
                          ? styles.activeText
                          : styles.inactiveText,
                      ]}
                    >
                      {selectedProduct.isActive
                        ? 'Active'
                        : 'Inactive'}
                    </Text>
                  </View>
                </View>

                {/* DESCRIPTION */}
                <View
                  style={
                    styles.detailsSection
                  }
                >
                  <Text
                    style={
                      styles.detailsSectionTitle
                    }
                  >
                    Description
                  </Text>

                  <Text
                    style={
                      styles.detailsDescription
                    }
                  >
                    {selectedProduct.description ||
                      'No description provided.'}
                  </Text>
                </View>

                {/* DETAILS GRID */}
                <View
                  style={
                    styles.detailsGrid
                  }
                >
                  <DetailItem
                    label="Selling Price"
                    value={`R ${Number(
                      selectedProduct.price,
                    ).toLocaleString(
                      'en-ZA',
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      },
                    )}`}
                  />

                  <DetailItem
                    label="Cost Price"
                    value={
                      selectedProduct.costPrice ===
                      null
                        ? 'Not specified'
                        : `R ${Number(
                            selectedProduct.costPrice,
                          ).toLocaleString(
                            'en-ZA',
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}`
                    }
                  />

                  <DetailItem
                    label="Stock Quantity"
                    value={String(
                      selectedProduct.quantity,
                    )}
                  />

                  <DetailItem
                    label="Category"
                    value={
                      selectedProduct.category ||
                      'Not specified'
                    }
                  />

                  <DetailItem
                    label="SKU"
                    value={
                      selectedProduct.sku ||
                      'Not specified'
                    }
                  />

                  <DetailItem
                    label="Product ID"
                    value={
                      selectedProduct.id
                    }
                  />
                </View>

                {/* ACTIONS */}
                <View
                  style={
                    styles.modalActions
                  }
                >
                  <Pressable
                    onPress={() =>
                      handleEditProduct(
                        selectedProduct,
                      )
                    }
                    style={[
                      styles.modalActionButton,
                      styles.modalEditButton,
                    ]}
                  >
                    <Ionicons
                      name="create-outline"
                      size={21}
                      color={COLORS.primary}
                    />

                    <Text
                      style={
                        styles.modalEditButtonText
                      }
                    >
                      Edit Product
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      handleToggleStatus(
                        selectedProduct,
                      )
                    }
                    disabled={
                      isProcessing ===
                      selectedProduct.id
                    }
                    style={[
                      styles.modalActionButton,
                      styles.modalStatusButton,
                    ]}
                  >
                    <Ionicons
                      name={
                        selectedProduct.isActive
                          ? 'eye-off-outline'
                          : 'eye-outline'
                      }
                      size={21}
                      color={COLORS.warning}
                    />

                    <Text
                      style={
                        styles.modalStatusButtonText
                      }
                    >
                      {selectedProduct.isActive
                        ? 'Deactivate Product'
                        : 'Activate Product'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      confirmDeleteProduct(
                        selectedProduct,
                      )
                    }
                    disabled={
                      isProcessing ===
                      selectedProduct.id
                    }
                    style={[
                      styles.modalActionButton,
                      styles.modalDeleteButton,
                    ]}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={21}
                      color={COLORS.danger}
                    />

                    <Text
                      style={
                        styles.modalDeleteButtonText
                      }
                    >
                      Delete Product
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

type DetailItemProps = {
  label: string;
  value: string;
};

function DetailItem({
  label,
  value,
}: DetailItemProps) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailItemLabel}>
        {label}
      </Text>

      <Text
        style={styles.detailItemValue}
        numberOfLines={3}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },

  loadingTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },

  loadingDescription: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
  },

  header: {
    minHeight: 78,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },

  headerSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: COLORS.muted,
  },

  addButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  addButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },

  searchContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 4,
    minHeight: 50,
    paddingHorizontal: 15,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  searchInput: {
    flex: 1,
    minHeight: 48,
    color: COLORS.text,
    fontSize: 15,
    outlineStyle: 'none',
  } as any,

  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },

  statCard: {
    flex: 1,
    minHeight: 82,
    padding: 14,
    borderRadius: 15,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  totalStatIcon: {
    backgroundColor: '#CCFBF1',
  },

  activeStatIcon: {
    backgroundColor: '#DCFCE7',
  },

  stockStatIcon: {
    backgroundColor: '#FEF3C7',
  },

  statLabel: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: '600',
  },

  statValue: {
    marginTop: 3,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },

  errorBox: {
    marginTop: 8,
    marginBottom: 8,
    padding: 13,
    borderRadius: 13,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 19,
  },

  retryText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },

  resultsHeader: {
    paddingTop: 8,
    paddingBottom: 12,
  },

  resultsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },

  resultsSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: COLORS.muted,
  },

  productCard: {
    marginBottom: 15,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    flexDirection: 'row',
  },

  productCardPressed: {
    opacity: 0.92,
    transform: [
      {
        scale: 0.995,
      },
    ],
  },

  productImageContainer: {
    width: 145,
    minHeight: 230,
    backgroundColor: '#F3F4F6',
  },

  productImage: {
    width: '100%',
    height: '100%',
  },

  productImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },

  noImageText: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '600',
  },

  productContent: {
    flex: 1,
    padding: 15,
  },

  productTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  productTitleContainer: {
    flex: 1,
  },

  productName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: 22,
  },

  productBrand: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  activeBadge: {
    backgroundColor: '#DCFCE7',
  },

  inactiveBadge: {
    backgroundColor: '#F3F4F6',
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },

  activeDot: {
    backgroundColor: COLORS.success,
  },

  inactiveDot: {
    backgroundColor: COLORS.muted,
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },

  activeText: {
    color: COLORS.success,
  },

  inactiveText: {
    color: COLORS.muted,
  },

  productDescription: {
    marginTop: 12,
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 19,
  },

  productMetaRow: {
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },

  metaItem: {
    flex: 1,
  },

  metaLabel: {
    fontSize: 10,
    color: COLORS.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  productPrice: {
    marginTop: 4,
    fontSize: 17,
    color: COLORS.primary,
    fontWeight: '800',
  },

  metaValue: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '700',
  },

  actionsRow: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  actionButton: {
    minHeight: 39,
    paddingHorizontal: 11,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  editButton: {
    backgroundColor: '#CCFBF1',
  },

  editButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },

  statusButton: {
    backgroundColor: '#FEF3C7',
  },

  statusButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.warning,
  },

  deleteButton: {
    width: 39,
    height: 39,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  disabledButton: {
    opacity: 0.5,
  },

  viewDetailsRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  viewDetailsText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 80,
  },

  emptyIcon: {
    width: 86,
    height: 86,
    borderRadius: 25,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },

  emptyDescription: {
    marginTop: 9,
    maxWidth: 450,
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 21,
    textAlign: 'center',
  },

  emptyAddButton: {
    marginTop: 22,
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  emptyAddButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    justifyContent: 'flex-end',
  },

  detailsModal: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
  },

  modalHeader: {
    minHeight: 72,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },

  modalSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.muted,
  },

  modalCloseButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalScrollContent: {
    padding: 20,
    paddingBottom: 35,
  },

  modalImageContainer: {
    width: '100%',
    height: 230,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },

  modalImage: {
    width: '100%',
    height: '100%',
  },

  modalImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalNoImageText: {
    marginTop: 10,
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
  },

  detailsTitleRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  detailsTitleContainer: {
    flex: 1,
  },

  detailsProductName: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: COLORS.text,
  },

  detailsBrand: {
    marginTop: 5,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },

  detailsSection: {
    marginTop: 22,
  },

  detailsSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },

  detailsDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.muted,
  },

  detailsGrid: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  detailItem: {
    width: '48%',
    minHeight: 75,
    padding: 13,
    borderRadius: 13,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  detailItemLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  detailItemValue: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
    color: COLORS.text,
  },

  modalActions: {
    marginTop: 22,
    gap: 10,
  },

  modalActionButton: {
    minHeight: 49,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },

  modalEditButton: {
    backgroundColor: '#CCFBF1',
    borderColor: '#99F6E4',
  },

  modalEditButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '800',
  },

  modalStatusButton: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },

  modalStatusButtonText: {
    color: COLORS.warning,
    fontSize: 14,
    fontWeight: '800',
  },

  modalDeleteButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },

  modalDeleteButtonText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '800',
  },
});