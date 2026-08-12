import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import { MARKETPLACE_PRODUCTS } from '../../data/marketplace';
import { PACKAGES } from '../../data/packages';
import { RootStackParamList } from '../../navigation/types';
import { useFavouritesStore } from '../../store/favouritesStore';
import { appTheme } from '../../theme';

export function FavouritesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const favourites = useFavouritesStore((s) => s.favourites);
  const toggle = useFavouritesStore((s) => s.toggle);

  const savedPackages = PACKAGES.filter((p) => favourites.includes(p.id));
  const savedProducts = MARKETPLACE_PRODUCTS.filter((p) => favourites.includes(p.id));
  const totalSaved = savedPackages.length + savedProducts.length;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#b89aff" />
        </Pressable>
        <Text style={styles.headerTitle}>Favourites</Text>
        <View style={styles.heartDecor}>
          <Ionicons name="heart" size={22} color="#b89aff" />
        </View>
      </View>

      {totalSaved === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={72} color="#b89aff" style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No favourites yet</Text>
          <Text style={styles.emptyBody}>
            Tap the heart on any accessory or package to save it here.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.countLabel}>
            {totalSaved} {totalSaved === 1 ? 'item' : 'items'} saved
          </Text>

          {savedProducts.length ? <Text style={styles.groupTitle}>Accessories</Text> : null}
          {savedProducts.map((item) => {
            return (
              <Pressable
                key={item.id}
                style={styles.productCard}
                onPress={() => navigation.navigate(ROUTES.PRODUCT_DETAILS, { productId: item.id })}
              >
                <View style={styles.imageWrap}>
                  <Image source={require('../../assets/images/demoAccesories.jpg')} style={styles.image} contentFit="cover" />
                  <Pressable
                    style={styles.heartBtn}
                    onPress={(e) => { e.stopPropagation(); toggle(item.id); }}
                    hitSlop={8}
                  >
                    <Ionicons name="heart" size={16} color="#FFFFFF" />
                  </Pressable>
                </View>

                <View style={styles.content}>
                  <Text style={styles.packageTitle}>{item.name}</Text>
                  {item.description ? <Text style={styles.bulletText}>{item.description}</Text> : null}

                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#F4C542" />
                    <Text style={styles.ratingText}>4.8</Text>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.fromText}>Price </Text>
                    <Text style={styles.priceText}>R {item.price.toLocaleString()}</Text>
                  </View>

                  <View style={styles.tealBtn}>
                    <Text style={styles.btnText}>{item.category || 'General'}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}

          {savedPackages.length ? <Text style={styles.groupTitle}>Packages</Text> : null}
          {savedPackages.map((item) => {
            const isTeal = item.buttonVariant === 'teal';
            return (
              <Pressable
                key={item.id}
                style={styles.card}
                onPress={() => navigation.navigate(ROUTES.PACKAGE_DETAILS, { packageId: item.id })}
              >
                <View style={styles.imageWrap}>
                  <Image source={item.imageSource} style={styles.image} contentFit="cover" />
                  {/* Remove from favourites */}
                  <Pressable
                    style={styles.heartBtn}
                    onPress={(e) => { e.stopPropagation(); toggle(item.id); }}
                    hitSlop={8}
                  >
                    <Ionicons name="heart" size={16} color="#FFFFFF" />
                  </Pressable>
                </View>

                <View style={styles.content}>
                  <Text style={styles.packageTitle}>{item.title}</Text>

                  <View style={styles.bulletList}>
                    {item.bullets.map((b) => (
                      <Text key={b} style={styles.bulletText}>• {b}</Text>
                    ))}
                  </View>

                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#F4C542" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.fromText}>From </Text>
                    <Text style={styles.priceText}>{item.price}</Text>
                  </View>

                  <View style={[styles.btn, isTeal ? styles.tealBtn : styles.purpleBtn]}>
                    <Text style={styles.btnText}>{item.buttonLabel}</Text>
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: appTheme.spacing.md,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(36,184,184,0.18)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(36,184,184,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: appTheme.spacing.sm,
  },
  headerTitle: {
    flex: 1,
    color: '#1a3f3f',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heartDecor: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(184,154,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.6,
  },
  emptyTitle: {
    color: '#1a3f3f',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
  },
  emptyBody: {
    color: '#587474',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  list: {
    padding: appTheme.spacing.md,
    rowGap: appTheme.spacing.md,
  },
  countLabel: {
    color: '#5f7777',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  groupTitle: {
    color: '#24b8b8',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  productCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.2)',
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.2)',
  },
  imageWrap: {
    height: 180,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  heartBtn: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#b89aff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  content: {
    padding: appTheme.spacing.md,
  },
  packageTitle: {
    color: '#1a3f3f',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: appTheme.spacing.sm,
  },
  bulletList: {
    rowGap: 4,
    marginBottom: appTheme.spacing.sm,
  },
  bulletText: {
    color: '#547171',
    fontSize: 13,
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
    marginBottom: 6,
  },
  ratingText: {
    color: '#4d6a6a',
    fontSize: 12,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: appTheme.spacing.sm,
  },
  fromText: {
    color: '#6a8383',
    fontSize: 12,
  },
  priceText: {
    color: '#163e3e',
    fontSize: 20,
    fontWeight: '800',
  },
  btn: {
    borderRadius: 999,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tealBtn: {
    backgroundColor: '#24b8b8',
  },
  purpleBtn: {
    backgroundColor: '#b89aff',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
