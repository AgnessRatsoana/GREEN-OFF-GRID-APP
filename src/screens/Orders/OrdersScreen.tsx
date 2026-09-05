import React, { useEffect, useState } from 'react';

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import { MARKETPLACE_PRODUCTS } from '../../data/marketplace';
import type { RootStackParamList } from '../../navigation/types';
import { fetchCustomerOrders, type TrackedOrder } from '../../services/orders/orders';
import { useCartStore } from '../../store/cartStore';
import { appTheme } from '../../theme';
import { FLOATING_NAV_CONTENT_INSET } from '../../components/common/FloatingBottomNav';

function formatCurrency(cents: number) {
  return `R ${(cents / 100).toLocaleString()}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function OrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const addItem = useCartStore((s) => s.addItem);

  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recommendedProducts = MARKETPLACE_PRODUCTS.slice(0, 6);

  const loadOrders = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      setErrorMessage(null);
      setOrders(await fetchCustomerOrders());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load your orders.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const getStatusLabel = (order: TrackedOrder) => {
    if (order.deliveredAt) return 'Delivered';
    if (order.dispatchedAt) return 'Dispatched';
    if (order.packagedAt) return 'Packaged';
    return 'Confirmed';
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#24b8b8" />
        </Pressable>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={styles.iconDecor}>
          <Ionicons name="cube-outline" size={22} color="#24b8b8" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + FLOATING_NAV_CONTENT_INSET }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadOrders(true)} tintColor="#24b8b8" />
        }
      >
        {isLoading ? <ActivityIndicator color="#24b8b8" style={{ marginTop: 20 }} /> : null}
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {!isLoading && !errorMessage && orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="cube-outline" size={42} color="#89a3a3" />
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptyBody}>Orders you place will appear here so you can track them.</Text>
            <Pressable style={styles.shopBtn} onPress={() => navigation.navigate(ROUTES.PACKAGES)}>
              <Text style={styles.shopBtnText}>Browse marketplace</Text>
            </Pressable>
          </View>
        ) : null}

        {orders.map((order) => (
          <Pressable
            key={order.id}
            style={styles.orderCard}
            onPress={() => navigation.navigate(ROUTES.ORDER_TRACKING, { orderId: order.id })}
          >
            <View style={styles.orderHeader}>
              <View style={styles.orderHeaderText}>
                <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>{getStatusLabel(order)}</Text>
              </View>
            </View>

            <Text style={styles.orderItems}>
              {order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s) ·{' '}
              {order.items[0]?.name ?? 'Order'}
              {order.items.length > 1 ? ` +${order.items.length - 1} more` : ''}
            </Text>

            <View style={styles.orderFooter}>
              <Text style={styles.orderTotal}>{formatCurrency(order.amountCents)}</Text>
              <View style={styles.trackRow}>
                <Text style={styles.trackText}>Track order</Text>
                <Ionicons name="chevron-forward" size={14} color="#0f6464" />
              </View>
            </View>
          </Pressable>
        ))}

        {/* Recommended products */}
        <Text style={styles.sectionTitle}>Recommended products</Text>
        <View style={styles.recommendGrid}>
          {recommendedProducts.map((product) => (
            <Pressable
              key={product.id}
              style={styles.recommendCard}
              onPress={() => navigation.navigate(ROUTES.PRODUCT_DETAILS, { productId: product.id })}
            >
              <Image
                source={require('../../assets/images/demoAccesories.jpg')}
                style={styles.recommendImage}
                contentFit="cover"
              />
              <View style={styles.recommendBody}>
                <Text numberOfLines={2} style={styles.recommendName}>{product.name}</Text>
                <Text style={styles.recommendPrice}>R {product.price.toLocaleString()}</Text>
                <Pressable
                  style={styles.recommendBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    addItem({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      type: 'accessory',
                    });
                  }}
                >
                  <Text style={styles.recommendBtnText}>Add</Text>
                </Pressable>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: appTheme.spacing.md,
    paddingBottom: 16,
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
  headerTitle: { flex: 1, color: '#1a3f3f', fontSize: 22, fontWeight: '800' },
  iconDecor: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(36,184,184,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: appTheme.spacing.md, rowGap: appTheme.spacing.sm },
  errorText: { color: '#b34040', textAlign: 'center', marginTop: 12 },
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
  emptyTitle: { color: '#1a3f3f', fontSize: 18, fontWeight: '700' },
  emptyBody: { color: '#5e7a7a', fontSize: 13, textAlign: 'center' },
  shopBtn: {
    marginTop: 6,
    borderRadius: 999,
    backgroundColor: '#24b8b8',
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  shopBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  orderCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.2)',
    backgroundColor: '#FFFFFF',
    padding: appTheme.spacing.md,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderHeaderText: { flex: 1, marginRight: 10 },
  orderNumber: { color: '#123f3f', fontSize: 15, fontWeight: '800' },
  orderDate: { color: '#668080', fontSize: 12, marginTop: 2 },
  statusPill: {
    borderRadius: 999,
    backgroundColor: 'rgba(36,184,184,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: { color: '#0f6464', fontSize: 11, fontWeight: '800' },
  orderItems: { color: '#4f6e6e', fontSize: 13, marginTop: 8 },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  orderTotal: { color: '#0f6464', fontSize: 15, fontWeight: '900' },
  trackRow: { flexDirection: 'row', alignItems: 'center', columnGap: 2 },
  trackText: { color: '#0f6464', fontSize: 12, fontWeight: '700' },
  sectionTitle: {
    color: '#1a3f3f',
    fontSize: 18,
    fontWeight: '800',
    marginTop: appTheme.spacing.md,
    marginBottom: 2,
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
  recommendImage: { width: '100%', height: 110, backgroundColor: '#eef6f6' },
  recommendBody: { padding: 10, rowGap: 6 },
  recommendName: { color: '#1a3f3f', fontSize: 13, fontWeight: '700', minHeight: 32 },
  recommendPrice: { color: '#0f6464', fontSize: 13, fontWeight: '800' },
  recommendBtn: {
    borderRadius: 999,
    backgroundColor: '#24b8b8',
    paddingVertical: 6,
    alignItems: 'center',
  },
  recommendBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
