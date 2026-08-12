import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';

import { RootStackParamList } from './types';

import { RootStackNavigator } from './RootStackNavigator';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

interface AppNavigationProps {
  onRouteChange?: (routeName?: string) => void;
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

export function AppNavigation({ onRouteChange }: AppNavigationProps) {
  return (
    <NavigationContainer
      linking={linking}
      ref={navigationRef}
      onReady={() => {
        onRouteChange?.(navigationRef.getCurrentRoute()?.name);
      }}
      onStateChange={() => {
        onRouteChange?.(navigationRef.getCurrentRoute()?.name);
      }}
    >
      <RootStackNavigator />
    </NavigationContainer>
  );
}
