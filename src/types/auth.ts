export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;

  role?: 'admin' | 'marketing' | 'client';

  accountType?: 'individual' | 'business';

  businessName?: string | null;

  businessRegistrationNumber?: string | null;

  contactNumber?: string | null;

  // ============================================================
  // MARKETING EMPLOYEE
  // ============================================================

  employeeNumber?: string | null;

  employeeProfileCompleted?: boolean;

  mustResetPassword?: boolean;

  temporaryAccessExpiresAt?: string | null;

  intruderFlagged?: boolean;

  intruderFlaggedAt?: string | null;

  invitedAt?: string | null;

  lastLoginAt?: string | null;
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