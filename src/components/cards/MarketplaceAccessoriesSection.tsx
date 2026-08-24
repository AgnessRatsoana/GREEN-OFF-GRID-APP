import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ROUTES } from '../../constants/routes';
import { MARKETPLACE_PRODUCTS } from '../../data/marketplace';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useFavouritesStore } from '../../store/favouritesStore';
import { appTheme } from '../../theme';
import { getBusinessPrice } from '../../utils/pricing';

const homeAccessories = MARKETPLACE_PRODUCTS.slice(0, 8);

export function MarketplaceAccessoriesSection() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isBusiness = useAuthStore((s) => s.user?.accountType === 'business');
  const addItem = useCartStore((s) => s.addItem);
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
      <Text style={styles.sectionLabel}>More Accessories</Text>
      <View style={styles.accessoriesRow}>
        {homeAccessories.map((item) => (
          <Pressable key={item.id} style={styles.accessoryCard} onPress={() => openProduct(item.id)}>
            <View style={styles.accessoryImageWrap}>
              <Image
                source={require('../../assets/images/demoAccesories.jpg')}
                style={styles.accessoryImage}
                contentFit="cover"
              />

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

              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={11} color="#F4C542" />
                <Text style={styles.ratingBadgeText}>4.8</Text>
              </View>
            </View>

            <View style={styles.accessoryContent}>
              <Text style={styles.productName}>{item.name}</Text>
              {item.description ? <Text style={styles.productDescription}>{item.description}</Text> : null}
              <Text style={styles.categoryText}>{item.category || 'General'}</Text>
              <View style={styles.cardFooter}>
                {isBusiness ? (
                  <View style={styles.priceRow}>
                    <Text style={styles.originalPriceStrike}>R {item.price.toLocaleString()}</Text>
                    <Text style={styles.priceText}>R {getBusinessPrice(item.price).toLocaleString()}</Text>
                  </View>
                ) : (
                  <Text style={styles.priceText}>R {item.price.toLocaleString()}</Text>
                )}
                <Pressable
                  style={styles.addButton}
                  onPress={(e) => {
                    e.stopPropagation();

                    if (isBusiness) {
                      openProduct(item.id);
                    } else {
                      addItem(
                        {
                          id: item.id,
                          name: item.name,
                          price: item.price,
                          type: 'accessory',
                        },
                        1
                      );
                    }
                  }}
                >
                  <Text style={styles.addButtonText}>
                    {isBusiness ? 'View' : 'Add'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: appTheme.spacing.xl,
  },
  sectionLabel: {
    color: '#1a3f3f',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    marginBottom: 10,
  },
  accessoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  accessoryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.18)',
  },
  accessoryImageWrap: {
    height: 160,
    width: '100%',
    position: 'relative',
  },
  accessoryImage: {
    width: '100%',
    height: '100%',
  },
  heartBtn: {
    position: 'absolute',
    top: 10,
    left: 10,
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
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ratingBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  accessoryContent: {
    padding: appTheme.spacing.md,
  },
  productName: {
    color: '#111111',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  productDescription: {
    color: '#5a7474',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  categoryText: {
    color: '#24b8b8',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  cardFooter: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceText: {
    color: '#111111',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
  },
  priceRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    rowGap: 2,
  },
  originalPriceStrike: {
    color: '#9fb1b1',
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  addButton: {
    borderRadius: 999,
    backgroundColor: '#24b8b8',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
});
