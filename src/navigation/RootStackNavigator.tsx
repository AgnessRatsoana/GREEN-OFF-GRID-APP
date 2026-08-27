import { createNativeStackNavigator } from '@react-navigation/native-stack';


import { ROUTES } from '../constants/routes';

import { AdminDashboardScreen } from '../screens/Admin/AdminDashboardScreen';

import { ForgotPasswordScreen } from '../screens/Authentication/ForgotPasswordScreen';
import { LoginScreen } from '../screens/Authentication/LoginScreen';
import { ResetPasswordScreen } from '../screens/Authentication/ResetPasswordScreen';
import { RegisterScreen } from '../screens/Authentication/RegisterScreen';

import { ApplicationStatusScreen } from '../screens/Applications/ApplicationStatusScreen';
import { PackageApplicationScreen } from '../screens/Applications/PackageApplicationScreen';

import { CartScreen } from '../screens/Cart/CartScreen';
import { CheckoutScreen } from '../screens/Checkout/CheckoutScreen';
import { OrderConfirmationScreen } from '../screens/Checkout/OrderConfirmationScreen';

import { FavouritesScreen } from '../screens/Favourites/FavouritesScreen';

import { PackageDetailsScreen } from '../screens/Packages/PackageDetailsScreen';
import { PackagesScreen } from '../screens/Packages/PackagesScreen';
import { ProductDetailsScreen } from '../screens/Packages/ProductDetailsScreen';

import { RetailOutletScreen } from '../screens/RetailOutlet/RetailOutletScreen';

import { AppDrawerNavigator } from './AppDrawerNavigator';
import { ModalHostScreen } from './ModalHostScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.LOGIN}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* =========================
          AUTHENTICATION
      ========================== */}

      <Stack.Screen
        name={ROUTES.LOGIN}
        component={LoginScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      <Stack.Screen
        name={ROUTES.REGISTER}
        component={RegisterScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      <Stack.Screen
        name={ROUTES.FORGOT_PASSWORD}
        component={ForgotPasswordScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      <Stack.Screen
        name={ROUTES.RESET_PASSWORD}
        component={ResetPasswordScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* =========================
          ADMIN
      ========================== */}

      <Stack.Screen
        name={ROUTES.ADMIN_DASHBOARD}
        component={AdminDashboardScreen}
        options={{
          animation: 'fade',
          gestureEnabled: false,
        }}
      />

      {/* =========================
          CUSTOMER APPLICATION
      ========================== */}

      <Stack.Screen
        name={ROUTES.MAIN_DRAWER}
        component={AppDrawerNavigator}
        options={{
          animation: 'fade',
        }}
      />

      <Stack.Screen
        name={ROUTES.SYSTEM_MODAL}
        component={ModalHostScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />

      <Stack.Screen
        name={ROUTES.FAVOURITES}
        component={FavouritesScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      <Stack.Screen
        name={ROUTES.CART}
        component={CartScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      <Stack.Screen
        name={ROUTES.PACKAGES}
        component={PackagesScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      <Stack.Screen
        name={ROUTES.PRODUCT_DETAILS}
        component={ProductDetailsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      <Stack.Screen
        name={ROUTES.PACKAGE_DETAILS}
        component={PackageDetailsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      <Stack.Screen
        name={ROUTES.APPLICATION_FORM}
        component={PackageApplicationScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      <Stack.Screen
        name={ROUTES.APPLICATION_STATUS}
        component={ApplicationStatusScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      <Stack.Screen
        name={ROUTES.RETAIL_OUTLET}
        component={RetailOutletScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      <Stack.Screen
        name={ROUTES.CHECKOUT}
        component={CheckoutScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      <Stack.Screen
        name={ROUTES.ORDER_CONFIRMATION}
        component={OrderConfirmationScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
}