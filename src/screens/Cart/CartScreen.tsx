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
import { useCartStore, type CartLine } from '../../store/cartStore';
import { appTheme } from '../../theme';

function formatCurrency(value: number) {
  return `R ${value.toLocaleString()}`;
}

export function CartScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);

  const cartIds = new Set(items.map((item) => item.id));
  const recommendedProducts = MARKETPLACE_PRODUCTS.filter((product) => !cartIds.has(product.id)).slice(0, 4);
  const recommendedPackages = PACKAGES.filter((pkg) => !cartIds.has(pkg.id)).slice(0, 2);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const increaseQty = (item: CartLine) => {
    addItem({ id: item.id, name: item.name, price: item.price, type: item.type });
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#24b8b8" />
        </Pressable>
        <Text style={styles.headerTitle}>My Cart</Text>
        <View style={styles.decorIcon}>
          <Ionicons name="cart" size={20} color="#24b8b8" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 36 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Items selected</Text>
          <Text style={styles.summaryValue}>{totalItems}</Text>
          <Text style={styles.summaryLabel}>Cart total</Text>
          <Text style={styles.summaryTotal}>{formatCurrency(totalAmount)}</Text>
          {items.length ? (
            <Pressable style={styles.clearBtn} onPress={clearCart}>
              <Text style={styles.clearBtnText}>Clear cart</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Selected items</Text>
        {items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="cart-outline" size={42} color="#89a3a3" />
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyBody}>Add accessories or packages to see them here.</Text>
            <Pressable style={styles.shopBtn} onPress={() => navigation.navigate(ROUTES.PACKAGES)}>
              <Text style={styles.shopBtnText}>Go to marketplace</Text>
            </Pressable>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemTextWrap}>
                <Text style={styles.itemType}>{item.type === 'franchise' ? 'Package' : 'Accessory'}</Text>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
              </View>

              <View style={styles.qtyControls}>
                <Pressable style={styles.qtyBtn} onPress={() => removeItem(item.id)}>
                  <Ionicons name="remove" size={16} color="#0f6464" />
                </Pressable>
                <Text style={styles.qtyValue}>{item.quantity}</Text>
                <Pressable style={styles.qtyBtn} onPress={() => increaseQty(item)}>
                  <Ionicons name="add" size={16} color="#0f6464" />
                </Pressable>
              </View>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Recommended products</Text>
        <View style={styles.recommendedRow}>
          {recommendedProducts.map((product) => (
            <View key={product.id} style={styles.recommendedCard}>
              <Image
                source={require('../../assets/images/demoAccesories.jpg')}
                style={styles.recommendedImage}
                contentFit="cover"
              />
              <View style={styles.recommendedContent}>
                <Text numberOfLines={2} style={styles.recommendedName}>{product.name}</Text>
                <Text style={styles.recommendedPrice}>{formatCurrency(product.price)}</Text>
                <Pressable
                  style={styles.recommendedBtn}
                  onPress={() =>
                    addItem({ id: product.id, name: product.name, price: product.price, type: 'accessory' })
                  }
                >
                  <Text style={styles.recommendedBtnText}>Add</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Recommended packages</Text>
        <View style={styles.packageColumn}>
          {recommendedPackages.map((pkg) => (
            <Pressable
              key={pkg.id}
              style={styles.packageCard}
              onPress={() => navigation.navigate(ROUTES.PACKAGE_DETAILS, { packageId: pkg.id })}
            >
              <Image source={pkg.imageSource} style={styles.packageImage} contentFit="cover" />
              <View style={styles.packageContent}>
                <Text style={styles.packageTitle}>{pkg.title}</Text>
                <Text style={styles.packagePrice}>{pkg.price}</Text>
                <Text style={styles.packageCta}>View package</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

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
  decorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(36,184,184,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: appTheme.spacing.md,
    rowGap: appTheme.spacing.md,
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.2)',
    backgroundColor: '#f7fdfd',
    padding: appTheme.spacing.md,
  },
  summaryLabel: {
    color: '#597575',
    fontSize: 12,
    marginTop: 4,
  },
  summaryValue: {
    color: '#123f3f',
    fontSize: 24,
    fontWeight: '800',
  },
  summaryTotal: {
    color: '#0f6464',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 2,
  },
  clearBtn: {
    marginTop: appTheme.spacing.sm,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#E63946',
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  clearBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#1a3f3f',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.2)',
    backgroundColor: '#f9fdfd',
    alignItems: 'center',
    paddingVertical: 26,
    paddingHorizontal: appTheme.spacing.md,
    rowGap: 8,
  },
  emptyTitle: {
    color: '#1a3f3f',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyBody: {
    color: '#5e7a7a',
    fontSize: 13,
    textAlign: 'center',
  },
  shopBtn: {
    marginTop: 6,
    borderRadius: 999,
    backgroundColor: '#24b8b8',
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  shopBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  itemCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.18)',
    backgroundColor: '#FFFFFF',
    padding: appTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTextWrap: {
    flex: 1,
    paddingRight: appTheme.spacing.sm,
  },
  itemType: {
    color: '#24b8b8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  itemName: {
    color: '#1a3f3f',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  itemPrice: {
    color: '#395f5f',
    fontSize: 13,
    marginTop: 4,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.26)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7fdfd',
  },
  qtyValue: {
    color: '#173f3f',
    fontSize: 14,
    fontWeight: '800',
    minWidth: 20,
    textAlign: 'center',
  },
  recommendedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: appTheme.spacing.sm,
  },
  recommendedCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.18)',
    backgroundColor: '#FFFFFF',
  },
  recommendedImage: {
    width: '100%',
    height: 110,
  },
  recommendedContent: {
    padding: appTheme.spacing.sm,
    rowGap: 6,
  },
  recommendedName: {
    color: '#1a3f3f',
    fontSize: 13,
    fontWeight: '700',
  },
  recommendedPrice: {
    color: '#0f6464',
    fontSize: 14,
    fontWeight: '800',
  },
  recommendedBtn: {
    marginTop: 2,
    borderRadius: 999,
    backgroundColor: '#24b8b8',
    paddingVertical: 7,
    alignItems: 'center',
  },
  recommendedBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  packageColumn: {
    rowGap: appTheme.spacing.sm,
  },
  packageCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.18)',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 124,
  },
  packageImage: {
    width: 120,
    height: '100%',
  },
  packageContent: {
    flex: 1,
    padding: appTheme.spacing.sm,
    justifyContent: 'center',
  },
  packageTitle: {
    color: '#1a3f3f',
    fontSize: 15,
    fontWeight: '800',
  },
  packagePrice: {
    color: '#0f6464',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  packageCta: {
    color: '#24b8b8',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
});
