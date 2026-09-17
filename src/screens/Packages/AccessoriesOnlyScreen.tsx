import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import type { RootStackParamList } from '../../navigation/types';
import { fetchMarketplaceProducts, type MarketplaceProduct } from '../../services/marketplace/marketplace';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useFavouritesStore } from '../../store/favouritesStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import { getBusinessPrice } from '../../utils/pricing';
import { appTheme, type AppTheme } from '../../theme';

export function AccessoriesOnlyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isBusiness = useAuthStore((s) => s.user?.accountType === 'business');
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  const favourites = useFavouritesStore((s) => s.favourites);
  const toggleFavourite = useFavouritesStore((s) => s.toggle);

  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchMarketplaceProducts();
        if (mounted) setProducts(data);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const categoryItems = products.filter((item) => item.category.toLowerCase() === 'accessories');
    if (!query) return categoryItems;
    return categoryItems.filter((item) =>
      item.name.toLowerCase().includes(query) ||
      item.brand.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query),
    );
  }, [products, search]);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.primaryAccent} />
        </Pressable>
        <Text style={styles.headerTitle}>Accessories</Text>
        <View style={styles.iconWrap}>
          <Ionicons name="cart-outline" size={20} color={theme.colors.primaryAccent} />
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Search accessories" placeholderTextColor={theme.colors.textSecondary} style={styles.searchInput} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.colors.primaryAccent} />
          <Text style={styles.loadingText}>Loading accessories...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]} showsVerticalScrollIndicator={false}>
          {filteredProducts.map((item) => {
            const saved = favourites.includes(item.id);
            const isInCart = cartItems.some((entry) => entry.id === item.id);
            const price = isBusiness ? getBusinessPrice(item.price) : item.price;

            return (
              <Pressable key={item.id} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} onPress={() => navigation.navigate(ROUTES.PRODUCT_DETAILS, { productId: item.id })}>
                <View style={styles.imageWrap}>
                  <Image source={item.imageUrl ? { uri: item.imageUrl } : require('../../assets/images/demoAccesories.jpg')} style={styles.image} contentFit="cover" />
                  <Pressable style={[styles.heartBtn, saved && styles.heartBtnActive]} onPress={(e) => { e.stopPropagation(); toggleFavourite(item.id); }}>
                    <Ionicons name={saved ? 'heart' : 'heart-outline'} size={15} color={saved ? '#FFFFFF' : '#b89aff'} />
                  </Pressable>
                </View>
                <View style={styles.content}>
                  <Text style={[styles.name, { color: theme.colors.textPrimary }]} numberOfLines={2}>{item.name}</Text>
                  <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>{item.category}</Text>
                  <View style={styles.bottomRow}>
                    <Text style={[styles.price, { color: theme.colors.primaryAccent }]}>R {Number(price).toLocaleString()}</Text>
                    <Pressable style={[styles.addButton, isInCart && styles.addButtonAdded]} onPress={(e) => { e.stopPropagation(); addItem({ id: item.id, name: item.name, price: item.price, type: 'accessory', imageUrl: item.imageUrl }); }}>
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
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, marginHorizontal: appTheme.spacing.md, marginTop: 12, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, color: theme.colors.textPrimary, fontSize: 14 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: '700' },
  list: { padding: appTheme.spacing.md, rowGap: 12 },
  card: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
  imageWrap: { height: 170, position: 'relative' },
  image: { width: '100%', height: '100%' },
  heartBtn: { position: 'absolute', right: 10, top: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  heartBtnActive: { backgroundColor: theme.colors.primaryAccent },
  content: { padding: 12 },
  name: { fontSize: 15, lineHeight: 20, fontWeight: '800', color: theme.colors.textPrimary },
  meta: { marginTop: 4, fontSize: 11, fontWeight: '600', color: theme.colors.textSecondary },
  bottomRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  price: { fontSize: 14, fontWeight: '800', color: theme.colors.primaryAccent },
  addButton: { backgroundColor: theme.colors.primaryAccent, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  addButtonAdded: { backgroundColor: '#0F6464' },
  addButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
