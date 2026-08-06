export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
}
