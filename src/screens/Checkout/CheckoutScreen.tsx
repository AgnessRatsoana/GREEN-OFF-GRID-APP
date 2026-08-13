import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import { RootStackParamList } from '../../navigation/types';
import { createYocoCheckout } from '../../services/payments/yoco';
import { useCartStore } from '../../store/cartStore';
import { appTheme } from '../../theme';

function formatCurrency(value: number) {
  return `R ${value.toLocaleString()}`;
}

const CHECKOUT_SUCCESS_URL = 'green-off-grid-mobile-app://checkout-success';
const CHECKOUT_CANCEL_URL = 'green-off-grid-mobile-app://checkout-cancel';

export function CheckoutScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const allItems = useCartStore((s) => s.items);
  const items = useMemo(() => allItems.filter((item) => item.type === 'accessory'), [allItems]);
  const clearCart = useCartStore((s) => s.clearCart);

  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const canSubmit = fullName.trim() && address.trim() && city.trim() && items.length > 0;

  const handlePay = async () => {
    if (!canSubmit || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const { orderId, redirectUrl } = await createYocoCheckout(
        items.map((item) => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
        CHECKOUT_SUCCESS_URL,
        CHECKOUT_CANCEL_URL,
      );

      const result = await WebBrowser.openAuthSessionAsync(redirectUrl, CHECKOUT_SUCCESS_URL);

      if (result.type === 'success') {
        clearCart();
        navigation.replace(ROUTES.ORDER_CONFIRMATION, { orderId });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to start payment. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + appTheme.spacing.md }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={appTheme.colors.primaryAccent} />
        </Pressable>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Accessories total ({totalItems} item{totalItems === 1 ? '' : 's'})</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalAmount)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Delivery details</Text>
        <View style={styles.formSection}>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full name"
            style={styles.input}
            placeholderTextColor="#7b8a8a"
          />
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Delivery address"
            style={styles.input}
            placeholderTextColor="#7b8a8a"
          />
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="City"
            style={styles.input}
            placeholderTextColor="#7b8a8a"
          />
        </View>

        <Text style={styles.sectionTitle}>Payment</Text>
        <View style={styles.formSection}>
          <View style={styles.yocoNotice}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#0f6464" />
            <Text style={styles.yocoNoticeText}>
              You'll securely enter your card details on Yoco's payment page. Green Off-Grid never sees or stores your card details.
            </Text>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </ScrollView>

      <Pressable style={[styles.payButton, !canSubmit && styles.payButtonDisabled]} onPress={handlePay} disabled={!canSubmit || isSubmitting}>
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.payButtonText}>Pay with Yoco · {formatCurrency(totalAmount)}</Text>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: appTheme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: appTheme.spacing.sm,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(36, 184, 184, 0.3)',
    backgroundColor: '#f4fcfc',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#123f3f',
  },
  headerSpacer: {
    width: 38,
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.2)',
    backgroundColor: '#f7fdfd',
    padding: appTheme.spacing.md,
    marginBottom: appTheme.spacing.md,
  },
  summaryLabel: {
    color: '#597575',
    fontSize: 12,
  },
  summaryValue: {
    color: '#0f6464',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#123f3f',
    marginBottom: appTheme.spacing.sm,
  },
  formSection: {
    rowGap: appTheme.spacing.sm,
    marginBottom: appTheme.spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(36, 184, 184, 0.24)',
    borderRadius: 16,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
    fontSize: 15,
    color: '#213232',
    backgroundColor: '#fbffff',
  },
  rowInputs: {
    flexDirection: 'row',
    columnGap: appTheme.spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  yocoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.2)',
    backgroundColor: '#f5fdfd',
    padding: appTheme.spacing.sm,
  },
  yocoNoticeText: {
    flex: 1,
    color: '#4f6e6e',
    fontSize: 13,
    lineHeight: 19,
  },
  errorText: {
    color: '#d14444',
    fontSize: 13,
  },
  payButton: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: appTheme.spacing.sm,
    backgroundColor: '#24b8b8',
    marginBottom: appTheme.spacing.md,
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
