import { createDrawerNavigator } from '@react-navigation/drawer';

import { ROUTES } from '../constants/routes';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { MainDrawerParamList } from './types';

const Drawer = createDrawerNavigator<MainDrawerParamList>();

export function AppDrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Drawer.Screen
        name={ROUTES.HOME}
        component={HomeScreen}
      />
    </Drawer.Navigator>
  );
}
