import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import { RootStackParamList } from '../../navigation/types';

import {
  subscribeToNotifications,
} from '../../services/notifications/notifications';

import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';

import { FloatingBottomNav } from './FloatingBottomNav';

type GlobalFloatingBottomNavProps = {
  currentRouteName?: string;
  isHidden?: boolean;
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>;
};

const HIDDEN_ROUTE_NAMES: Set<string> = new Set([
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  ROUTES.ADMIN_DASHBOARD,
  ROUTES.CHECKOUT,
  ROUTES.CART,
  ROUTES.ORDER_TRACKING,
]);

function getActiveKey(
  routeName?: string,
): 'home' | 'saved' | 'notifications' | 'packages' {
  if (routeName === ROUTES.FAVOURITES) {
    return 'saved';
  }

  if (routeName === ROUTES.NOTIFICATIONS) {
    return 'notifications';
  }

  if (routeName === ROUTES.PACKAGES || routeName === ROUTES.PACKAGE_DETAILS) {
    return 'packages';
  }

  return 'home';
}

export function GlobalFloatingBottomNav({
  currentRouteName,
  isHidden = false,
  navigationRef,
}: GlobalFloatingBottomNavProps) {
  const insets = useSafeAreaInsets();

  const userId = useAuthStore((state) => state.user?.id);
  const userRole = useAuthStore((state) => state.user?.role);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const unreadCount = useNotificationStore(
    (state) => state.unreadCount,
  );

  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );

  const refreshUnreadCount = useNotificationStore(
    (state) => state.refreshUnreadCount,
  );
  const loadNotifications = useNotificationStore(
    (state) => state.loadNotifications,
  );

  /*
   * Load the current unread notification count and listen for
   * new realtime notifications.
   */
  useEffect(() => {
    if (!userId) {
      return;
    }

    let disposed = false;

    loadNotifications().catch(() => undefined);
    refreshUnreadCount().catch(() => undefined);

    let unsubscribe: (() => void) | undefined;

    subscribeToNotifications((notification) => {
      if (disposed) {
        return;
      }

      addNotification(notification);
    })
      .then((cleanup) => {
        if (disposed) {
          cleanup();
          return;
        }

        unsubscribe = cleanup;
      })
      .catch(() => undefined);

    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [
    userId,
    refreshUnreadCount,
    loadNotifications,
    addNotification,
  ]);

  if (!isAuthenticated || !currentRouteName || isHidden) {
    return null;
  }

  if (userRole === 'admin' || userRole === 'marketing') {
    return null;
  }

  if ([...HIDDEN_ROUTE_NAMES].includes(currentRouteName)) {
    return null;
  }

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <FloatingBottomNav
        activeKey={getActiveKey(currentRouteName)}
        badgeCounts={{
          notifications: unreadCount,
        }}
        onTabPress={(key) => {
          if (!navigationRef.isReady()) {
            return;
          }

          if (key === 'home') {
            navigationRef.navigate(
              ROUTES.MAIN_DRAWER,
              { screen: ROUTES.HOME } as never,
            );
            return;
          }

          if (key === 'saved') {
            navigationRef.navigate(ROUTES.FAVOURITES);
            return;
          }

          if (key === 'notifications') {
            navigationRef.navigate(ROUTES.NOTIFICATIONS);
            return;
          }

          if (key === 'packages') {
            navigationRef.navigate(ROUTES.PACKAGES);
          }
        }}
      />

      <View style={{ height: insets.bottom }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 40,
  },
});