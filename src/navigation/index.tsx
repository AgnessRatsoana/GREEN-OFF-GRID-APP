import { NavigationContainer, createNavigationContainerRef, type NavigationState, type PartialState } from '@react-navigation/native';

import { ROUTES } from '../constants/routes';
import { RootStackParamList } from './types';

import { RootStackNavigator } from './RootStackNavigator';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

interface AppNavigationProps {
  onRouteChange?: (routeName?: string) => void;
  onDrawerStateChange?: (isOpen: boolean) => void;
}

const linking = {
  prefixes: ['green-off-grid-mobile-app://'],
  config: {
    screens: {
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password',
      AdminDashboard: 'admin-dashboard',
    },
  },
};

type DrawerHistoryEntry = { type: 'route' | 'drawer'; status?: 'open' | 'closed' };

// Derives whether the nested drawer is open directly from navigation state, so every
// way of opening/closing it (buttons, swipe gestures, drawer content) is caught.
function isMainDrawerOpen(state: NavigationState | PartialState<NavigationState> | undefined): boolean {
  const mainDrawerRoute = state?.routes?.find((route) => route.name === ROUTES.MAIN_DRAWER);
  const drawerState = mainDrawerRoute?.state as { history?: DrawerHistoryEntry[] } | undefined;
  const history = drawerState?.history;

  if (!history) {
    return false;
  }

  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i].type === 'drawer') {
      return history[i].status === 'open';
    }
  }

  return false;
}

export function AppNavigation({ onRouteChange, onDrawerStateChange }: AppNavigationProps) {
  const reportState = () => {
    onRouteChange?.(navigationRef.getCurrentRoute()?.name);
    onDrawerStateChange?.(isMainDrawerOpen(navigationRef.getRootState()));
  };

  return (
    <NavigationContainer
      linking={linking}
      ref={navigationRef}
      onReady={reportState}
      onStateChange={reportState}
    >
      <RootStackNavigator />
    </NavigationContainer>
  );
}

