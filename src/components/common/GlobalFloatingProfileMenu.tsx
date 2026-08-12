import { DrawerActions } from '@react-navigation/native';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { FloatingProfileMenuButton } from './FloatingProfileMenuButton';

type GlobalFloatingProfileMenuProps = {
  currentRouteName?: string;
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>;
};

export function GlobalFloatingProfileMenu({
  currentRouteName,
  navigationRef,
}: GlobalFloatingProfileMenuProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  if (!currentRouteName) {
    return null;
  }

  return (
    <View style={[styles.wrapper, { top: insets.top + 6 }]}>
      <View style={styles.row}>
        <FloatingProfileMenuButton
          onPress={() => {
            if (!navigationRef.isReady()) {
              return;
            }

            const activeRoute = navigationRef.getCurrentRoute()?.name as string | undefined;
            const isDrawerRoute =
              activeRoute === ROUTES.MAIN_DRAWER ||
              activeRoute === ROUTES.HOME ||
              activeRoute === ROUTES.PROFILE ||
              activeRoute === ROUTES.MESSAGES;

            if (isDrawerRoute) {
              navigationRef.dispatch(DrawerActions.openDrawer());
              return;
            }

            navigationRef.navigate(ROUTES.MAIN_DRAWER as never);
            setTimeout(() => {
              navigationRef.dispatch(DrawerActions.openDrawer());
            }, 140);
          }}
          profileImageUri={user?.avatarUrl || null}
        />

        <Image
          source={require('../../assets/images/Green-Off-Grid-Logo.jpg')}
          style={styles.logo}
          contentFit="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 50,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    width: 138,
    height: 50,
  },
});
