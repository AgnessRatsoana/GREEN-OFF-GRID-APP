import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddressMapPreview } from '../../components/maps/AddressMapPreview';
import { ROUTES } from '../../constants/routes';
import { RootStackParamList } from '../../navigation/types';
import { createOrder } from '../../services/orders/orders';
import { useAuthStore } from '../../store/authStore';
import { useCartStore, type CartLine } from '../../store/cartStore';
import { appTheme } from '../../theme';
import { getBusinessLineUnitPrice } from '../../utils/pricing';

function formatCurrency(value: number) {
  return `R ${value.toLocaleString()}`;
}

export function CheckoutScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const allItems = useCartStore((s) => s.items);
  const items = useMemo(() => allItems.filter((item) => item.type === 'accessory'), [allItems]);
  const clearCart = useCartStore((s) => s.clearCart);
  const isBusiness = useAuthStore((s) => s.user?.accountType === 'business');
  const user = useAuthStore((s) => s.user);

  const getUnitPrice = (item: CartLine) =>
    isBusiness ? getBusinessLineUnitPrice(item.price, item.quantity) : item.price;

  const [fullName, setFullName] = useState(user?.name ?? '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [bank, setBank] = useState('');
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [cardSaved, setCardSaved] = useState(false);
  const [bankModalVisible, setBankModalVisible] = useState(false);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + getUnitPrice(item) * item.quantity, 0);

  // Relaxed validation — just needs to be filled, not perfect.
  const addressLooksValid = address.trim().length > 0 && city.trim().length > 0;
  const cardValid =
    cardName.trim().length > 0 &&
    cardNumber.replace(/\s/g, '').length > 0 &&
    cardExpiry.trim().length > 0 &&
    cardCvc.trim().length > 0 &&
    bank.trim().length > 0;
  const canSubmit =
    Boolean(fullName.trim()) &&
    addressLooksValid &&
    addressConfirmed &&
    cardSaved &&
    items.length > 0;

  const BANKS = [
    'ABSA',
    'Capitec',
    'FNB',
    'Nedbank',
    'Standard Bank',
    'TymeBank',
    'Other',
  ];
  const mapQuery = [address.trim(), city.trim(), 'South Africa'].filter(Boolean).join(', ');

  const handleProcessOrder = async () => {
    if (!canSubmit || isSubmitting) {
      return;
    }

    // Immediate visible feedback so the user knows the tap registered.
    setIsSubmitting(true);
    setError(null);

    try {
      const order = await createOrder({
        customerName: fullName,
        deliveryAddress: address,
        deliveryCity: city,
        amountCents: Math.round(totalAmount * 100),
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: getUnitPrice(item),
          quantity: item.quantity,
          imageUrl: item.imageUrl ?? null,
        })),
      });

      clearCart();
      navigation.replace(ROUTES.ORDER_TRACKING, { orderId: order.id });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to place your order. Please try again.';
      console.error('PROCESS ORDER FAILED:', err);
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
            placeholder="Street address (e.g. 12 Main Road)"
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

          {address.trim().length > 0 && city.trim().length > 0 ? (
            <View>
              <AddressMapPreview query={mapQuery} />
              <View style={styles.mapHintRow}>
                <Pressable
                  style={styles.addressCheckboxRow}
                  onPress={() => setAddressConfirmed((prev) => !prev)}
                >
                  <Ionicons
                    name={addressConfirmed ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={addressConfirmed ? '#24b8b8' : '#9fb3b3'}
                  />
                  <Text style={styles.addressCheckboxText}>
                    Confirm the map shows your correct delivery location.
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.mapPlaceholder}>
              <Ionicons name="location-outline" size={22} color="#5d7676" />
              <Text style={styles.mapPlaceholderText}>
                Enter your street address and city to verify the delivery location on the map.
              </Text>
            </View>
          )}
        </View>

        {/* Payment — card only. Save/edit pattern keeps details private. */}
        <Text style={styles.sectionTitle}>Payment — Card</Text>
        <View style={styles.formSection}>
          {cardSaved ? (
            <View style={styles.savedCard}>
              <View style={styles.savedCardHeader}>
                <Ionicons name="card" size={20} color="#0f6464" />
                <View style={styles.savedCardInfo}>
                  <Text style={styles.savedCardBank}>{bank}</Text>
                  <Text style={styles.savedCardNumber}>
                    •••• {cardNumber.replace(/\s/g, '').slice(-4)}
                  </Text>
                  <Text style={styles.savedCardName}>{cardName}</Text>
                </View>
                <Pressable onPress={() => setCardSaved(false)} hitSlop={8}>
                  <Ionicons name="pencil" size={18} color="#24b8b8" />
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.bankPicker}>
                <Ionicons name="business-outline" size={18} color="#668080" />
                <Pressable
                  style={styles.bankPickerPressable}
                  onPress={() => setBankModalVisible(true)}
                >
                  <Text style={[styles.bankPickerText, !bank && styles.bankPickerPlaceholder]}>
                    {bank || 'Select your bank'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#668080" />
                </Pressable>
              </View>

              <TextInput
                value={cardName}
                onChangeText={setCardName}
                placeholder="Name on card"
                style={styles.input}
                placeholderTextColor="#7b8a8a"
              />
              <TextInput
                value={cardNumber}
                onChangeText={(text) => setCardNumber(text.replace(/[^0-9]/g, '').slice(0, 15))}
                placeholder="Card number"
                style={styles.input}
                placeholderTextColor="#7b8a8a"
                keyboardType="number-pad"
                maxLength={15}
              />
              <View style={styles.cardRow}>
                <TextInput
                  value={cardExpiry}
                  onChangeText={(text) => {
                    const digits = text.replace(/[^0-9]/g, '');
                    if (digits.length <= 2) {
                      setCardExpiry(digits);
                    } else if (digits.length <= 4) {
                      setCardExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`);
                    }
                  }}
                  placeholder="MM/YY"
                  style={[styles.input, styles.cardHalfInput]}
                  placeholderTextColor="#7b8a8a"
                  keyboardType="number-pad"
                  maxLength={5}
                />
                <TextInput
                  value={cardCvc}
                  onChangeText={(text) => setCardCvc(text.replace(/[^0-9]/g, '').slice(0, 3))}
                  placeholder="CVC"
                  style={[styles.input, styles.cardHalfInput]}
                  placeholderTextColor="#7b8a8a"
                  keyboardType="number-pad"
                  maxLength={3}
                  secureTextEntry
                />
              </View>
              <Pressable
                style={[styles.saveCardButton, !cardValid && styles.saveCardButtonDisabled]}
                onPress={() => cardValid && setCardSaved(true)}
                disabled={!cardValid}
              >
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                <Text style={styles.saveCardButtonText}>Save card</Text>
              </Pressable>
            </>
          )}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color="#d14444" />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      ) : null}

      {!canSubmit && !isSubmitting ? (
        <Text style={styles.submitHint}>
          {!fullName.trim()
            ? 'Enter your full name'
            : !addressLooksValid
              ? 'Enter your address and city'
              : !addressConfirmed
                ? 'Confirm the map shows your correct delivery location'
                : !cardSaved
                  ? 'Save your card details'
                  : items.length === 0
                    ? 'Your cart is empty'
                    : ''}
        </Text>
      ) : null}

      <Pressable
        style={[styles.payButton, !canSubmit && styles.payButtonDisabled, isSubmitting && styles.payButtonLoading]}
        onPress={handleProcessOrder}
        disabled={!canSubmit || isSubmitting}
      >
        {isSubmitting ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#FFFFFF" size="small" />
            <Text style={styles.payButtonText}>Placing order...</Text>
          </View>
        ) : (
          <Text style={styles.payButtonText}>Process order · {formatCurrency(totalAmount)}</Text>
        )}
      </Pressable>

      {/* Bank selection modal */}
      <Modal
        visible={bankModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBankModalVisible(false)}
      >
        <Pressable style={styles.bankModalBackdrop} onPress={() => setBankModalVisible(false)}>
          <View style={styles.bankModalCard}>
            <Text style={styles.bankModalTitle}>Select your bank</Text>
            {BANKS.map((bankName) => (
              <Pressable
                key={bankName}
                style={styles.bankModalOption}
                onPress={() => {
                  setBank(bankName);
                  setBankModalVisible(false);
                }}
              >
                <Text style={styles.bankModalOptionText}>{bankName}</Text>
                {bank === bankName ? (
                  <Ionicons name="checkmark-circle" size={18} color="#24b8b8" />
                ) : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
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
  mapHintRow: {
    marginTop: 10,
  },
  mapHintText: {
    flex: 1,
    color: '#178a6a',
    fontSize: 12,
    lineHeight: 17,
  },
  mapHintWarning: {
    color: '#8a6207',
  },
  mapPlaceholder: {
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(36,184,184,0.35)',
    backgroundColor: '#f7fdfd',
    padding: appTheme.spacing.md,
    alignItems: 'center',
    rowGap: 8,
  },
  mapPlaceholderText: {
    color: '#5d7676',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  errorText: {
    color: '#d14444',
    fontSize: 13,
  },
  cardRow: {
    flexDirection: 'row',
    columnGap: appTheme.spacing.sm,
  },
  cardHalfInput: {
    flex: 1,
  },
  cardHint: {
    color: '#8a6207',
    fontSize: 12,
    fontWeight: '600',
  },
  submitHint: {
    color: '#8a6207',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: appTheme.spacing.sm,
  },
  addressCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
    paddingVertical: 4,
  },
  addressCheckboxText: {
    flex: 1,
    color: '#4f6e6e',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  bankPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
    borderWidth: 1,
    borderColor: 'rgba(36, 184, 184, 0.24)',
    borderRadius: 16,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
    backgroundColor: '#fbffff',
  },
  bankPickerPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bankPickerText: {
    color: '#213232',
    fontSize: 15,
  },
  bankPickerPlaceholder: {
    color: '#7b8a8a',
  },
  bankModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  bankModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 320,
  },
  bankModalTitle: {
    color: '#123f3f',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  bankModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  bankModalOptionText: {
    color: '#213232',
    fontSize: 15,
  },
  savedCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.22)',
    backgroundColor: '#f0fbfb',
    padding: 12,
  },
  savedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
  },
  savedCardInfo: {
    flex: 1,
  },
  savedCardBank: {
    color: '#0f6464',
    fontSize: 13,
    fontWeight: '700',
  },
  savedCardNumber: {
    color: '#123f3f',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  savedCardName: {
    color: '#668080',
    fontSize: 12,
    marginTop: 2,
  },
  saveCardButton: {
    borderRadius: 12,
    backgroundColor: '#178a6a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 6,
    paddingVertical: 11,
  },
  saveCardButtonDisabled: {
    opacity: 0.45,
  },
  saveCardButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(209,68,68,0.35)',
    backgroundColor: '#fdeeee',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: appTheme.spacing.sm,
  },
  errorBannerText: {
    flex: 1,
    color: '#a83535',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
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
  payButtonLoading: {
    opacity: 0.8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
