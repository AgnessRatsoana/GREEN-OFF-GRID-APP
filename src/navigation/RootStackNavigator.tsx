import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ROUTES } from '../constants/routes';
import { AppDrawerNavigator } from './AppDrawerNavigator';
import { ModalHostScreen } from './ModalHostScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={ROUTES.MAIN_DRAWER}
        component={AppDrawerNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.SYSTEM_MODAL}
        component={ModalHostScreen}
        options={{
          presentation: 'modal',
          headerTitle: 'System Modal',
        }}
      />
    </Stack.Navigator>
  );
}
