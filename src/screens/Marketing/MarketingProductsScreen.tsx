import React, {
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
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import {
  NavigationProp,
  useNavigation,
} from '@react-navigation/native';

import {
  activateMarketplaceProduct,
  deactivateMarketplaceProduct,
  deleteMarketplaceProduct,
  fetchAllMarketplaceProducts,
  type MarketplaceProduct,
} from '../../services/marketplace/marketplace';

import { ROUTES } from '../../constants/routes';

import type { RootStackParamList } from '../../navigation/types';

type FilterType =
  | 'all'
  | 'active'
  | 'inactive';

const COLORS = {
  background: '#F5F7FA',
  white: '#FFFFFF',
  primary: '#0B7A4B',
  primaryDark: '#075C39',
  primaryLight: '#E8F5EF',
  text: '#17212B',
  secondaryText: '#667085',
  muted: '#98A2B3',
  border: '#E4E7EC',
  danger: '#D92D20',
  dangerLight: '#FEF3F2',
  success: '#027A48',
  successLight: '#ECFDF3',
  warning: '#B54708',
  warningLight: '#FFFAEB',
};

const formatCurrency = (
  value: number,
): string => {
  return `R ${Number(value || 0).toLocaleString(
    'en-ZA',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`;
};

const getStockStatus = (
  quantity: number,
) => {
  if (quantity <= 0) {
    return {
      label: 'Out of stock',
      color: COLORS.danger,
      background: COLORS.dangerLight,
    };
  }

  if (quantity <= 5) {
    return {
      label: `Low stock (${quantity})`,
      color: COLORS.warning,
      background: COLORS.warningLight,
    };
  }

  return {
    label: `${quantity} in stock`,
    color: COLORS.success,
    background: COLORS.successLight,
  };
};

const getInitials = (
  name: string,
): string => {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return 'P';
  }

  if (words.length === 1) {
    return words[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
};

export default function MarketingProductsScreen() {
  const navigation =
    useNavigation<
      NavigationProp<RootStackParamList>
    >();

  const [products, setProducts] = useState<
    MarketplaceProduct[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState('');

  const [filter, setFilter] =
    useState<FilterType>('all');

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState<string>('all');

  const [
    selectedProduct,
    setSelectedProduct,
  ] =
    useState<MarketplaceProduct | null>(
      null,
    );

  const [
    detailsVisible,
    setDetailsVisible,
  ] = useState(false);

  const [
    processingProductId,
    setProcessingProductId,
  ] = useState<string | null>(null);

  const loadProducts =
    useCallback(
      async (showLoader = true) => {
        try {
          if (showLoader) {
            setLoading(true);
          }

          const data =
            await fetchAllMarketplaceProducts();

          setProducts(data);
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'Unable to load marketplace products.';

          Alert.alert(
            'Unable to load products',
            message,
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

  const handleRefresh =
    useCallback(() => {
      setRefreshing(true);
      loadProducts(false);
    }, [loadProducts]);

  const categories = useMemo(() => {
    const uniqueCategories =
      Array.from(
        new Set(
          products
            .map((product) =>
              product.category?.trim(),
            )
            .filter(Boolean),
        ),
      );

    return ['all', ...uniqueCategories];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name
          .toLowerCase()
          .includes(query) ||
        product.description
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
          .includes(query);

      const matchesStatus =
        filter === 'all' ||
        (filter === 'active' &&
          product.isActive) ||
        (filter === 'inactive' &&
          !product.isActive);

      const matchesCategory =
        selectedCategory === 'all' ||
        product.category ===
          selectedCategory;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory
      );
    });
  }, [
    products,
    searchQuery,
    filter,
    selectedCategory,
  ]);

  const statistics = useMemo(() => {
    const total = products.length;

    const active = products.filter(
      (product) => product.isActive,
    ).length;

    const inactive = products.filter(
      (product) => !product.isActive,
    ).length;

    const lowStock = products.filter(
      (product) =>
        product.quantity > 0 &&
        product.quantity <= 5,
    ).length;

    const outOfStock = products.filter(
      (product) => product.quantity <= 0,
    ).length;

    return {
      total,
      active,
      inactive,
      lowStock,
      outOfStock,
    };
  }, [products]);

  const openProductDetails = (
    product: MarketplaceProduct,
  ) => {
    setSelectedProduct(product);
    setDetailsVisible(true);
  };

  const closeProductDetails = () => {
    setDetailsVisible(false);
    setSelectedProduct(null);
  };

  const handleAddProduct = () => {
    navigation.navigate(
      ROUTES.ADD_PRODUCT,
    );
  };

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

  const handleToggleStatus = async (
    product: MarketplaceProduct,
  ) => {
    try {
      setProcessingProductId(product.id);

      if (product.isActive) {
        await deactivateMarketplaceProduct(
          product.id,
        );
      } else {
        await activateMarketplaceProduct(
          product.id,
        );
      }

      await loadProducts(false);

      if (
        selectedProduct?.id ===
        product.id
      ) {
        setSelectedProduct({
          ...product,
          isActive: !product.isActive,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to update product status.';

      Alert.alert(
        'Status update failed',
        message,
      );
    } finally {
      setProcessingProductId(null);
    }
  };

  const confirmDeleteProduct = (
    product: MarketplaceProduct,
  ) => {
    Alert.alert(
      'Delete product',
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

  const handleDeleteProduct = async (
    product: MarketplaceProduct,
  ) => {
    try {
      setProcessingProductId(product.id);

      await deleteMarketplaceProduct(
        product.id,
      );

      closeProductDetails();

      setProducts((current) =>
        current.filter(
          (item) =>
            item.id !== product.id,
        ),
      );

      Alert.alert(
        'Product deleted',
        `${product.name} has been removed successfully.`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to delete product.';

      Alert.alert(
        'Delete failed',
        message,
      );
    } finally {
      setProcessingProductId(null);
    }
  };

  const renderFilterButton = (
    label: string,
    value: FilterType,
  ) => {
    const selected =
      filter === value;

    return (
      <TouchableOpacity
        style={[
          styles.filterButton,
          selected &&
            styles.filterButtonActive,
        ]}
        onPress={() =>
          setFilter(value)
        }
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.filterButtonText,
            selected &&
              styles.filterButtonTextActive,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCategoryButton = (
    category: string,
  ) => {
    const selected =
      selectedCategory === category;

    const label =
      category === 'all'
        ? 'All categories'
        : category;

    return (
      <TouchableOpacity
        key={category}
        style={[
          styles.categoryButton,
          selected &&
            styles.categoryButtonActive,
        ]}
        onPress={() =>
          setSelectedCategory(category)
        }
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.categoryButtonText,
            selected &&
              styles.categoryButtonTextActive,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderProductCard = ({
    item,
  }: {
    item: MarketplaceProduct;
  }) => {
    const stockStatus =
      getStockStatus(item.quantity);

    const processing =
      processingProductId === item.id;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() =>
          openProductDetails(item)
        }
        activeOpacity={0.92}
      >
        <View
          style={
            styles.productImageContainer
          }
        >
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
              style={styles.imagePlaceholder}
            >
              <Text
                style={
                  styles.imagePlaceholderText
                }
              >
                {getInitials(item.name)}
              </Text>
            </View>
          )}

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
                styles.statusText,
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

        <View style={styles.productContent}>
          <Text
            style={styles.productBrand}
            numberOfLines={1}
          >
            {item.brand ||
              'Green Off Grid'}
          </Text>

          <Text
            style={styles.productName}
            numberOfLines={2}
          >
            {item.name}
          </Text>

          <Text
            style={styles.productDescription}
            numberOfLines={2}
          >
            {item.description ||
              'No product description available.'}
          </Text>

          <View style={styles.productMeta}>
            <Text
              style={styles.productPrice}
            >
              {formatCurrency(item.price)}
            </Text>

            <View
              style={[
                styles.stockBadge,
                {
                  backgroundColor:
                    stockStatus.background,
                },
              ]}
            >
              <Text
                style={[
                  styles.stockBadgeText,
                  {
                    color:
                      stockStatus.color,
                  },
                ]}
              >
                {stockStatus.label}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.skuText}>
              SKU: {item.sku || 'N/A'}
            </Text>

            <View
              style={styles.cardActions}
            >
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() =>
                  handleEditProduct(item)
                }
                activeOpacity={0.8}
              >
                <Ionicons
                  name="create-outline"
                  size={19}
                  color={COLORS.primary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.iconButton,
                  processing &&
                    styles.disabledButton,
                ]}
                onPress={() =>
                  handleToggleStatus(item)
                }
                disabled={processing}
                activeOpacity={0.8}
              >
                {processing ? (
                  <ActivityIndicator
                    size="small"
                    color={COLORS.primary}
                  />
                ) : (
                  <Ionicons
                    name={
                      item.isActive
                        ? 'eye-off-outline'
                        : 'eye-outline'
                    }
                    size={19}
                    color={COLORS.primary}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.iconButton,
                  styles.deleteIconButton,
                ]}
                onPress={() =>
                  confirmDeleteProduct(item)
                }
                activeOpacity={0.8}
              >
                <Ionicons
                  name="trash-outline"
                  size={19}
                  color={COLORS.danger}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={
            COLORS.background
          }
        />

        <View
          style={
            styles.loadingContainer
          }
        >
          <View
            style={styles.loadingIcon}
          >
            <Ionicons
              name="cube-outline"
              size={32}
              color={COLORS.primary}
            />
          </View>

          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />

          <Text
            style={styles.loadingTitle}
          >
            Loading products
          </Text>

          <Text
            style={
              styles.loadingSubtitle
            }
          >
            Preparing your marketplace
            catalogue...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={
          COLORS.background
        }
      />

      <View style={styles.header}>
        <View
          style={
            styles.headerTextContainer
          }
        >
          <Text
            style={styles.headerEyebrow}
          >
            MARKETING
          </Text>

          <Text
            style={styles.headerTitle}
          >
            Marketplace Products
          </Text>

          <Text
            style={styles.headerSubtitle}
          >
            Manage your product catalogue,
            availability and inventory.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddProduct}
          activeOpacity={0.85}
        >
          <Ionicons
            name="add"
            size={21}
            color={COLORS.white}
          />

          <Text
            style={styles.addButtonText}
          >
            Add Product
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderProductCard}
        numColumns={2}
        columnWrapperStyle={
          styles.columnWrapper
        }
        contentContainerStyle={
          styles.listContent
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <View>
            <View
              style={
                styles.statsContainer
              }
            >
              <View
                style={styles.statCard}
              >
                <View
                  style={[
                    styles.statIcon,
                    {
                      backgroundColor:
                        COLORS.primaryLight,
                    },
                  ]}
                >
                  <Ionicons
                    name="cube-outline"
                    size={21}
                    color={COLORS.primary}
                  />
                </View>

                <Text
                  style={styles.statValue}
                >
                  {statistics.total}
                </Text>

                <Text
                  style={styles.statLabel}
                >
                  Total Products
                </Text>
              </View>

              <View
                style={styles.statCard}
              >
                <View
                  style={[
                    styles.statIcon,
                    {
                      backgroundColor:
                        COLORS.successLight,
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={21}
                    color={COLORS.success}
                  />
                </View>

                <Text
                  style={styles.statValue}
                >
                  {statistics.active}
                </Text>

                <Text
                  style={styles.statLabel}
                >
                  Active
                </Text>
              </View>

              <View
                style={styles.statCard}
              >
                <View
                  style={[
                    styles.statIcon,
                    {
                      backgroundColor:
                        COLORS.warningLight,
                    },
                  ]}
                >
                  <Ionicons
                    name="pause-circle-outline"
                    size={21}
                    color={COLORS.warning}
                  />
                </View>

                <Text
                  style={styles.statValue}
                >
                  {statistics.inactive}
                </Text>

                <Text
                  style={styles.statLabel}
                >
                  Inactive
                </Text>
              </View>

              <View
                style={styles.statCard}
              >
                <View
                  style={[
                    styles.statIcon,
                    {
                      backgroundColor:
                        COLORS.dangerLight,
                    },
                  ]}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={21}
                    color={COLORS.danger}
                  />
                </View>

                <Text
                  style={styles.statValue}
                >
                  {statistics.lowStock +
                    statistics.outOfStock}
                </Text>

                <Text
                  style={styles.statLabel}
                >
                  Stock Alerts
                </Text>
              </View>
            </View>

            <View
              style={
                styles.searchContainer
              }
            >
              <Ionicons
                name="search-outline"
                size={21}
                color={COLORS.muted}
              />

              <TextInput
                style={styles.searchInput}
                placeholder="Search by product, SKU, brand or category..."
                placeholderTextColor={
                  COLORS.muted
                }
                value={searchQuery}
                onChangeText={
                  setSearchQuery
                }
                autoCapitalize="none"
                autoCorrect={false}
              />

              {searchQuery.length >
                0 && (
                <TouchableOpacity
                  onPress={() =>
                    setSearchQuery('')
                  }
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={COLORS.muted}
                  />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.filterRow
              }
            >
              {renderFilterButton(
                'All',
                'all',
              )}

              {renderFilterButton(
                'Active',
                'active',
              )}

              {renderFilterButton(
                'Inactive',
                'inactive',
              )}
            </ScrollView>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.categoryRow
              }
            >
              {categories.map(
                renderCategoryButton,
              )}
            </ScrollView>

            <View
              style={
                styles.resultsHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.resultsTitle
                  }
                >
                  Product Catalogue
                </Text>

                <Text
                  style={
                    styles.resultsSubtitle
                  }
                >
                  Showing{' '}
                  {
                    filteredProducts.length
                  }{' '}
                  of {products.length}{' '}
                  products
                </Text>
              </View>

              {(searchQuery ||
                filter !== 'all' ||
                selectedCategory !==
                  'all') && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setFilter('all');
                    setSelectedCategory(
                      'all',
                    );
                  }}
                >
                  <Text
                    style={
                      styles.clearFilters
                    }
                  >
                    Clear filters
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View
            style={styles.emptyContainer}
          >
            <View
              style={styles.emptyIcon}
            >
              <Ionicons
                name="search-outline"
                size={38}
                color={COLORS.muted}
              />
            </View>

            <Text
              style={styles.emptyTitle}
            >
              No products found
            </Text>

            <Text
              style={
                styles.emptySubtitle
              }
            >
              Try adjusting your search or
              filters, or add a new product.
            </Text>

            <TouchableOpacity
              style={
                styles.emptyButton
              }
              onPress={handleAddProduct}
              activeOpacity={0.85}
            >
              <Ionicons
                name="add"
                size={20}
                color={COLORS.white}
              />

              <Text
                style={
                  styles.emptyButtonText
                }
              >
                Add Product
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal
        visible={detailsVisible}
        transparent
        animationType="slide"
        onRequestClose={
          closeProductDetails
        }
      >
        <View
          style={styles.modalOverlay}
        >
          <View
            style={styles.detailsModal}
          >
            <View
              style={styles.modalHeader}
            >
              <Text
                style={styles.modalTitle}
              >
                Product Details
              </Text>

              <TouchableOpacity
                onPress={
                  closeProductDetails
                }
                style={
                  styles.modalCloseButton
                }
              >
                <Ionicons
                  name="close"
                  size={25}
                  color={COLORS.text}
                />
              </TouchableOpacity>
            </View>

            {selectedProduct && (
              <ScrollView
                showsVerticalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.detailsContent
                }
              >
                {selectedProduct.imageUrl ? (
                  <Image
                    source={{
                      uri: selectedProduct.imageUrl,
                    }}
                    style={
                      styles.detailsImage
                    }
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={
                      styles.detailsImagePlaceholder
                    }
                  >
                    <Text
                      style={
                        styles.detailsInitials
                      }
                    >
                      {getInitials(
                        selectedProduct.name,
                      )}
                    </Text>
                  </View>
                )}

                <View
                  style={
                    styles.detailsStatusRow
                  }
                >
                  <View
                    style={[
                      styles.detailsStatus,
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
                        styles.statusText,
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

                  <View
                    style={[
                      styles.stockBadge,
                      {
                        backgroundColor:
                          getStockStatus(
                            selectedProduct.quantity,
                          ).background,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stockBadgeText,
                        {
                          color:
                            getStockStatus(
                              selectedProduct.quantity,
                            ).color,
                        },
                      ]}
                    >
                      {
                        getStockStatus(
                          selectedProduct.quantity,
                        ).label
                      }
                    </Text>
                  </View>
                </View>

                <Text
                  style={styles.detailsBrand}
                >
                  {selectedProduct.brand ||
                    'Green Off Grid'}
                </Text>

                <Text
                  style={styles.detailsName}
                >
                  {selectedProduct.name}
                </Text>

                <Text
                  style={
                    styles.detailsDescription
                  }
                >
                  {selectedProduct.description ||
                    'No product description available.'}
                </Text>

                <View
                  style={styles.priceCard}
                >
                  <Text
                    style={
                      styles.priceCardLabel
                    }
                  >
                    Selling Price
                  </Text>

                  <Text
                    style={
                      styles.priceCardValue
                    }
                  >
                    {formatCurrency(
                      selectedProduct.price,
                    )}
                  </Text>
                </View>

                <View
                  style={styles.detailsGrid}
                >
                  <View
                    style={styles.detailItem}
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      SKU
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {selectedProduct.sku ||
                        'N/A'}
                    </Text>
                  </View>

                  <View
                    style={styles.detailItem}
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      Category
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {selectedProduct.category ||
                        'N/A'}
                    </Text>
                  </View>

                  <View
                    style={styles.detailItem}
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      Brand
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {selectedProduct.brand ||
                        'N/A'}
                    </Text>
                  </View>

                  <View
                    style={styles.detailItem}
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      Quantity
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {selectedProduct.quantity}
                    </Text>
                  </View>

                  <View
                    style={styles.detailItem}
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      Cost Price
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {selectedProduct.costPrice ===
                      null
                        ? 'Not provided'
                        : formatCurrency(
                            selectedProduct.costPrice,
                          )}
                    </Text>
                  </View>

                  <View
                    style={styles.detailItem}
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      Status
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {selectedProduct.isActive
                        ? 'Available'
                        : 'Hidden'}
                    </Text>
                  </View>
                </View>

                <View
                  style={styles.actionSection}
                >
                  <TouchableOpacity
                    style={
                      styles.primaryActionButton
                    }
                    onPress={() =>
                      handleEditProduct(
                        selectedProduct,
                      )
                    }
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name="create-outline"
                      size={20}
                      color={COLORS.white}
                    />

                    <Text
                      style={
                        styles.primaryActionText
                      }
                    >
                      Edit Product
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={
                      styles.secondaryActionButton
                    }
                    onPress={() =>
                      handleToggleStatus(
                        selectedProduct,
                      )
                    }
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={
                        selectedProduct.isActive
                          ? 'eye-off-outline'
                          : 'eye-outline'
                      }
                      size={20}
                      color={COLORS.primary}
                    />

                    <Text
                      style={
                        styles.secondaryActionText
                      }
                    >
                      {selectedProduct.isActive
                        ? 'Deactivate Product'
                        : 'Activate Product'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={
                      styles.deleteActionButton
                    }
                    onPress={() =>
                      confirmDeleteProduct(
                        selectedProduct,
                      )
                    }
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={COLORS.danger}
                    />

                    <Text
                      style={
                        styles.deleteActionText
                      }
                    >
                      Delete Product
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  loadingIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },

  loadingTitle: {
    marginTop: 18,
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.text,
  },

  loadingSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.secondaryText,
    textAlign: 'center',
  },

  header: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  headerTextContainer: {
    flex: 1,
    paddingRight: 12,
  },

  headerEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: COLORS.primary,
    marginBottom: 4,
  },

  headerTitle: {
    fontSize: 25,
    fontWeight: '900',
    color: COLORS.text,
  },

  headerSubtitle: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.secondaryText,
  },

  addButton: {
    minHeight: 44,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  addButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 35,
  },

  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 13,
  },

  statCard: {
    flex: 1,
    minHeight: 112,
    padding: 11,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statValue: {
    marginTop: 7,
    fontSize: 21,
    fontWeight: '900',
    color: COLORS.text,
  },

  statLabel: {
    marginTop: 2,
    fontSize: 10,
    color: COLORS.secondaryText,
    fontWeight: '600',
  },

  searchContainer: {
    minHeight: 51,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 11,
  },

  searchInput: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 49,
  },

  filterRow: {
    gap: 8,
    paddingBottom: 10,
  },

  filterButton: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 11,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  filterButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondaryText,
  },

  filterButtonTextActive: {
    color: COLORS.white,
  },

  categoryRow: {
    gap: 8,
    paddingBottom: 16,
  },

  categoryButton: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: '#D4EDE1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryButtonActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },

  categoryButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },

  categoryButtonTextActive: {
    color: COLORS.white,
  },

  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },

  resultsTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },

  resultsSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.secondaryText,
  },

  clearFilters: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },

  columnWrapper: {
    gap: 10,
    marginBottom: 10,
  },

  productCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    minWidth: 0,
  },

  productImageContainer: {
    height: 145,
    backgroundColor: '#EEF2F0',
    position: 'relative',
  },

  productImage: {
    width: '100%',
    height: '100%',
  },

  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
  },

  imagePlaceholderText: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
  },

  statusBadge: {
    position: 'absolute',
    top: 9,
    left: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  activeBadge: {
    backgroundColor: COLORS.successLight,
  },

  inactiveBadge: {
    backgroundColor: COLORS.dangerLight,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  activeDot: {
    backgroundColor: COLORS.success,
  },

  inactiveDot: {
    backgroundColor: COLORS.danger,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },

  activeText: {
    color: COLORS.success,
  },

  inactiveText: {
    color: COLORS.danger,
  },

  productContent: {
    padding: 12,
  },

  productBrand: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  productName: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
    color: COLORS.text,
  },

  productDescription: {
    marginTop: 6,
    minHeight: 34,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.secondaryText,
  },

  productMeta: {
    marginTop: 10,
    gap: 7,
  },

  productPrice: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.text,
  },

  stockBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  stockBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },

  cardFooter: {
    marginTop: 11,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  skuText: {
    fontSize: 9,
    color: COLORS.muted,
    fontWeight: '600',
    marginBottom: 8,
  },

  cardActions: {
    flexDirection: 'row',
    gap: 6,
  },

  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteIconButton: {
    backgroundColor: COLORS.dangerLight,
  },

  disabledButton: {
    opacity: 0.55,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 60,
  },

  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 23,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    marginTop: 18,
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.text,
  },

  emptySubtitle: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.secondaryText,
    textAlign: 'center',
  },

  emptyButton: {
    marginTop: 18,
    height: 45,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  emptyButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  detailsModal: {
    maxHeight: '94%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
  },

  modalHeader: {
    minHeight: 62,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },

  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailsContent: {
    padding: 18,
    paddingBottom: 35,
  },

  detailsImage: {
    width: '100%',
    height: 230,
    borderRadius: 17,
    backgroundColor: COLORS.background,
  },

  detailsImagePlaceholder: {
    width: '100%',
    height: 230,
    borderRadius: 17,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailsInitials: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.primary,
  },

  detailsStatusRow: {
    marginTop: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  detailsStatus: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  detailsBrand: {
    marginTop: 17,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: COLORS.primary,
    textTransform: 'uppercase',
  },

  detailsName: {
    marginTop: 5,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
    color: COLORS.text,
  },

  detailsDescription: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.secondaryText,
  },

  priceCard: {
    marginTop: 18,
    padding: 15,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
  },

  priceCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },

  priceCardValue: {
    marginTop: 4,
    fontSize: 25,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },

  detailsGrid: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    overflow: 'hidden',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  detailItem: {
    width: '50%',
    padding: 13,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
  },

  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.muted,
    textTransform: 'uppercase',
  },

  detailValue: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },

  actionSection: {
    marginTop: 18,
    gap: 9,
  },

  primaryActionButton: {
    height: 49,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  primaryActionText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },

  secondaryActionButton: {
    height: 49,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: '#CDE8DB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  secondaryActionText: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: '800',
  },

  deleteActionButton: {
    height: 49,
    borderRadius: 12,
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  deleteActionText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '800',
  },
});