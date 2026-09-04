import React, { useEffect, useState } from 'react';

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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

import { AddressMapPreview } from '../../components/maps/AddressMapPreview';
import type { RootStackParamList } from '../../navigation/types';
import {
  advanceOrderStatus,
  fetchMarketingOrders,
  type MarketingOrder,
  type OrderAdvanceAction,
} from '../../services/orders/orders';

function formatCurrency(cents: number) {
  return `R ${(cents / 100).toLocaleString()}`;
}

function formatDate(value: string | null): string {
  if (!value) return 'Pending';
  return new Date(value).toLocaleDateString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getStage(order: MarketingOrder) {
  if (order.deliveredAt) return 'delivered';
  if (order.dispatchedAt) return 'dispatched';
  if (order.packagedAt) return 'packaged';
  return 'confirmed';
}

const NEXT_ACTION: Record<string, { action: OrderAdvanceAction; label: string } | undefined> = {
  confirmed: { action: 'package', label: 'Mark packaged' },
  packaged: { action: 'dispatch', label: 'Mark dispatched' },
  dispatched: { action: 'deliver', label: 'Mark delivered' },
  delivered: undefined,
};

const STAGE_STEPS: Array<{ key: 'confirmed' | 'packaged' | 'dispatched' | 'delivered'; label: string; at: (order: MarketingOrder) => string | null }> = [
  { key: 'confirmed', label: 'Confirmed', at: (order) => order.confirmedAt },
  { key: 'packaged', label: 'Packaged', at: (order) => order.packagedAt },
  { key: 'dispatched', label: 'Dispatched', at: (order) => order.dispatchedAt },
  { key: 'delivered', label: 'Delivered', at: (order) => order.deliveredAt },
];

export function MarketingOrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const [orders, setOrders] = useState<MarketingOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'packaged' | 'dispatched' | 'delivered'>('all');

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter((order) => getStage(order) === statusFilter);

  const statusCounts = {
    all: orders.length,
    confirmed: orders.filter((o) => getStage(o) === 'confirmed').length,
    packaged: orders.filter((o) => getStage(o) === 'packaged').length,
    dispatched: orders.filter((o) => getStage(o) === 'dispatched').length,
    delivered: orders.filter((o) => getStage(o) === 'delivered').length,
  };

  const loadOrders = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      setErrorMessage(null);
      setOrders(await fetchMarketingOrders());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load orders.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleAdvance = async (order: MarketingOrder) => {
    const next = NEXT_ACTION[getStage(order)];
    if (!next || updatingOrderId) return;

    setUpdatingOrderId(order.id);
    try {
      const updated = await advanceOrderStatus(order.id, next.action);
      setOrders((previous) =>
        previous.map((entry) => (entry.id === order.id ? { ...entry, ...updated } : entry)),
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update order.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#24b8b8" />
        </Pressable>
        <View>
          <Text style={styles.title}>Orders</Text>
          <Text style={styles.subtitle}>Manage customer orders and fulfilment</Text>
        </View>
      </View>

      {/* Status filter tabs */}
      <View style={styles.tabsRow}>
        {(
          [
            { key: 'all', label: 'All' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'packaged', label: 'Packaged' },
            { key: 'dispatched', label: 'Dispatched' },
            { key: 'delivered', label: 'Delivered' },
          ] as const
        ).map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, statusFilter === tab.key && styles.tabActive]}
            onPress={() => setStatusFilter(tab.key)}
          >
            <Text style={[styles.tabText, statusFilter === tab.key && styles.tabTextActive]}>
              {tab.label} ({statusCounts[tab.key]})
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadOrders(true)} tintColor="#24b8b8" />
        }
      >
        {isLoading ? <ActivityIndicator color="#24b8b8" style={{ marginTop: 20 }} /> : null}
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {!isLoading && !errorMessage && filteredOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="cube-outline" size={42} color="#89a3a3" />
            <Text style={styles.emptyTitle}>
              {statusFilter === 'all' ? 'No orders yet' : `No ${statusFilter} orders`}
            </Text>
            <Text style={styles.emptyBody}>
              {statusFilter === 'all'
                ? 'Customer orders will appear here once placed.'
                : 'No orders with this status.'}
            </Text>
          </View>
        ) : null}

        {filteredOrders.map((order) => {
          const stage = getStage(order);
          const next = NEXT_ACTION[stage];
          const isUpdating = updatingOrderId === order.id;
          const mapQuery = [order.deliveryAddress, order.deliveryCity, 'South Africa']
            .filter(Boolean)
            .join(', ');

          return (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderHeaderText}>
                  <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                  <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                </View>
                <View style={[styles.stagePill, stage === 'delivered' && styles.stagePillDone]}>
                  <Text style={styles.stagePillText}>{stage.toUpperCase()}</Text>
                </View>
              </View>

              {/* Customer profile */}
              <View style={styles.customerCard}>
                <View style={styles.avatarWrap}>
                  <Ionicons name="person" size={16} color="#0f6464" />
                </View>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>
                    {order.customerName ?? 'Customer'}
                    {order.businessName ? ` · ${order.businessName}` : ''}
                  </Text>
                  <Text style={styles.customerMeta}>
                    {[
                      order.customerEmail,
                      order.customerPhone,
                      order.accountType ? `${order.accountType} account` : null,
                    ]
                      .filter(Boolean)
                      .join('  ·  ')}
                  </Text>
                  <Text style={styles.customerAddress}>
                    {[order.deliveryAddress, order.deliveryCity].filter(Boolean).join(', ')}
                  </Text>
                </View>
              </View>

              {/* Items */}
              <View style={styles.itemsList}>
                {order.items.map((item, index) => (
                  <View
                    key={`${item.id}-${index}`}
                    style={[styles.itemRow, index < order.items.length - 1 && styles.itemRowBorder]}
                  >
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.itemQty}>× {item.quantity}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatCurrency(order.amountCents)}</Text>
              </View>

              {/* Stage timeline */}
              <View style={styles.stagesRow}>
                {STAGE_STEPS.map((step) => {
                  const reached = Boolean(step.at(order));
                  return (
                    <View key={step.key} style={styles.stageChipWrap}>
                      <View style={[styles.stageChip, reached && styles.stageChipReached]}>
                        <Text style={[styles.stageChipText, reached && styles.stageChipTextReached]}>
                          {step.label}
                        </Text>
                      </View>
                      <Text style={styles.stageChipDate}>{reached ? formatDate(step.at(order)) : '—'}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Delivery map */}
              {order.deliveryAddress ? (
                <AddressMapPreview query={mapQuery} style={styles.map} />
              ) : null}

              {/* Advance action */}
              {next ? (
                <Pressable
                  style={[styles.actionButton, isUpdating && styles.actionButtonDisabled]}
                  onPress={() => handleAdvance(order)}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.actionButtonText}>{next.label}</Text>
                      <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                    </>
                  )}
                </Pressable>
              ) : (
                <View style={styles.deliveredNote}>
                  <Ionicons name="checkmark-done" size={15} color="#178a6a" />
                  <Text style={styles.deliveredNoteText}>Order delivered</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(36,184,184,0.18)',
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  title: { color: '#123f3f', fontSize: 21, fontWeight: '800' },
  subtitle: { color: '#668080', fontSize: 12, marginTop: 2 },
  content: { padding: 18, rowGap: 14 },
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 8,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 4,
  },
  tab: {
    borderRadius: 999,
    backgroundColor: '#eef3f3',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tabActive: {
    backgroundColor: '#24b8b8',
  },
  tabText: {
    color: '#668080',
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  errorText: { color: '#b34040', textAlign: 'center', marginTop: 12 },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.2)',
    backgroundColor: '#f9fdfd',
    alignItems: 'center',
    paddingVertical: 26,
    rowGap: 8,
  },
  emptyTitle: { color: '#1a3f3f', fontSize: 18, fontWeight: '700' },
  emptyBody: { color: '#5e7a7a', fontSize: 13 },
  orderCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.2)',
    backgroundColor: '#FFFFFF',
    padding: 14,
    rowGap: 10,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderHeaderText: { flex: 1, marginRight: 10 },
  orderNumber: { color: '#123f3f', fontSize: 15, fontWeight: '800' },
  orderDate: { color: '#668080', fontSize: 12, marginTop: 2 },
  stagePill: {
    borderRadius: 999,
    backgroundColor: 'rgba(36,184,184,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stagePillDone: { backgroundColor: 'rgba(23,138,106,0.18)' },
  stagePillText: { color: '#0f6464', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  customerCard: {
    flexDirection: 'row',
    columnGap: 10,
    borderRadius: 12,
    backgroundColor: '#f7fdfd',
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.16)',
    padding: 10,
  },
  avatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(36,184,184,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInfo: { flex: 1 },
  customerName: { color: '#123f3f', fontSize: 14, fontWeight: '800' },
  customerMeta: { color: '#668080', fontSize: 11, marginTop: 2 },
  customerAddress: { color: '#4f6e6e', fontSize: 12, marginTop: 4 },
  itemsList: {
    borderRadius: 10,
    backgroundColor: '#fbfdfd',
    paddingHorizontal: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    columnGap: 10,
  },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(36,184,184,0.1)' },
  itemName: { flex: 1, color: '#123f3f', fontSize: 13, fontWeight: '600' },
  itemQty: { color: '#668080', fontSize: 12, fontWeight: '700' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { color: '#597575', fontSize: 13 },
  totalValue: { color: '#0f6464', fontSize: 16, fontWeight: '900' },
  stagesRow: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, columnGap: 6 },
  stageChipWrap: { alignItems: 'center' },
  stageChip: {
    borderRadius: 999,
    backgroundColor: '#eef3f3',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  stageChipReached: { backgroundColor: '#24b8b8' },
  stageChipText: { color: '#7a9494', fontSize: 10, fontWeight: '700' },
  stageChipTextReached: { color: '#FFFFFF' },
  stageChipDate: { color: '#8aa0a0', fontSize: 9, marginTop: 3 },
  map: { height: 160 },
  actionButton: {
    borderRadius: 12,
    backgroundColor: '#24b8b8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 8,
    paddingVertical: 11,
  },
  actionButtonDisabled: { opacity: 0.55 },
  actionButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  deliveredNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 6,
    paddingVertical: 8,
  },
  deliveredNoteText: { color: '#178a6a', fontSize: 13, fontWeight: '700' },
});
