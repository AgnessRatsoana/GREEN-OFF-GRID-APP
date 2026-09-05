import { ROUTES } from '../constants/routes';

export type RootStackParamList = {
  [ROUTES.MAIN_DRAWER]: undefined;
  [ROUTES.SYSTEM_MODAL]: undefined;

  [ROUTES.LOGIN]: undefined;
  [ROUTES.FORGOT_PASSWORD]: undefined;
  [ROUTES.RESET_PASSWORD]: undefined;
  [ROUTES.REGISTER]: undefined;

  [ROUTES.ADMIN_DASHBOARD]: undefined;


  [ROUTES.MARKETING_DASHBOARD]: undefined;
  [ROUTES.MARKETING_PACKAGES]: undefined;
  [ROUTES.MARKETING_ENQUIRIES]: undefined;
  [ROUTES.MARKETING_ORDERS]: undefined;
  [ROUTES.MARKETING_APPLICATIONS]: undefined;
  [ROUTES.MARKETING_PRODUCTS]: undefined;
  [ROUTES.ADD_PRODUCT]: { productId?: string } | undefined;
  

  [ROUTES.FAVOURITES]: undefined;
  [ROUTES.CART]: undefined;

  [ROUTES.PACKAGES]: undefined;
  [ROUTES.PRODUCT_DETAILS]: { productId: string };
  [ROUTES.PACKAGE_DETAILS]: { packageId: string };
  [ROUTES.ENQUIRY]: {
    itemType?: 'product' | 'package' | 'order';
    itemId?: string;
    conversationId?: string;
  };
  [ROUTES.ORDERS]: undefined;

  [ROUTES.APPLICATION_FORM]: { packageId: string };
  [ROUTES.APPLICATION_STATUS]: { applicationId: string };

  [ROUTES.RETAIL_OUTLET]: undefined;

  [ROUTES.CHECKOUT]: undefined;
  [ROUTES.ORDER_CONFIRMATION]: { orderId: string };
  [ROUTES.ORDER_TRACKING]: { orderId: string };

  [ROUTES.EMPLOYEE_PROFILE]: undefined;
};

export type MainDrawerParamList = {
  [ROUTES.HOME]: undefined;
  [ROUTES.PROFILE]: undefined;
  [ROUTES.MESSAGES]: undefined;
  [ROUTES.ORDERS]: undefined;
};