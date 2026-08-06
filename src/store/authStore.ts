import { create } from 'zustand';

import { AuthState, AuthTokens } from '../types/auth';

interface AuthStore extends AuthState {
  setTokens: (tokens: AuthTokens) => void;
  clearTokens: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  tokens: null,
  isAuthenticated: false,
  setTokens: (tokens) => {
    set({
      tokens,
      isAuthenticated: true,
    });
  },
  clearTokens: () => {
    set({
      tokens: null,
      isAuthenticated: false,
    });
  },
}));
