import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import { RootStackParamList } from '../../navigation/types';
import { getOrderStatus, type OrderStatus } from '../../services/payments/yoco';
import { appTheme } from '../../theme';

export function OrderConfirmationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, typeof ROUTES.ORDER_CONFIRMATION>>();
  const insets = useSafeAreaInsets();

  const orderId = route.params?.orderId;
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadStatus() {
      if (!orderId) {
        return;
      }

      try {
        const result = await getOrderStatus(orderId);

        if (isMounted) {
          setStatus(result);
        }
      } catch {
        // The webhook may not have processed yet; status stays unknown until the user checks again.
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadStatus();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const isPaid = status === 'paid';
  const isFailed = status === 'failed' || status === 'cancelled';

  return (
    <View style={[styles.root, { paddingTop: insets.top + appTheme.spacing.xl, paddingBottom: insets.bottom + appTheme.spacing.md }]}>
      <View style={styles.iconWrap}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#24b8b8" />
        ) : (
          <Ionicons
            name={isFailed ? 'close-circle' : 'checkmark-circle'}
            size={64}
            color={isFailed ? '#d14444' : '#24b8b8'}
          />
        )}
      </View>

      <Text style={styles.title}>
        {isLoading ? 'Confirming payment...' : isFailed ? 'Payment not completed' : isPaid ? 'Order placed' : 'Payment processing'}
      </Text>
      <Text style={styles.subtitle}>
        {isFailed
          ? 'Your payment was not completed. You can try again from your cart.'
          : 'Thank you for your purchase. Green Off-Grid has recorded your order and will prepare it for delivery once payment is confirmed by Yoco.'}
      </Text>

      <Pressable style={styles.primaryButton} onPress={() => navigation.navigate(ROUTES.MAIN_DRAWER)}>
        <Text style={styles.primaryButtonText}>Back to home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: appTheme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    marginBottom: appTheme.spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#123f3f',
    marginBottom: appTheme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4f6e6e',
    textAlign: 'center',
    marginBottom: appTheme.spacing.lg,
  },
  primaryButton: {
    alignSelf: 'stretch',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: appTheme.spacing.sm,
    backgroundColor: '#24b8b8',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
