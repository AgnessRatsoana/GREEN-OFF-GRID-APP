import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import { RootStackParamList } from '../../navigation/types';
import {
  fetchViewerUnreadTotal,
  subscribeToEnquiryActivity,
} from '../../services/applications/enquiries';
import { useAuthStore } from '../../store/authStore';
import { useMessagingStore } from '../../store/messagingStore';
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

function getActiveKey(routeName?: string): 'home' | 'saved' | 'notifications' | 'packages' {
  if (routeName === ROUTES.FAVOURITES) {
    return 'saved';
  }

  if (routeName === ROUTES.MESSAGES) {
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
  const unreadCount = useMessagingStore((state) => state.unreadCount);
  const setUnreadCount = useMessagingStore((state) => state.setUnreadCount);

  // Initial unread total plus live updates whenever a message is inserted.
  // RLS restricts these events to conversations the signed-in user may see.
  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    let disposed = false;
    const refreshUnread = () => {
      fetchViewerUnreadTotal()
        .then((total) => {
          if (!disposed) setUnreadCount(total);
        })
        .catch(() => undefined);
    };

    refreshUnread();
    const unsubscribe = subscribeToEnquiryActivity(refreshUnread);

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, [userId, setUnreadCount]);

  if (!currentRouteName || isHidden) {
    return null;
  }

  if ([...HIDDEN_ROUTE_NAMES].includes(currentRouteName as string)) {
    return null;
  }

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <FloatingBottomNav
        activeKey={getActiveKey(currentRouteName)}
        badgeCounts={{ notifications: unreadCount }}
        onTabPress={(key) => {
          if (!navigationRef.isReady()) {
            return;
          }

          if (key === 'home') {
            navigationRef.navigate(ROUTES.MAIN_DRAWER, { screen: ROUTES.HOME } as never);
            return;
          }

          if (key === 'saved') {
            navigationRef.navigate(ROUTES.FAVOURITES);
            return;
          }

          if (key === 'notifications') {
            navigationRef.navigate(ROUTES.MAIN_DRAWER, { screen: ROUTES.MESSAGES } as never);
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
