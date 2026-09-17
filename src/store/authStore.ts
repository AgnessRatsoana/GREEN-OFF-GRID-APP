import { create } from 'zustand';

import { AuthPayload, AuthState, AuthUser } from '../types/auth';

interface AuthStore extends AuthState {
  setSession: (payload: AuthPayload) => void;
  clearSession: () => void;
  updateUser: (user: AuthUser) => void;
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
  updateUser: (user) => {
    set({ user });
  },
}));
