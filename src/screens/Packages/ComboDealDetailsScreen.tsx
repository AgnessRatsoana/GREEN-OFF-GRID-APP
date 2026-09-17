import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import { PACKAGES } from '../../data/packages';
import { RootStackParamList } from '../../navigation/types';
import { fetchComboDealById, fetchComboDeals, type ComboDeal } from '../../services/marketing/comboDeals';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { appTheme } from '../../theme';
import type { AppTheme } from '../../theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { FLOATING_NAV_CONTENT_INSET } from '../../components/common/FloatingBottomNav';
import { getBusinessPrice } from '../../utils/pricing';
import { ExpandableDescription } from '../../components/common/ExpandableDescription';

export function ComboDealDetailsScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<RouteProp<RootStackParamList, typeof ROUTES.COMBO_DETAILS>>();
    const insets = useSafeAreaInsets();
    const theme = useAppTheme();
    const styles = createStyles(theme);

    const isBusiness = useAuthStore((s) => s.user?.accountType === 'business');
    const addItem = useCartStore((s) => s.addItem);
    const cartItems = useCartStore((s) => s.items);

    const [combo, setCombo] = useState<ComboDeal | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [recommendedCombos, setRecommendedCombos] = useState<ComboDeal[]>([]);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const isInCart = combo ? cartItems.some((entry) => entry.id === combo.id) : false;

    useEffect(() => {
        let isMounted = true;

        const loadCombo = async () => {
            setIsLoading(true);

            try {
                const loaded = await fetchComboDealById(route.params.comboId);
                if (isMounted) {
                    setCombo(loaded);
                }
            } catch {
                if (isMounted) {
                    setCombo(null);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        void loadCombo();
        return () => {
            isMounted = false;
        };
    }, [route.params.comboId]);

    useEffect(() => {
        let isMounted = true;

        const loadRecommended = async () => {
            try {
                const deals = await fetchComboDeals();
                if (isMounted) {
                    setRecommendedCombos(deals.filter((item) => item.id !== route.params.comboId).slice(0, 4));
                }
            } catch {
                if (isMounted) {
                    setRecommendedCombos([]);
                }
            }
        };

        void loadRecommended();
        return () => {
            isMounted = false;
        };
    }, [route.params.comboId]);

    if (isLoading) {
        return (
            <View style={[styles.root, styles.centerWrap]}>
                <Text style={styles.errorText}>Loading combo deal...</Text>
            </View>
        );
    }

    if (!combo) {
        return (
            <View style={[styles.root, styles.centerWrap]}>
                <Text style={styles.errorText}>Combo deal not found.</Text>
            </View>
        );
    }

    const recommendedPackage = PACKAGES[0];
    const displayPrice = isBusiness ? getBusinessPrice(combo.price) : combo.price;
    const galleryImages = combo.images.length ? combo.images : combo.imageUrl ? [combo.imageUrl] : [];
    const heroWidth = Dimensions.get('window').width - appTheme.spacing.md * 2;

    return (
        <View style={styles.root}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
                    <Ionicons name="arrow-back" size={22} color={theme.colors.primaryAccent} />
                </Pressable>
                <Text style={styles.headerTitle}>Combo Details</Text>
            </View>

            <ScrollView
                contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + FLOATING_NAV_CONTENT_INSET }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.heroWrap}>
                    {galleryImages.length ? (
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            style={styles.heroScroll}
                            onMomentumScrollEnd={(e) => {
                                const index = Math.round(e.nativeEvent.contentOffset.x / heroWidth);
                                setActiveImageIndex(index);
                            }}
                        >
                            {galleryImages.map((uri) => (
                                <Image
                                    key={uri}
                                    source={{ uri }}
                                    style={[styles.heroImage, { width: heroWidth }]}
                                    contentFit="cover"
                                />
                            ))}
                        </ScrollView>
                    ) : (
                        <Image
                            source={require('../../assets/images/demoAccesories.jpg')}
                            style={styles.heroImage}
                            contentFit="cover"
                        />
                    )}

                    <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={11} color="#F4C542" />
                        <Text style={styles.ratingBadgeText}>{combo.rating.toFixed(1)}</Text>
                    </View>

                    {galleryImages.length > 1 ? (
                        <View style={styles.dotsRow}>
                            {galleryImages.map((uri, index) => (
                                <View key={uri} style={[styles.dot, index === activeImageIndex && styles.dotActive]} />
                            ))}
                        </View>
                    ) : null}
                </View>

                <Text style={styles.title}>{combo.title}</Text>

                <ExpandableDescription
                    text={combo.description}
                    textStyle={styles.description}
                />

                {combo.bullets.length ? (
                    <View style={styles.bulletsWrap}>
                        {combo.bullets.map((bullet) => (
                            <Text key={bullet} style={styles.bullet}>• {bullet}</Text>
                        ))}
                    </View>
                ) : null}

                {isBusiness ? (
                    <View style={styles.priceRow}>
                        <Text style={styles.originalPriceStrike}>R {combo.price.toLocaleString()}</Text>
                        <Text style={styles.priceText}>R {displayPrice.toLocaleString()}</Text>
                    </View>
                ) : (
                    <Text style={styles.priceText}>R {combo.price.toLocaleString()}</Text>
                )}

                <Pressable
                    style={[styles.addButton, isInCart && styles.addButtonAdded]}
                    onPress={() =>
                        addItem({
                            id: combo.id,
                            name: combo.title,
                            price: combo.price,
                            type: 'accessory',
                            imageUrl: combo.imageUrl,
                        })
                    }
                >
                    {isInCart ? <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" /> : null}
                    <Text style={styles.addButtonText}>{isInCart ? 'Added' : 'Add to Cart'}</Text>
                </Pressable>

                <Text style={styles.sectionTitle}>More combo deals</Text>
                <View style={styles.recommendGrid}>
                    {recommendedCombos.map((item) => (
                        <Pressable
                            key={item.id}
                            style={styles.recommendCard}
                            onPress={() => navigation.push(ROUTES.COMBO_DETAILS, { comboId: item.id })}
                        >
                            <View style={styles.recommendImageWrap}>
                                <Image
                                    source={item.imageUrl ? { uri: item.imageUrl } : require('../../assets/images/demoAccesories.jpg')}
                                    style={styles.recommendImage}
                                    contentFit="cover"
                                />
                            </View>
                            <View style={styles.recommendBody}>
                                <Text numberOfLines={2} style={styles.recommendName}>{item.title}</Text>
                                <Text style={styles.recommendPrice}>R {item.price.toLocaleString()}</Text>
                            </View>
                        </Pressable>
                    ))}
                </View>

                {recommendedPackage ? (
                    <>
                        <Text style={styles.sectionTitle}>Recommended package</Text>
                        <Pressable
                            style={styles.packageCard}
                            onPress={() => navigation.navigate(ROUTES.PACKAGE_DETAILS, { packageId: recommendedPackage.id })}
                        >
                            <Image source={recommendedPackage.imageSource} style={styles.packageImage} contentFit="cover" />
                            <View style={styles.packageBody}>
                                <Text style={styles.packageTitle}>{recommendedPackage.title}</Text>
                                <Text style={styles.packagePrice}>{recommendedPackage.price}</Text>
                            </View>
                        </Pressable>
                    </>
                ) : null}
            </ScrollView>
        </View>
    );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    centerWrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        color: theme.colors.textPrimary,
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: appTheme.spacing.md,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
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
        color: theme.colors.textPrimary,
        fontSize: 22,
        fontWeight: '800',
    },
    body: {
        padding: appTheme.spacing.md,
        rowGap: appTheme.spacing.sm,
    },
    heroWrap: {
        height: 220,
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
    },
    heroScroll: {
        height: 220,
    },
    heroImage: {
        width: '100%',
        height: 220,
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
    dotsRow: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        columnGap: 5,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    dotActive: {
        backgroundColor: '#FFFFFF',
        width: 16,
    },
    title: {
        color: theme.colors.textPrimary,
        fontSize: 24,
        lineHeight: 30,
        fontWeight: '800',
        marginTop: appTheme.spacing.sm,
    },
    description: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        lineHeight: 20,
        marginTop: 6,
    },
    bulletsWrap: {
        marginTop: 8,
        rowGap: 4,
    },
    bullet: {
        color: theme.colors.textSecondary,
        fontSize: 13,
        lineHeight: 19,
    },
    priceText: {
        color: theme.colors.textPrimary,
        fontSize: 28,
        lineHeight: 32,
        fontWeight: '900',
        marginTop: 6,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 8,
        marginTop: 6,
    },
    originalPriceStrike: {
        color: theme.colors.textSecondary,
        fontSize: 16,
        textDecorationLine: 'line-through',
    },
    addButton: {
        marginTop: 8,
        borderRadius: 999,
        backgroundColor: theme.colors.primaryAccent,
        paddingVertical: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        columnGap: 6,
    },
    addButtonAdded: {
        backgroundColor: '#178a6a',
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        lineHeight: 16,
        fontWeight: '700',
    },
    sectionTitle: {
        color: theme.colors.textPrimary,
        fontSize: 18,
        lineHeight: 24,
        fontWeight: '800',
        marginTop: appTheme.spacing.md,
        marginBottom: 4,
    },
    recommendGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: appTheme.spacing.sm,
    },
    recommendCard: {
        width: '48%',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    recommendImageWrap: {
        height: 110,
    },
    recommendImage: {
        width: '100%',
        height: '100%',
    },
    recommendBody: {
        padding: appTheme.spacing.sm,
    },
    recommendName: {
        color: theme.colors.textPrimary,
        fontSize: 13,
        lineHeight: 17,
        fontWeight: '700',
    },
    recommendPrice: {
        color: theme.colors.textPrimary,
        fontSize: 15,
        lineHeight: 20,
        fontWeight: '800',
        marginTop: 6,
    },
    packageCard: {
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    packageImage: {
        width: '100%',
        height: 180,
    },
    packageBody: {
        padding: appTheme.spacing.md,
    },
    packageTitle: {
        color: theme.colors.textPrimary,
        fontSize: 16,
        lineHeight: 21,
        fontWeight: '800',
    },
    packagePrice: {
        color: theme.colors.textPrimary,
        fontSize: 22,
        lineHeight: 28,
        fontWeight: '900',
        marginTop: 4,
    },
});
