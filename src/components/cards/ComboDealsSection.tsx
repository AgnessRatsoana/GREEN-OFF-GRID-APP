import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ROUTES } from '../../constants/routes';
import type { RootStackParamList } from '../../navigation/types';
import { fetchComboDeals, type ComboDeal } from '../../services/marketing/comboDeals';
import { appTheme } from '../../theme';
import { useAppTheme } from '../../hooks/useAppTheme';

export function ComboDealsSection() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useAppTheme();
  const [items, setItems] = useState<ComboDeal[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const deals = await fetchComboDeals();
        if (mounted) setItems(deals.slice(0, 3));
      } catch {
        if (mounted) setItems([]);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  if (!items.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Combo deals</Text>

      <View style={styles.grid}>
        {items.map((deal) => (
          <Pressable key={deal.id} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} onPress={() => navigation.navigate(ROUTES.COMBO_DEALS)}>
            <View style={styles.imageWrap}>
              <Image source={deal.imageUrl ? { uri: deal.imageUrl } : require('../../assets/images/demoAccesories.jpg')} style={styles.image} contentFit="cover" />
            </View>
            <View style={styles.body}>
              <Text style={[styles.name, { color: theme.colors.textPrimary }]} numberOfLines={2}>{deal.title}</Text>
              <Text style={[styles.price, { color: theme.colors.primaryAccent }]}>R {Number(deal.price).toLocaleString()}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: appTheme.spacing.xl },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '800', marginBottom: appTheme.spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  card: { width: '48%', borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  imageWrap: { height: 140 },
  image: { width: '100%', height: '100%' },
  body: { padding: 12 },
  name: { fontSize: 14, lineHeight: 18, fontWeight: '700' },
  price: { marginTop: 6, fontSize: 14, fontWeight: '800' },
});
