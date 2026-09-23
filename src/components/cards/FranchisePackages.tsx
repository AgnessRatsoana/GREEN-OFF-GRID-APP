import { Ionicons } from '@expo/vector-icons';
import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useCallback, useState } from 'react';

import { RootStackParamList } from '../../navigation/types';
import {
  fetchMarketingPackages,
  type MarketingPackage,
} from '../../services/marketing/packages';
import { useFavouritesStore } from '../../store/favouritesStore';
import { appTheme } from '../../theme';
import type { AppTheme } from '../../theme';
import { useAppTheme } from '../../hooks/useAppTheme';

export function FranchisePackages() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const toggle = useFavouritesStore((s) => s.toggle);
  const favourites = useFavouritesStore((s) => s.favourites);

  const theme = useAppTheme();
  const styles = createStyles(theme);

  const [packages, setPackages] = useState<MarketingPackage[]>([]);
  const [loading, setLoading] = useState(true);

  const isFavourite = (id: string) => favourites.includes(id);

  const loadPackages = useCallback(async () => {
    try {
      setLoading(true);

      const data = await fetchMarketingPackages();

      setPackages(
        data.filter((item) => item.isActive),
      );
    } catch (error) {
      console.error('HOME PACKAGES LOAD ERROR:', error);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPackages();
    }, [loadPackages]),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Franchise Packages</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsRow}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="small"
              color={theme.colors.primaryAccent}
            />

            <Text style={styles.loadingText}>
              Loading packages...
            </Text>
          </View>
        ) : packages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              No franchise packages available.
            </Text>
          </View>
        ) : (
          packages.map((item) => {
            const isTeal = item.buttonVariant === 'teal';
            const saved = isFavourite(item.id);

            return (
              <Pressable
                key={item.id}
                style={styles.card}
                onPress={() =>
                  navigation.navigate('PackageDetails', {
                    packageId: item.id,
                  })
                }
              >
                {/* PACKAGE IMAGE */}
                <View style={styles.imageHalf}>
                  <Image
                    source={
                      item.imageUrl
                        ? { uri: item.imageUrl }
                        : require('../../assets/images/demoAccesories.jpg')
                    }
                    style={styles.image}
                    contentFit="cover"
                  />

                  {/* FAVOURITE BUTTON */}
                  <Pressable
                    style={[
                      styles.heartBtn,
                      saved && styles.heartBtnActive,
                    ]}
                    onPress={(event) => {
                      event.stopPropagation();
                      toggle(item.id);
                    }}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={
                        saved
                          ? 'heart'
                          : 'heart-outline'
                      }
                      size={16}
                      color={
                        saved
                          ? '#FFFFFF'
                          : '#b89aff'
                      }
                    />
                  </Pressable>
                </View>

                {/* PACKAGE CONTENT */}
                <View style={styles.contentHalf}>
                  <Text style={styles.packageTitle}>
                    {item.title}
                  </Text>

                  {/* PACKAGE BULLETS */}
                  {item.bullets?.length > 0 && (
                    <View style={styles.bulletList}>
                      {item.bullets.map(
                        (bullet, index) => (
                          <Text
                            key={`${item.id}-bullet-${index}`}
                            style={styles.bulletText}
                          >
                            - {bullet}
                          </Text>
                        ),
                      )}
                    </View>
                  )}

                  {/* RATING */}
                  <View style={styles.ratingRow}>
                    <Ionicons
                      name="star"
                      size={12}
                      color="#F4C542"
                    />

                    <Text style={styles.ratingText}>
                      {item.rating}
                    </Text>
                  </View>

                  {/* PRICE LABEL */}
                  <Text style={styles.fromText}>
                    From
                  </Text>

                  {/* PRICE */}
                  <Text style={styles.priceText}>
                    R {Number(item.price).toLocaleString()}
                  </Text>

                  {/* ACTION BUTTON */}
                  <View
                    style={[
                      styles.button,
                      isTeal
                        ? styles.tealButton
                        : styles.purpleButton,
                    ]}
                  >
                    <Text style={styles.buttonText}>
                      {item.buttonLabel}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      marginTop: appTheme.spacing.xl,
    },

    title: {
      color: theme.colors.textPrimary,
      fontSize: 26,
      lineHeight: 32,
      fontWeight: '800',
    },

    cardsRow: {
      paddingTop: appTheme.spacing.md,
      paddingBottom: appTheme.spacing.xs,
    },

    loadingContainer: {
      minWidth: 280,
      minHeight: 180,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: appTheme.spacing.md,
    },

    loadingText: {
      marginTop: 8,
      color: theme.colors.textSecondary,
      fontSize: 13,
      textAlign: 'center',
    },

    card: {
      width: 280,
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
      marginRight: appTheme.spacing.md,
    },

    imageHalf: {
      height: 160,
      width: '100%',
      position: 'relative',
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
      color: theme.colors.textPrimary,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '800',
    },

    bulletList: {
      marginTop: appTheme.spacing.sm,
      rowGap: 4,
    },

    bulletText: {
      color: theme.colors.textPrimary,
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
      color: theme.colors.textPrimary,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600',
    },

    fromText: {
      marginTop: 2,
      color: theme.colors.textSecondary,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '400',
    },

    priceText: {
      marginTop: 2,
      color: theme.colors.textPrimary,
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
      backgroundColor: theme.colors.primaryAccent,
    },

    purpleButton: {
      backgroundColor: theme.colors.supportPurple,
    },

    buttonText: {
      color: '#FFFFFF',
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '700',
      textAlign: 'center',
    },
  });