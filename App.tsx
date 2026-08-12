import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Linking } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GlobalFloatingBottomNav } from './src/components/common/GlobalFloatingBottomNav';
import { AppNavigation, navigationRef } from './src/navigation';
import { handleRecoveryUrl, hydrateCurrentSession } from './src/services/auth/authActions';
import { clearAuthTokens, saveAuthTokens } from './src/services/storage/secureStore';
import { useAuthStore } from './src/store/authStore';
import { appTheme } from './src/theme';

export default function App() {
  const [isHydrating, setIsHydrating] = useState(true);
  const [currentRouteName, setCurrentRouteName] = useState<string | undefined>();
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();

        if (initialUrl) {
          await handleRecoveryUrl(initialUrl);
        }

        const payload = await hydrateCurrentSession();

        if (payload) {
          await saveAuthTokens(payload.tokens);
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

    const subscription = Linking.addEventListener('url', async ({ url }) => {
      try {
        const handled = await handleRecoveryUrl(url);

        if (handled) {
          const payload = await hydrateCurrentSession();

          if (payload) {
            await saveAuthTokens(payload.tokens);
            setSession(payload);
          }
        }
      } catch {
        // Ignore malformed recovery links; navigation will still continue.
      }
    });

    bootstrapAuth();

    return () => {
      subscription.remove();
    };
  }, [clearSession, setSession]);

  if (isHydrating) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={appTheme.colors.primaryAccent} />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AppNavigation onRouteChange={setCurrentRouteName} />
        <GlobalFloatingBottomNav
          currentRouteName={currentRouteName}
          navigationRef={navigationRef}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appTheme.colors.background,
  },
});
