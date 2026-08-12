export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role?: 'admin' | 'client';
}

export interface AuthPayload {
  tokens: AuthTokens;
  user: AuthUser;
}

export interface AuthState {
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  user: AuthUser | null;
}
