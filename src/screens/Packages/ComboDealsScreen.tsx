import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import type { RootStackParamList } from '../../navigation/types';
import { fetchComboDeals, type ComboDeal } from '../../services/marketing/comboDeals';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import { getBusinessPrice } from '../../utils/pricing';
import { appTheme, type AppTheme } from '../../theme';

export function ComboDealsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isBusiness = useAuthStore((s) => s.user?.accountType === 'business');
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const [items, setItems] = useState<ComboDeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const deals = await fetchComboDeals();
        if (mounted) setItems(deals);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.primaryAccent} />
        </Pressable>
        <Text style={styles.headerTitle}>Combo deals</Text>
        <View style={styles.iconWrap}>
          <Ionicons name="bag-outline" size={20} color={theme.colors.primaryAccent} />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.colors.primaryAccent} />
          <Text style={styles.loadingText}>Loading combo deals...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]} showsVerticalScrollIndicator={false}>
          {items.map((item) => {
            const isInCart = cartItems.some((entry) => entry.id === item.id);
            const price = isBusiness ? getBusinessPrice(item.price) : item.price;
            return (
              <Pressable
                key={item.id}
                style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={() => navigation.navigate(ROUTES.COMBO_DETAILS, { comboId: item.id })}
              >
                <View style={styles.imageWrap}>
                  <Image source={item.imageUrl ? { uri: item.imageUrl } : require('../../assets/images/demoAccesories.jpg')} style={styles.image} contentFit="cover" />
                </View>
                <View style={styles.body}>
                  <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{item.title}</Text>
                  <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{item.description}</Text>
                  <View style={styles.bulletsWrap}>
                    {item.bullets.slice(0, 3).map((bullet) => (
                      <Text key={bullet} style={[styles.bullet, { color: theme.colors.textSecondary }]}>• {bullet}</Text>
                    ))}
                  </View>
                  <View style={styles.bottomRow}>
                    <Text style={[styles.price, { color: theme.colors.primaryAccent }]}>R {Number(price).toLocaleString()}</Text>
                    <Pressable style={[styles.addButton, isInCart && styles.addButtonAdded]} onPress={() => addItem({ id: item.id, name: item.title, price: item.price, type: 'accessory', imageUrl: item.imageUrl })}>
                      <Text style={styles.addButtonText}>{isInCart ? 'Added' : 'Add'}</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: appTheme.spacing.md, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.background },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(36,184,184,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: appTheme.spacing.sm },
  headerTitle: { flex: 1, color: theme.colors.textPrimary, fontSize: 22, fontWeight: '800' },
  iconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(36,184,184,0.12)', alignItems: 'center', justifyContent: 'center' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: '700' },
  list: { padding: appTheme.spacing.md, rowGap: 14 },
  card: { borderWidth: 1, borderRadius: 18, overflow: 'hidden', backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
  imageWrap: { height: 180 },
  image: { width: '100%', height: '100%' },
  body: { padding: 14 },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '800', color: theme.colors.textPrimary },
  description: { marginTop: 6, fontSize: 12, lineHeight: 18, color: theme.colors.textSecondary },
  bulletsWrap: { marginTop: 8, gap: 4 },
  bullet: { fontSize: 12, lineHeight: 18, color: theme.colors.textSecondary },
  bottomRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 16, fontWeight: '800', color: theme.colors.primaryAccent },
  addButton: { backgroundColor: theme.colors.primaryAccent, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  addButtonAdded: { backgroundColor: '#0F6464' },
  addButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
