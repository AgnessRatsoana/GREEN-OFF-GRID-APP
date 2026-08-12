import { create } from 'zustand';

import { AuthPayload, AuthState } from '../types/auth';

interface AuthStore extends AuthState {
  setSession: (payload: AuthPayload) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  tokens: null,
  isAuthenticated: false,
  user: null,
  setSession: ({ tokens, user }) => {
    set({
      tokens,
      user,
      isAuthenticated: true,
    });
  },
  clearSession: () => {
    set({
      tokens: null,
      user: null,
      isAuthenticated: false,
    });
  },
}));
