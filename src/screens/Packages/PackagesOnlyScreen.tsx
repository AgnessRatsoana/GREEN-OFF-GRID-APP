import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import type { RootStackParamList } from '../../navigation/types';
import { fetchMarketingPackages, type MarketingPackage } from '../../services/marketing/packages';
import { useAppTheme } from '../../hooks/useAppTheme';
import { appTheme, type AppTheme } from '../../theme';

export function PackagesOnlyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [items, setItems] = useState<MarketingPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchMarketingPackages();
        if (mounted) setItems(data.filter((item) => item.isActive));
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
        <Text style={styles.headerTitle}>Packages</Text>
        <View style={styles.iconWrap}>
          <Ionicons name="briefcase-outline" size={20} color={theme.colors.primaryAccent} />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.colors.primaryAccent} />
          <Text style={styles.loadingText}>Loading packages...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]} showsVerticalScrollIndicator={false}>
          {items.map((item) => (
            <Pressable key={item.id} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} onPress={() => navigation.navigate(ROUTES.PACKAGE_DETAILS, { packageId: item.id })}>
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
                <Text style={[styles.price, { color: theme.colors.primaryAccent }]}>From R {Number(item.price).toLocaleString()}</Text>
              </View>
            </Pressable>
          ))}
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
  price: { marginTop: 12, fontSize: 16, fontWeight: '800', color: theme.colors.primaryAccent },
});
