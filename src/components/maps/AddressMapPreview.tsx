import { Platform } from 'react-native';

const platformModule =
  Platform.OS === 'ios'
    ? require('./AddressMapPreview.ios')
    : Platform.OS === 'android'
      ? require('./AddressMapPreview.android')
      : require('./AddressMapPreview.web');

export const AddressMapPreview = platformModule.AddressMapPreview;
