
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ROUTES } from '../../constants/routes';
import { RootStackParamList } from '../../navigation/types';

type NavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  status: 'Active' | 'Draft';
  description: string;
}

const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Solar Home System',
    category: 'Solar Solutions',
    price: 'R0',
    status: 'Active',
    description:
      'Complete solar solution for residential energy needs.',
  },
  {
    id: '2',
    name: 'Commercial Solar Package',
    category: 'Business Solutions',
    price: 'R0',
    status: 'Active',
    description:
      'Solar solution designed for commercial and business operations.',
  },
];

export function ProductsManagementScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [products, setProducts] =
    useState<Product[]>(INITIAL_PRODUCTS);

  const [searchQuery, setSearchQuery] =
    useState('');

  const [selectedFilter, setSelectedFilter] =
    useState<'All' | 'Active' | 'Draft'>('All');

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);

      const matchesFilter =
        selectedFilter === 'All' ||
        product.status === selectedFilter;

      return matchesSearch && matchesFilter;
    });
  }, [products, searchQuery, selectedFilter]);

  const activeCount = products.filter(
    (product) => product.status === 'Active',
  ).length;

  const draftCount = products.filter(
    (product) => product.status === 'Draft',
  ).length;

  const handleAddProduct = () => {
    Alert.alert(
      'Add Product',
      'The product creation form will be connected here.',
    );
  };

  const handleEditProduct = (product: Product) => {
    Alert.alert(
      'Edit Product',
      `Edit "${product.name}"`,
    );
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setProducts((currentProducts) =>
              currentProducts.filter(
                (item) => item.id !== product.id,
              ),
            );
          },
        },
      ],
    );
  };

  const handleProductPress = (product: Product) => {
    handleEditProduct(product);
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
      >
        {/* Header */}

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="arrow-back"
                size={21}
                color={COLORS.text}
              />
            </Pressable>

            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>
                CATALOGUE
              </Text>

              <Text style={styles.title}>
                Products
              </Text>

              <Text style={styles.subtitle}>
                Manage products available across the
                Green Off-Grid catalogue.
              </Text>
            </View>
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
              size={21}
              color={COLORS.white}
            />

            <Text style={styles.addButtonText}>
              Add
            </Text>
          </Pressable>
        </View>

        {/* Summary */}

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryTitle}>
                Product Catalogue
              </Text>

              <Text style={styles.summarySubtitle}>
                Keep your product information current
                and customer-ready.
              </Text>
            </View>

            <View style={styles.summaryIcon}>
              <Ionicons
                name="cube-outline"
                size={23}
                color={COLORS.teal}
              />
            </View>
          </View>

          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>
                {products.length}
              </Text>

              <Text style={styles.summaryLabel}>
                Total products
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>
                {activeCount}
              </Text>

              <Text style={styles.summaryLabel}>
                Active
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>
                {draftCount}
              </Text>

              <Text style={styles.summaryLabel}>
                Drafts
              </Text>
            </View>
          </View>
        </View>

        {/* Search */}

        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color={COLORS.muted}
          />

          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search products..."
            placeholderTextColor={COLORS.muted}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {searchQuery.length > 0 ? (
            <Pressable
              onPress={() => setSearchQuery('')}
            >
              <Ionicons
                name="close-circle"
                size={19}
                color={COLORS.muted}
              />
            </Pressable>
          ) : null}
        </View>

        {/* Filters */}

        <View style={styles.filterRow}>
          {(['All', 'Active', 'Draft'] as const).map(
            (filter) => {
              const isSelected =
                selectedFilter === filter;

              return (
                <Pressable
                  key={filter}
                  style={[
                    styles.filterButton,
                    isSelected &&
                      styles.filterButtonSelected,
                  ]}
                  onPress={() =>
                    setSelectedFilter(filter)
                  }
                >
                  <Text
                    style={[
                      styles.filterText,
                      isSelected &&
                        styles.filterTextSelected,
                    ]}
                  >
                    {filter}
                  </Text>
                </Pressable>
              );
            },
          )}
        </View>

        {/* Section */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Products
            </Text>

            <Text style={styles.sectionSubtitle}>
              {filteredProducts.length} product
              {filteredProducts.length === 1
                ? ''
                : 's'} displayed
            </Text>
          </View>
        </View>

        {/* Product List */}

        {filteredProducts.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="cube-outline"
                size={30}
                color={COLORS.muted}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No products found
            </Text>

            <Text style={styles.emptyDescription}>
              Try changing your search or filter,
              or add a new product to the catalogue.
            </Text>

            <Pressable
              style={styles.emptyButton}
              onPress={handleAddProduct}
            >
              <Text style={styles.emptyButtonText}>
                Add Product
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.productList}>
            {filteredProducts.map((product) => (
              <Pressable
                key={product.id}
                style={({ pressed }) => [
                  styles.productCard,
                  pressed && styles.pressed,
                ]}
                onPress={() =>
                  handleProductPress(product)
                }
              >
                {/* Product image placeholder */}

                <View style={styles.productImage}>
                  <Ionicons
                    name="image-outline"
                    size={28}
                    color={COLORS.muted}
                  />
                </View>

                <View style={styles.productMain}>
                  <View style={styles.productTitleRow}>
                    <Text
                      style={styles.productName}
                      numberOfLines={1}
                    >
                      {product.name}
                    </Text>

                    <View
                      style={[
                        styles.statusBadge,
                        product.status ===
                          'Active'
                          ? styles.activeBadge
                          : styles.draftBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          product.status ===
                            'Active'
                            ? styles.activeText
                            : styles.draftText,
                        ]}
                      >
                        {product.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.productCategory}>
                    {product.category}
                  </Text>

                  <Text
                    style={styles.productDescription}
                    numberOfLines={2}
                  >
                    {product.description}
                  </Text>

                  <View style={styles.productFooter}>
                    <Text style={styles.productPrice}>
                      {product.price}
                    </Text>

                    <View style={styles.productActions}>
                      <Pressable
                        style={styles.iconButton}
                        onPress={() =>
                          handleEditProduct(
                            product,
                          )
                        }
                      >
                        <Ionicons
                          name="create-outline"
                          size={19}
                          color={COLORS.tealDark}
                        />
                      </Pressable>

                      <Pressable
                        style={[
                          styles.iconButton,
                          styles.deleteButton,
                        ]}
                        onPress={() =>
                          handleDeleteProduct(
                            product,
                          )
                        }
                      >
                        <Ionicons
                          name="trash-outline"
                          size={19}
                          color={COLORS.danger}
                        />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Management note */}

        <View style={styles.managementNote}>
          <Ionicons
            name="information-circle-outline"
            size={19}
            color={COLORS.tealDark}
          />

          <Text style={styles.managementNoteText}>
            Product changes should be reviewed before
            publishing them to customers.
          </Text>
        </View>

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

  activeBackground: '#EEF8F3',
  activeText: '#27835C',

  draftBackground: '#FFF7E8',
  draftText: '#A66B00',
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

  /* Header */

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 12,
  },

  headerText: {
    flex: 1,
    paddingRight: 10,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: COLORS.tealDark,
    marginBottom: 4,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.secondaryText,
  },

  addButton: {
    minHeight: 40,
    paddingHorizontal: 13,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.teal,
  },

  addButtonText: {
    marginLeft: 5,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },

  /* Summary */

  summaryCard: {
    padding: 17,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },

  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },

  summarySubtitle: {
    marginTop: 4,
    maxWidth: '88%',
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.secondaryText,
  },

  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.tealLight,
  },

  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },

  summaryStat: {
    flex: 1,
  },

  summaryValue: {
    fontSize: 23,
    fontWeight: '800',
    color: COLORS.text,
  },

  summaryLabel: {
    marginTop: 3,
    fontSize: 11,
    color: COLORS.muted,
  },

  statDivider: {
    width: 1,
    height: 35,
    backgroundColor: COLORS.border,
  },

  /* Search */

  searchContainer: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    marginLeft: 9,
    fontSize: 14,
    color: COLORS.text,
  },

  /* Filters */

  filterRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },

  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },

  filterButtonSelected: {
    backgroundColor: COLORS.tealDark,
    borderColor: COLORS.tealDark,
  },

  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondaryText,
  },

  filterTextSelected: {
    color: COLORS.white,
  },

  /* Section */

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.text,
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.secondaryText,
  },

  /* Products */

  productList: {
    marginBottom: 18,
  },

  productCard: {
    flexDirection: 'row',
    padding: 13,
    marginBottom: 10,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  productImage: {
    width: 88,
    height: 88,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F5F5',
  },

  productMain: {
    flex: 1,
    marginLeft: 13,
  },

  productTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  productName: {
    flex: 1,
    paddingRight: 7,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  activeBadge: {
    backgroundColor: COLORS.activeBackground,
  },

  draftBadge: {
    backgroundColor: COLORS.draftBackground,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },

  activeText: {
    color: COLORS.activeText,
  },

  draftText: {
    color: COLORS.draftText,
  },

  productCategory: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.tealDark,
  },

  productDescription: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.secondaryText,
  },

  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  productPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },

  productActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.tealLight,
    marginLeft: 7,
  },

  deleteButton: {
    backgroundColor: '#FFF3F3',
  },

  /* Empty */

  emptyCard: {
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 32,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F5F5',
    marginBottom: 13,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },

  emptyDescription: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.secondaryText,
  },

  emptyButton: {
    marginTop: 17,
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 11,
    backgroundColor: COLORS.teal,
  },

  emptyButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },

  /* Note */

  managementNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 13,
    borderRadius: 14,
    backgroundColor: COLORS.tealLight,
    marginTop: 4,
    marginBottom: 25,
  },

  managementNoteText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.tealDark,
  },

  footerText: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.muted,
  },

  pressed: {
    opacity: 0.72,
  },
});

