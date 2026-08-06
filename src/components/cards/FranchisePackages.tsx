import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { appTheme } from '../../theme';

type PackageButtonVariant = 'teal' | 'purple';

interface PackageItem {
  id: string;
  title: string;
  imageSource: number;
  bullets: string[];
  price: string;
  rating: string;
  buttonLabel: string;
  buttonVariant: PackageButtonVariant;
}

const packageItems: PackageItem[] = [
  {
    id: 'empower-kit',
    title: 'EMPOWER KIT',
    imageSource: require('../../assets/images/franchise-outlet-2.jpeg'),
    bullets: [
      'Ideal for small businesses',
      'Complete off-grid kit',
      'Marketing support',
    ],
    price: 'R191 000',
    rating: '4.9',
    buttonLabel: 'Select Package',
    buttonVariant: 'teal',
  },
  {
    id: 'innovative-pro',
    title: 'INNOVATIVE PRO',
    imageSource: require('../../assets/images/innovative-pro.jpg'),
    bullets: [
      'Scalable for medium ventures',
      'Advanced energy management',
      'Full brand materials',
    ],
    price: 'R350 000',
    rating: '4.8',
    buttonLabel: 'Select Package',
    buttonVariant: 'purple',
  },
  {
    id: 'ultimate-network',
    title: 'ULTIMATE NETWORK',
    imageSource: require('../../assets/images/ultimate-network-franchise.jpg'),
    bullets: [
      'Multi-location operations',
      'Priority supply chain',
      'Custom territory rights',
    ],
    price: 'R800 000',
    rating: '5.0',
    buttonLabel: 'Contact a Franchise Expert',
    buttonVariant: 'purple',
  },
];

export function FranchisePackages() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Franchise Packages</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsRow}
      >
        {packageItems.map((item) => {
          const isTeal = item.buttonVariant === 'teal';

          return (
            <View
              key={item.id}
              style={styles.card}
            >
              <View style={styles.imageHalf}>
                <Image
                  source={item.imageSource}
                  style={styles.image}
                  contentFit="cover"
                />
              </View>

              <View style={styles.contentHalf}>
                <Text style={styles.packageTitle}>{item.title}</Text>

                <View style={styles.bulletList}>
                  {item.bullets.map((bullet) => {
                    return (
                      <Text
                        key={bullet}
                        style={styles.bulletText}
                      >
                        - {bullet}
                      </Text>
                    );
                  })}
                </View>

                <View style={styles.ratingRow}>
                  <Ionicons
                    name="star"
                    size={12}
                    color="#F4C542"
                  />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>

                <Text style={styles.fromText}>From</Text>
                <Text style={styles.priceText}>{item.price}</Text>

                <Pressable
                  style={[
                    styles.button,
                    isTeal ? styles.tealButton : styles.purpleButton,
                  ]}
                >
                  <Text style={styles.buttonText}>{item.buttonLabel}</Text>
                </Pressable>
              </View>
            </View>
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
