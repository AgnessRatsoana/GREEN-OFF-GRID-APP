import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GlobalFloatingBottomNav } from './src/components/common/GlobalFloatingBottomNav';
import { ManagementFloatingBottomNav } from './src/components/common/ManagementFloatingBottomNav';
import {
  AppNavigation,
  navigationRef,
} from './src/navigation';
import {
  handleRecoveryUrl,
  hydrateCurrentSession,
} from './src/services/auth/authActions';
import {
  clearAuthTokens,
  saveAuthTokens,
} from './src/services/storage/secureStore';
import { useAuthStore } from './src/store/authStore';
import { useCartStore } from './src/store/cartStore';
import { useFavouritesStore } from './src/store/favouritesStore';
import { useThemeStore } from './src/store/themeStore';
import { appTheme } from './src/theme';
import { useAppTheme } from './src/hooks/useAppTheme';

export default function App() {
  const [isHydrating, setIsHydrating] =
    useState(true);

  const [currentRouteName, setCurrentRouteName] =
    useState<string | undefined>();

  const [isDrawerOpen, setIsDrawerOpen] =
    useState(false);

  const setSession =
    useAuthStore((s) => s.setSession);

  const clearSession =
    useAuthStore((s) => s.clearSession);
  const isAuthenticated =
    useAuthStore((s) => s.isAuthenticated);
  const userRole = useAuthStore((s) => s.user?.role);

  const hydrateFavourites =
    useFavouritesStore((s) => s.hydrate);
  const hydrateCart =
    useCartStore((s) => s.hydrate);
  const startCartExpiryWatcher =
    useCartStore((s) => s.startExpiryWatcher);
  const hydrateTheme =
    useThemeStore((s) => s.hydrate);
  const themeMode =
    useThemeStore((s) => s.mode);
  const theme = useAppTheme();

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        /*
         * HYDRATE FAVOURITES
         *
         * Loads saved favourites from AsyncStorage
         * when the application starts.
         */
        await hydrateFavourites();
        await hydrateCart();
        await hydrateTheme();

        /*
         * CHECK INITIAL URL
         *
         * Handles password recovery / deep links.
         */
        const initialUrl =
          await Linking.getInitialURL();

        if (initialUrl) {
          await handleRecoveryUrl(initialUrl);
        }

        /*
         * HYDRATE AUTH SESSION
         */
        const payload =
          await hydrateCurrentSession();

        if (payload) {
          await saveAuthTokens(
            payload.tokens
          );

          setSession(payload);
        } else {
          await clearAuthTokens();
          clearSession();
        }
      } catch {
        await clearAuthTokens();
        clearSession();
      } finally {
        setIsHydrating(false);
      }
    };

    /*
     * HANDLE DEEP LINKS WHILE APP IS RUNNING
     */
    const subscription =
      Linking.addEventListener(
        'url',
        async ({ url }) => {
          try {
            const handled =
              await handleRecoveryUrl(url);

            if (handled) {
              const payload =
                await hydrateCurrentSession();

              if (payload) {
                await saveAuthTokens(
                  payload.tokens
                );

                setSession(payload);
              }
            }
          } catch {
            // Ignore malformed recovery links;
            // navigation will still continue.
          }
        }
      );

    bootstrapAuth();

    const stopCartExpiryWatcher = startCartExpiryWatcher();

    return () => {
      subscription.remove();
      stopCartExpiryWatcher();
    };
  }, [
    clearSession,
    setSession,
    hydrateFavourites,
    hydrateCart,
    startCartExpiryWatcher,
    hydrateTheme,
  ]);

  /*
   * SHOW LOADING SCREEN WHILE
   * AUTH + FAVOURITES ARE HYDRATING
   */
  if (isHydrating) {
    return (
      <GestureHandlerRootView
        style={styles.container}
      >
        <SafeAreaProvider>
          <View style={[styles.loaderWrap, { backgroundColor: theme.colors.background }]}>
            <ActivityIndicator
              size="large"
              color={theme.colors.primaryAccent}
            />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  /*
   * MAIN APPLICATION
   */
  return (
    <GestureHandlerRootView
      style={styles.container}
    >
      <SafeAreaProvider>
        <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />

        <AppNavigation
          onRouteChange={
            setCurrentRouteName
          }
          onDrawerStateChange={
            setIsDrawerOpen
          }
        />

        {isAuthenticated ? (
          <GlobalFloatingBottomNav
            currentRouteName={
              currentRouteName
            }
            isHidden={isDrawerOpen}
            navigationRef={navigationRef}
          />
        ) : null}

        {isAuthenticated &&
        (userRole === 'admin' || userRole === 'marketing') ? (
          <ManagementFloatingBottomNav
            currentRouteName={currentRouteName}
            navigationRef={navigationRef}
            role={userRole}
          />
        ) : null}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      appTheme.colors.background,
  },

  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      appTheme.colors.background,
  },
});