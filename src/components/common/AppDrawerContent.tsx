import { Ionicons } from '@expo/vector-icons';
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { ROUTES } from '../../constants/routes';
import { logoutFromSupabase } from '../../services/auth/authActions';
import { clearAuthTokens } from '../../services/storage/secureStore';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import { appTheme } from '../../theme';

export function AppDrawerContent({ navigation }: DrawerContentComponentProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const themeMode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const theme = useAppTheme();
  const isDark = themeMode === 'dark';

    const menuItems = [
      { key: ROUTES.HOME, label: 'Home', icon: 'home-outline' as const },
      { key: ROUTES.PROFILE, label: 'Profile', icon: 'person-outline' as const },
      { key: ROUTES.MESSAGES, label: 'Messages', icon: 'chatbubble-ellipses-outline' as const },
      { key: ROUTES.ORDERS, label: 'My Orders', icon: 'cube-outline' as const },
      { key: ROUTES.PACKAGES, label: 'Marketplace', icon: 'storefront-outline' as const },
      { key: ROUTES.RETAIL_OUTLET, label: 'Retail Outlet', icon: 'business-outline' as const },
      { key: ROUTES.FAVOURITES, label: 'Favourites', icon: 'heart-outline' as const },
    ];

  const handleLogout = async () => {
    try {
      await logoutFromSupabase();
    } catch {
      // Local session still needs to be cleared even if remote logout fails.
    } finally {
      await clearAuthTokens();
      clearSession();
      navigation.closeDrawer();
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <DrawerContentScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Menu</Text>

        <Pressable
          style={[styles.themeToggleRow, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
          onPress={toggleTheme}
        >
          <View style={styles.themeToggleLabelWrap}>
            <Ionicons
              name={isDark ? 'moon' : 'sunny'}
              size={18}
              color={theme.colors.primaryAccent}
            />
            <Text style={[styles.themeToggleLabel, { color: theme.colors.textPrimary }]}>
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#d7dede', true: theme.colors.primaryAccent }}
            thumbColor="#FFFFFF"
          />
        </Pressable>

        <View style={styles.menuList}>
          {menuItems.map((item) => {
            const isActive = navigation.getState().routeNames[navigation.getState().index] === item.key;

            return (
              <Pressable
                key={item.key}
                style={[styles.menuItem, isActive && styles.menuItemActive]}
                onPress={() => {
                    if (
                      item.key === ROUTES.PACKAGES ||
                    item.key === ROUTES.FAVOURITES ||
                    item.key === ROUTES.RETAIL_OUTLET
                    ) {
                    navigation.getParent()?.navigate(item.key as never);
                    navigation.closeDrawer();
                    return;
                  }

                  navigation.navigate(item.key as never);
                }}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={isActive ? theme.colors.primaryAccent : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.menuLabel,
                    { color: theme.colors.textSecondary },
                    isActive && [styles.menuLabelActive, { color: theme.colors.primaryAccent }],
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </DrawerContentScrollView>

      <View style={[styles.bottomSection, { borderTopColor: theme.colors.border }]}>
        {isAuthenticated && user ? (
          <>
            <View style={styles.profileRow}>
              <View style={styles.avatarWrap}>
                {user.avatarUrl ? (
                  <Image source={user.avatarUrl} style={styles.avatarImage} contentFit="cover" />
                ) : (
                  <Ionicons name="person" size={18} color={theme.colors.primaryAccent} />
                )}
              </View>

              <View style={styles.profileTextWrap}>
                <Text style={[styles.profileName, { color: theme.colors.textPrimary }]}>{user.name}</Text>
                <Text style={[styles.profileEmail, { color: theme.colors.textSecondary }]}>{user.email}</Text>
              </View>
            </View>

            <Pressable
              style={styles.secondaryButton}
              onPress={handleLogout}
            >
              <Text style={styles.secondaryButtonText}>Log Out</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              navigation.getParent()?.navigate(ROUTES.LOGIN as never);
              navigation.closeDrawer();
            }}
          >
            <Text style={styles.primaryButtonText}>Login</Text>
          </Pressable>
        )}

        {!isAuthenticated ? (
          <Pressable
            style={styles.ghostButton}
            onPress={() => {
              navigation.getParent()?.navigate(ROUTES.REGISTER as never);
              navigation.closeDrawer();
            }}
          >
            <Text style={styles.ghostButtonText}>Register</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  themeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: appTheme.spacing.sm,
    paddingHorizontal: appTheme.spacing.sm,
    marginBottom: appTheme.spacing.md,
  },
  themeToggleLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: appTheme.spacing.sm,
  },
  themeToggleLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    paddingTop: appTheme.spacing.md,
    paddingHorizontal: appTheme.spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#103f3f',
    marginBottom: appTheme.spacing.md,
  },
  menuList: {
    rowGap: appTheme.spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: appTheme.spacing.sm,
    paddingVertical: appTheme.spacing.sm,
    paddingHorizontal: appTheme.spacing.sm,
    borderRadius: 14,
  },
  menuItemActive: {
    backgroundColor: 'rgba(36, 184, 184, 0.14)',
  },
  menuLabel: {
    color: '#2a4a4a',
    fontSize: 15,
    fontWeight: '600',
  },
  menuLabelActive: {
    color: '#0f6464',
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(36, 184, 184, 0.2)',
    paddingHorizontal: appTheme.spacing.md,
    paddingTop: appTheme.spacing.md,
    paddingBottom: appTheme.spacing.lg,
    rowGap: appTheme.spacing.sm,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: appTheme.spacing.sm,
  },
  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(36, 184, 184, 0.35)',
    backgroundColor: '#eefcfc',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  profileTextWrap: {
    flex: 1,
  },
  profileName: {
    color: '#133f3f',
    fontSize: 15,
    fontWeight: '700',
  },
  profileEmail: {
    color: '#5c7575',
    fontSize: 12,
    marginTop: 2,
  },
  primaryButton: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: appTheme.spacing.sm,
    backgroundColor: '#24b8b8',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: appTheme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(36, 184, 184, 0.35)',
    backgroundColor: '#f5fdfd',
  },
  secondaryButtonText: {
    color: '#0f6464',
    fontSize: 15,
    fontWeight: '700',
  },
  ghostButton: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: appTheme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(184, 154, 255, 0.45)',
    backgroundColor: '#f9f5ff',
  },
  ghostButtonText: {
    color: '#7a5cb4',
    fontSize: 15,
    fontWeight: '700',
  },
});
