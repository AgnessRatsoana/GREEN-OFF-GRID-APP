import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ROUTES } from '../../constants/routes';
import { MARKETPLACE_PRODUCTS } from '../../data/marketplace';
import { RootStackParamList } from '../../navigation/types';
import { useFavouritesStore } from '../../store/favouritesStore';
import { appTheme } from '../../theme';

const accessoryItems = MARKETPLACE_PRODUCTS.slice(8, 16);
const discountTags: Record<string, string> = {
  'product-09': '-12%',
  'product-12': '-25%',
  'product-15': '-18%',
};

export function AccessoriesShowcaseSection() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const toggle = useFavouritesStore((s) => s.toggle);
  const favourites = useFavouritesStore((s) => s.favourites);
  const isFavourite = (id: string) => favourites.includes(id);

  const openProduct = (productId: string) => {
    navigation.navigate(ROUTES.PACKAGES);
    setTimeout(() => {
      navigation.navigate(ROUTES.PRODUCT_DETAILS, { productId });
    }, 0);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Accessories Picks</Text>
          <Text style={styles.subtitle}>Reliable products for installs, upgrades and daily sales.</Text>
        </View>
        <View style={styles.pill}>
          <Ionicons name="flash" size={12} color="#24b8b8" />
          <Text style={styles.pillText}>Top 8</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {accessoryItems.map((item) => (
          <Pressable key={item.id} style={styles.card} onPress={() => openProduct(item.id)}>
            <Image source={require('../../assets/images/demoAccesories.jpg')} style={styles.image} contentFit="cover" />
            <View style={styles.cardOverlay} />

            <Pressable
              style={[styles.heartBtn, isFavourite(item.id) && styles.heartBtnActive]}
              onPress={(e) => {
                e.stopPropagation();
                toggle(item.id);
              }}
              hitSlop={8}
            >
              <Ionicons name={isFavourite(item.id) ? 'heart' : 'heart-outline'} size={16} color={isFavourite(item.id) ? '#FFFFFF' : '#b89aff'} />
            </Pressable>

            {discountTags[item.id] ? (
              <View style={styles.discountTag}>
                <Text style={styles.discountTagText}>{discountTags[item.id]}</Text>
              </View>
            ) : null}

            <View style={styles.cardBody}>
              <Text style={styles.category}>{item.category || 'General'}</Text>
              <Text numberOfLines={2} style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.price}>R {item.price.toLocaleString()}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: appTheme.spacing.xs,
  },
  headerRow: {
    marginBottom: appTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    columnGap: appTheme.spacing.sm,
  },
  title: {
    color: appTheme.colors.textPrimary,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
    maxWidth: 280,
    color: appTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  pill: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.3)',
    backgroundColor: 'rgba(36,184,184,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    columnGap: 4,
  },
  pillText: {
    color: '#24b8b8',
    fontSize: 11,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: appTheme.spacing.sm,
  },
  card: {
    width: '48%',
    height: 168,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#cfe4e4',
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.18)',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,41,41,0.26)',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#b89aff',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heartBtnActive: {
    backgroundColor: '#b89aff',
    borderColor: '#b89aff',
  },
  discountTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#E53935',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  category: {
    color: '#dbf8f8',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitle: {
    marginTop: 3,
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
  },
  price: {
    marginTop: 5,
    color: '#9ef0e8',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
  },
});
