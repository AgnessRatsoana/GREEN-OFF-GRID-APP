import { NavigationContainer } from '@react-navigation/native';

import { RootStackNavigator } from './RootStackNavigator';

export function AppNavigation() {
  return (
    <NavigationContainer>
      <RootStackNavigator />
    </NavigationContainer>
  );
}
