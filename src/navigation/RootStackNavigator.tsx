import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ROUTES } from '../constants/routes';
import { AdminDashboardScreen } from '../screens/Admin/AdminDashboardScreen';
import { ForgotPasswordScreen } from '../screens/Authentication/ForgotPasswordScreen';
import { LoginScreen } from '../screens/Authentication/LoginScreen';
import { ResetPasswordScreen } from '../screens/Authentication/ResetPasswordScreen';
import { RegisterScreen } from '../screens/Authentication/RegisterScreen';
import { CartScreen } from '../screens/Cart/CartScreen';
import { FavouritesScreen } from '../screens/Favourites/FavouritesScreen';
import { PackageDetailsScreen } from '../screens/Packages/PackageDetailsScreen';
import { PackagesScreen } from '../screens/Packages/PackagesScreen';
import { ProductDetailsScreen } from '../screens/Packages/ProductDetailsScreen';
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
      <Stack.Screen
        name={ROUTES.LOGIN}
        component={LoginScreen}
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name={ROUTES.FORGOT_PASSWORD}
        component={ForgotPasswordScreen}
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name={ROUTES.RESET_PASSWORD}
        component={ResetPasswordScreen}
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name={ROUTES.REGISTER}
        component={RegisterScreen}
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name={ROUTES.ADMIN_DASHBOARD}
        component={AdminDashboardScreen}
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name={ROUTES.FAVOURITES}
        component={FavouritesScreen}
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name={ROUTES.CART}
        component={CartScreen}
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name={ROUTES.PACKAGES}
        component={PackagesScreen}
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name={ROUTES.PRODUCT_DETAILS}
        component={ProductDetailsScreen}
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name={ROUTES.PACKAGE_DETAILS}
        component={PackageDetailsScreen}
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
