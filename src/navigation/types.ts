import { ROUTES } from '../constants/routes';

export type RootStackParamList = {
  [ROUTES.MAIN_DRAWER]: undefined;
  [ROUTES.SYSTEM_MODAL]: undefined;
  [ROUTES.LOGIN]: undefined;
  [ROUTES.FORGOT_PASSWORD]: undefined;
  [ROUTES.RESET_PASSWORD]: undefined;
  [ROUTES.REGISTER]: undefined;
  [ROUTES.ADMIN_DASHBOARD]: undefined;
  [ROUTES.FAVOURITES]: undefined;
  [ROUTES.CART]: undefined;
  [ROUTES.PACKAGES]: undefined;
  [ROUTES.PRODUCT_DETAILS]: { productId: string };
  [ROUTES.PACKAGE_DETAILS]: { packageId: string };
  [ROUTES.APPLICATION_FORM]: { packageId: string };
  [ROUTES.APPLICATION_STATUS]: { packageId?: string; status?: string };
  [ROUTES.RETAIL_OUTLET]: undefined;
  [ROUTES.CHECKOUT]: undefined;
  [ROUTES.ORDER_CONFIRMATION]: { orderId: string };
};

export type MainDrawerParamList = {
  [ROUTES.HOME]: undefined;
  [ROUTES.PROFILE]: undefined;
  [ROUTES.MESSAGES]: undefined;
};
