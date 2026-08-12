import { createDrawerNavigator } from '@react-navigation/drawer';

import { AppDrawerContent } from '../components/common/AppDrawerContent';
import { ROUTES } from '../constants/routes';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { MessagesScreen } from '../screens/Profile/MessagesScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { MainDrawerParamList } from './types';

const Drawer = createDrawerNavigator<MainDrawerParamList>();

export function AppDrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        overlayColor: 'rgba(0, 0, 0, 0.15)',
        drawerStyle: {
          width: '80%',
          backgroundColor: '#FFFFFF',
        },
      }}
    >
      <Drawer.Screen
        name={ROUTES.HOME}
        component={HomeScreen}
      />
      <Drawer.Screen
        name={ROUTES.PROFILE}
        component={ProfileScreen}
      />
      <Drawer.Screen
        name={ROUTES.MESSAGES}
        component={MessagesScreen}
      />
    </Drawer.Navigator>
  );
}
