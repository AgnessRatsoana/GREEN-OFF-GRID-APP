import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PACKAGES } from '../../data/packages';
import { RootStackParamList } from '../../navigation/types';
import { useFavouritesStore } from '../../store/favouritesStore';
import { appTheme } from '../../theme';

export function FranchisePackages() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const toggle = useFavouritesStore((s) => s.toggle);
  const favourites = useFavouritesStore((s) => s.favourites);
  const isFavourite = (id: string) => favourites.includes(id);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Franchise Packages</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsRow}
      >
        {PACKAGES.map((item) => {
          const isTeal = item.buttonVariant === 'teal';
          const saved = isFavourite(item.id);

          return (
            <Pressable
              key={item.id}
              style={styles.card}
              onPress={() => navigation.navigate('PackageDetails', { packageId: item.id })}
            >
              <View style={styles.imageHalf}>
                <Image
                  source={item.imageSource}
                  style={styles.image}
                  contentFit="cover"
                />
                <Pressable
                  style={[styles.heartBtn, saved && styles.heartBtnActive]}
                  onPress={(e) => {
                    e.stopPropagation();
                    toggle(item.id);
                  }}
                  hitSlop={8}
                >
                  <Ionicons
                    name={saved ? 'heart' : 'heart-outline'}
                    size={16}
                    color={saved ? '#FFFFFF' : '#b89aff'}
                  />
                </Pressable>
              </View>

              <View style={styles.contentHalf}>
                <Text style={styles.packageTitle}>{item.title}</Text>

                <View style={styles.bulletList}>
                  {item.bullets.map((bullet) => (
                    <Text key={bullet} style={styles.bulletText}>
                      - {bullet}
                    </Text>
                  ))}
                </View>

                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color="#F4C542" />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>

                <Text style={styles.fromText}>From</Text>
                <Text style={styles.priceText}>{item.price}</Text>

                <View
                  style={[
                    styles.button,
                    isTeal ? styles.tealButton : styles.purpleButton,
                  ]}
                >
                  <Text style={styles.buttonText}>{item.buttonLabel}</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: appTheme.spacing.xl,
  },
  title: {
    color: appTheme.colors.textPrimary,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
  },
  cardsRow: {
    paddingTop: appTheme.spacing.md,
    paddingBottom: appTheme.spacing.xs,
  },
  card: {
    width: 280,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginRight: appTheme.spacing.md,
  },
  imageHalf: {
    height: 160,
    width: '100%',
  },
  image: {
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
  contentHalf: {
    paddingHorizontal: appTheme.spacing.md,
    paddingTop: appTheme.spacing.md,
    paddingBottom: appTheme.spacing.md,
  },
  packageTitle: {
    color: '#111111',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  bulletList: {
    marginTop: appTheme.spacing.sm,
    rowGap: 4,
  },
  bulletText: {
    color: '#111111',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  ratingRow: {
    marginTop: appTheme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
  },
  ratingText: {
    color: '#111111',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  fromText: {
    marginTop: 2,
    color: '#C7C7C7',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400',
  },
  priceText: {
    marginTop: 2,
    color: '#111111',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
  },
  button: {
    marginTop: appTheme.spacing.sm,
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: appTheme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tealButton: {
    backgroundColor: '#24b8b8',
  },
  purpleButton: {
    backgroundColor: '#b89aff',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
