import * as SecureStore from 'expo-secure-store';

import { AuthTokens } from '../../types/auth';

const ACCESS_TOKEN_KEY = 'green_off_grid_access_token';
const REFRESH_TOKEN_KEY = 'green_off_grid_refresh_token';

export async function saveAuthTokens(tokens: AuthTokens): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function clearAuthTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
