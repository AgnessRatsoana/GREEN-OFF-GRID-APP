
import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

import { ENV } from '../../config/env';

function getSupabaseConfig() {
  if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
    throw new Error(
      'Missing Supabase config. Create .env with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, then restart with npx expo start -c.',
    );
  }

  return {
    url: ENV.SUPABASE_URL,
    anonKey: ENV.SUPABASE_ANON_KEY,
  };
}

/**
 * Supabase Auth storage
 *
 * Web:
 *   Uses localStorage because expo-secure-store is a native-only
 *   storage implementation.
 *
 * Android / iOS:
 *   Uses expo-secure-store for encrypted native storage.
 */
function createAuthStorage() {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    return {
      async getItem(key: string): Promise<string | null> {
        return window.localStorage.getItem(key);
      },

      async setItem(key: string, value: string): Promise<void> {
        window.localStorage.setItem(key, value);
      },

      async removeItem(key: string): Promise<void> {
        window.localStorage.removeItem(key);
      },
    };
  }

  return {
    async getItem(key: string): Promise<string | null> {
      const SecureStore = await import('expo-secure-store');
      return SecureStore.getItemAsync(key);
    },

    async setItem(key: string, value: string): Promise<void> {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.setItemAsync(key, value);
    },

    async removeItem(key: string): Promise<void> {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.deleteItemAsync(key);
    },
  };
}

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const { url, anonKey } = getSupabaseConfig();

  const storage = createAuthStorage();

  supabaseClient = createClient(url, anonKey, {
    auth: {
      storage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });

  return supabaseClient;
}