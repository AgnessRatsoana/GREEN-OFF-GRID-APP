import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { AuthTokens } from '../../types/auth';

const ACCESS_TOKEN_KEY =
  'green_off_grid_access_token';

const REFRESH_TOKEN_KEY =
  'green_off_grid_refresh_token';

/*
 * Web storage
 *
 * On web we use localStorage because
 * expo-secure-store is a native-only storage API.
 */
const webStorage = {
  async setItem(
    key: string,
    value: string,
  ): Promise<void> {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        key,
        value,
      );
    }
  },

  async getItem(
    key: string,
  ): Promise<string | null> {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(
        key,
      );
    }

    return null;
  },

  async deleteItem(
    key: string,
  ): Promise<void> {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(
        key,
      );
    }
  },
};

/*
 * Save authentication tokens
 *
 * Mobile:
 *   expo-secure-store
 *
 * Web:
 *   localStorage
 */
export async function saveAuthTokens(
  tokens: AuthTokens,
): Promise<void> {
  if (Platform.OS === 'web') {
    await webStorage.setItem(
      ACCESS_TOKEN_KEY,
      tokens.accessToken,
    );

    await webStorage.setItem(
      REFRESH_TOKEN_KEY,
      tokens.refreshToken,
    );

    return;
  }

  await SecureStore.setItemAsync(
    ACCESS_TOKEN_KEY,
    tokens.accessToken,
  );

  await SecureStore.setItemAsync(
    REFRESH_TOKEN_KEY,
    tokens.refreshToken,
  );
}

/*
 * Get access token
 */
export async function getAccessToken(): Promise<
  string | null
> {
  if (Platform.OS === 'web') {
    return webStorage.getItem(
      ACCESS_TOKEN_KEY,
    );
  }

  return SecureStore.getItemAsync(
    ACCESS_TOKEN_KEY,
  );
}

/*
 * Get refresh token
 */
export async function getRefreshToken(): Promise<
  string | null
> {
  if (Platform.OS === 'web') {
    return webStorage.getItem(
      REFRESH_TOKEN_KEY,
    );
  }

  return SecureStore.getItemAsync(
    REFRESH_TOKEN_KEY,
  );
}

/*
 * Clear authentication tokens
 */
export async function clearAuthTokens(): Promise<void> {
  if (Platform.OS === 'web') {
    await webStorage.deleteItem(
      ACCESS_TOKEN_KEY,
    );

    await webStorage.deleteItem(
      REFRESH_TOKEN_KEY,
    );

    return;
  }

  await SecureStore.deleteItemAsync(
    ACCESS_TOKEN_KEY,
  );

  await SecureStore.deleteItemAsync(
    REFRESH_TOKEN_KEY,
  );
}