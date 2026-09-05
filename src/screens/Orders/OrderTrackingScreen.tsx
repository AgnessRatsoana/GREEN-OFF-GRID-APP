import React, { useCallback, useEffect, useState } from 'react';

import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddressMapPreview } from '../../components/maps/AddressMapPreview';
import { ROUTES } from '../../constants/routes';
import type { RootStackParamList } from '../../navigation/types';
import {
  getOrderById,
  subscribeToOrderUpdates,
  type TrackedOrder,
} from '../../services/orders/orders';
import { appTheme } from '../../theme';
import { FLOATING_NAV_CONTENT_INSET } from '../../components/common/FloatingBottomNav';

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

interface TimelineStep {
  key: 'confirmed' | 'packaged' | 'dispatched' | 'delivered';
  label: string;
  at: string | null;
  icon: keyof typeof Ionicons.glyphMap;
}

function buildTimeline(order: TrackedOrder): TimelineStep[] {
  return [
    { key: 'confirmed', label: 'Order confirmed', at: order.confirmedAt, icon: 'checkmark-circle' },
    { key: 'packaged', label: 'Packaged', at: order.packagedAt, icon: 'cube' },
    { key: 'dispatched', label: 'Order dispatched', at: order.dispatchedAt, icon: 'car' },
    { key: 'delivered', label: 'Delivery expected / delivered', at: order.deliveredAt, icon: 'home' },
  ];
}

export function OrderTrackingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, typeof ROUTES.ORDER_TRACKING>>();
  const insets = useSafeAreaInsets();

  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const orderId = route.params.orderId;

  const loadOrder = useCallback(async () => {
    try {
      setErrorMessage(null);
      setOrder(await getOrderById(orderId));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load this order.');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
    // Live timeline updates when marketing advances the order status.
    return subscribeToOrderUpdates(orderId, setOrder);
  }, [loadOrder, orderId]);

  const timeline = order ? buildTimeline(order) : [];
  const mapQuery = order
    ? [order.deliveryAddress, order.deliveryCity, 'South Africa'].filter(Boolean).join(', ')
    : '';

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerButton} hitSlop={8}>
          <Ionicons name="arrow-back" size={21} color="#1a3f3f" />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Track order</Text>
          {order ? <Text style={styles.headerSubtitle}>{order.orderNumber}</Text> : null}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loading}><ActivityIndicator color="#24b8b8" /></View>
      ) : errorMessage || !order ? (
        <View style={styles.loading}>
          <Text style={styles.errorText}>{errorMessage ?? 'Order not found.'}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + FLOATING_NAV_CONTENT_INSET }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Order summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Order number</Text>
              <Text style={styles.summaryValue}>{order.orderNumber}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Placed</Text>
              <Text style={styles.summaryValue}>{formatDate(order.createdAt)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryTotal}>{formatCurrency(order.amountCents)}</Text>
            </View>
          </View>

          {/* Ordered items */}
          <Text style={styles.sectionTitle}>Ordered items</Text>
          <View style={styles.itemsCard}>
            {order.items.map((item, index) => (
              <View
                key={`${item.id}-${index}`}
                style={[styles.itemRow, index < order.items.length - 1 && styles.itemRowBorder]}
              >
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.itemMeta}>
                    {item.quantity} × R {item.price.toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  R {(item.price * item.quantity).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>

          {/* Fulfilment timeline with left-edge progress tracker */}
          <Text style={styles.sectionTitle}>Order status</Text>
          <View style={styles.timelineCard}>
            {timeline.map((step, index) => {
              const reached = Boolean(step.at);
              const isLast = index === timeline.length - 1;
              return (
                <View key={step.key} style={styles.timelineRow}>
                  <View style={styles.trackerColumn}>
                    <View style={[styles.trackerDot, reached && styles.trackerDotReached]}>
                      <Ionicons
                        name={step.icon}
                        size={14}
                        color={reached ? '#FFFFFF' : '#9fb3b3'}
                      />
                    </View>
                    {!isLast ? (
                      <View style={[styles.trackerLine, reached && styles.trackerLineReached]} />
                    ) : null}
                  </View>
                  <View style={styles.timelineText}>
                    <Text style={[styles.timelineLabel, reached && styles.timelineLabelReached]}>
                      {step.label}
                    </Text>
                    <Text style={styles.timelineDate}>{formatDate(step.at)}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Delivery map */}
          <Text style={styles.sectionTitle}>Delivery location</Text>
          <AddressMapPreview query={mapQuery} />
          {order.deliveryAddress ? (
            <Text style={styles.addressText}>
              {order.deliveryAddress}, {order.deliveryCity}
            </Text>
          ) : null}
        </ScrollView>
      )}

      {/* Get help — opens an enquiry with this order attached */}
      {order ? (
        <Pressable
          style={[styles.helpButton, { bottom: insets.bottom + 20 }]}
          onPress={() =>
            navigation.navigate(ROUTES.ENQUIRY, {
              itemType: 'order',
              itemId: order.id,
            })
          }
        >
          <Ionicons name="chatbubble-ellipses" size={16} color="#FFFFFF" />
          <Text style={styles.helpButtonText}>Get help!</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: appTheme.spacing.md,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(36,184,184,0.18)',
  },
  headerButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, marginLeft: 4 },
  headerTitle: { color: '#1a3f3f', fontSize: 21, fontWeight: '800' },
  headerSubtitle: { color: '#668080', fontSize: 12, marginTop: 2 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#b34040', fontSize: 14, textAlign: 'center' },
  content: { padding: appTheme.spacing.md },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.2)',
    backgroundColor: '#f7fdfd',
    padding: appTheme.spacing.md,
    rowGap: 8,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: '#597575', fontSize: 13 },
  summaryValue: { color: '#123f3f', fontSize: 13, fontWeight: '700' },
  summaryTotal: { color: '#0f6464', fontSize: 18, fontWeight: '900' },
  sectionTitle: {
    color: '#1a3f3f',
    fontSize: 16,
    fontWeight: '800',
    marginTop: appTheme.spacing.md,
    marginBottom: appTheme.spacing.sm,
  },
  itemsCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.18)',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: appTheme.spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    columnGap: 12,
  },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(36,184,184,0.12)' },
  itemInfo: { flex: 1 },
  itemName: { color: '#123f3f', fontSize: 14, fontWeight: '700' },
  itemMeta: { color: '#668080', fontSize: 12, marginTop: 3 },
  itemTotal: { color: '#0f6464', fontSize: 14, fontWeight: '800' },
  timelineCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.18)',
    backgroundColor: '#FFFFFF',
    padding: appTheme.spacing.md,
  },
  timelineRow: { flexDirection: 'row', columnGap: 12 },
  trackerColumn: { alignItems: 'center', width: 26 },
  trackerDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e2eded',
  },
  trackerDotReached: { backgroundColor: '#24b8b8' },
  trackerLine: { flex: 1, width: 2, backgroundColor: '#e2eded', marginVertical: 2 },
  trackerLineReached: { backgroundColor: '#24b8b8' },
  timelineText: { flex: 1, paddingBottom: 18 },
  timelineLabel: { color: '#7a9494', fontSize: 14, fontWeight: '700' },
  timelineLabelReached: { color: '#123f3f' },
  timelineDate: { color: '#668080', fontSize: 12, marginTop: 2 },
  addressText: { color: '#4f6e6e', fontSize: 13, marginTop: 8 },
  helpButton: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    borderRadius: 999,
    backgroundColor: '#0f6464',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  helpButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
