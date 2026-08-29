import { AuthPayload, AuthUser } from '../../types/auth';
import {
  appendActivityLog,
  syncProfileSnapshot,
} from '../admin/dashboard';
import { getSupabaseClient } from './supabaseClient';

/**
 * Map Supabase Auth user + database profile
 * into the application's AuthUser object.
 *
 * IMPORTANT:
 * The public.profiles table is the source of truth
 * for role and account type.
 */
function mapUser(
  user: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown> | null;
  },
  profile?: {
    role?: string | null;
    account_type?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
    business_name?: string | null;
    business_registration_number?: string | null;
    contact_number?: string | null;

    employee_number?: string | null;
    employee_profile_completed?: boolean;
    must_reset_password?: boolean;
    temporary_access_expires_at?: string | null;
    intruder_flagged?: boolean;
    intruder_flagged_at?: string | null;
    invited_at?: string | null;
    last_login_at?: string | null;
  } | null
): AuthUser {
  const metadata = user.user_metadata ?? {};

  const fullName =
    profile?.full_name ||
    (metadata.full_name as string | undefined) ||
    (metadata.name as string | undefined) ||
    'User';

  /*
   * IMPORTANT:
   * Role comes from public.profiles.
   *
   * This is what allows the admin role that you changed
   * in Supabase to actually reach the application.
   */
  const role =
    profile?.role === 'admin'
      ? 'admin'
      : profile?.role === 'marketing'
        ? 'marketing'
        : 'client';

  const accountType =
    profile?.account_type === 'business'
      ? 'business'
      : 'individual';

  return {
    id: user.id,

    name: fullName,

    email: user.email || '',

    avatarUrl:
      profile?.avatar_url ||
      (metadata.avatar_url as string | undefined) ||
      null,

    role,

    accountType,

    businessName:
      profile?.business_name ||
      (metadata.business_name as string | undefined) ||
      null,

    businessRegistrationNumber:
      profile?.business_registration_number ||
      (metadata.business_registration_number as string | undefined) ||
      null,

    contactNumber:
      profile?.contact_number ||
      (metadata.contact_number as string | undefined) ||
      null,

    employeeNumber:
      profile?.employee_number || null,

    employeeProfileCompleted:
      profile?.employee_profile_completed ?? false,

    mustResetPassword:
      profile?.must_reset_password ?? false,

    temporaryAccessExpiresAt:
      profile?.temporary_access_expires_at || null,

    intruderFlagged:
      profile?.intruder_flagged ?? false,

    intruderFlaggedAt:
      profile?.intruder_flagged_at || null,

    invitedAt:
      profile?.invited_at || null,

    lastLoginAt:
      profile?.last_login_at || null,
  };
}

/**
 * Load the application profile from public.profiles.
 */
async function getUserProfile(userId: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('profiles')
    .select(`
  role,
  account_type,
  full_name,
  avatar_url,
  business_name,
  business_registration_number,
  contact_number,
  employee_number,
  employee_profile_completed,
  must_reset_password,
  temporary_access_expires_at,
  intruder_flagged,
  intruder_flagged_at,
  invited_at,
  last_login_at
`)
    .eq('id', userId)
    .single();

  if (error) {
    console.warn(
      'Unable to load user profile:',
      error.message
    );

    return null;
  }

  console.log('===== DATABASE PROFILE =====');
  console.log('Profile role:', data?.role);
  console.log('Profile account type:', data?.account_type);
  console.log('Profile name:', data?.full_name);
  console.log('============================');

  return data;
}

/**
 * Parse Supabase recovery/deep-link URLs.
 */
function parseRecoveryUrl(url: string): Record<string, string> {
  const result: Record<string, string> = {};

  const [base, hash = ''] = url.split('#');

  const queryString = base.includes('?')
    ? base.split('?')[1]
    : '';

  const hashString = hash.includes('?')
    ? hash.split('?')[1]
    : hash;

  const params = new URLSearchParams(
    queryString || hashString
  );

  params.forEach((value, key) => {
    result[key] = value;
  });

  return result;
}

/**
 * Login with Supabase.
 */
export async function loginWithSupabase(
  email: string,
  password: string
): Promise<AuthPayload> {
  const supabase = getSupabaseClient();

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session || !data.user) {
    throw new Error(
      'Login succeeded but no session was returned.'
    );
  }

  /*
   * IMPORTANT:
   *
   * Authentication succeeded.
   * Now retrieve the user's profile from public.profiles.
   */
  const profile = await getUserProfile(
    data.user.id
  );

  /*
   * Create the application user using the DATABASE
   * profile, rather than only Supabase metadata.
   */
  const mappedUser = mapUser(
    data.user,
    profile
  );

  console.log('===== LOGIN USER =====');
  console.log('Email:', mappedUser.email);
  console.log('Role:', mappedUser.role);
  console.log('Account Type:', mappedUser.accountType);
  console.log('======================');

  try {
    await syncProfileSnapshot();

    await appendActivityLog(
      'auth.login',
      {
        email,
      }
    );
  } catch {
    // Metrics must never block authentication.
  }

  return {
    tokens: {
      accessToken:
        data.session.access_token,

      refreshToken:
        data.session.refresh_token,
    },

    user: mappedUser,
  };
}

/**
 * Register a new user.
 */
export async function registerWithSupabase(
  email: string,
  password: string,
  fullName: string,
  accountType:
    | 'individual'
    | 'business' = 'individual',
  businessDetails?: {
    businessName?: string;
    businessRegistrationNumber?: string;
    contactNumber?: string;
  }
): Promise<AuthPayload | null> {
  const supabase = getSupabaseClient();

  const { data, error } =
    await supabase.auth.signUp({
      email,
      password,

      options: {
        data: {
          full_name: fullName,

          role: 'client',

          account_type: accountType,

          business_name:
            businessDetails?.businessName || null,

          business_registration_number:
            businessDetails?.businessRegistrationNumber ||
            null,

          contact_number:
            businessDetails?.contactNumber ||
            null,
        },

        emailRedirectTo:
          'green-off-grid-mobile-app://login',
      },
    });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session || !data.user) {
    return null;
  }

  const profile = await getUserProfile(
    data.user.id
  );

  const mappedUser = mapUser(
    data.user,
    profile
  );

  try {
    await syncProfileSnapshot();

    await appendActivityLog(
      'auth.register',
      {
        email,
      }
    );
  } catch {
    // Metrics must never block authentication.
  }

  return {
    tokens: {
      accessToken:
        data.session.access_token,

      refreshToken:
        data.session.refresh_token,
    },

    user: mappedUser,
  };
}

/**
 * Request password reset.
 */
export async function requestPasswordReset(
  email: string,
  redirectTo: string
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } =
    await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo,
      }
    );

  if (error) {
    throw new Error(error.message);
  }

  try {
    await appendActivityLog(
      'auth.password_reset_requested',
      {
        email,
      }
    );
  } catch {
    // Metrics must never block authentication.
  }
}

/**
 * Refresh Supabase session.
 */
export async function refreshSupabaseSession(
  refreshToken: string
): Promise<AuthPayload> {
  const supabase = getSupabaseClient();

  const { data, error } =
    await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session || !data.user) {
    throw new Error(
      'Unable to restore session.'
    );
  }

  /*
   * IMPORTANT:
   * Reload profile so admin/client role is always
   * determined from public.profiles.
   */
  const profile = await getUserProfile(
    data.user.id
  );

  const mappedUser = mapUser(
    data.user,
    profile
  );

  try {
    await syncProfileSnapshot();

    await appendActivityLog(
      'auth.session_refreshed'
    );
  } catch {
    // Metrics must never block authentication.
  }

  return {
    tokens: {
      accessToken:
        data.session.access_token,

      refreshToken:
        data.session.refresh_token,
    },

    user: mappedUser,
  };
}

/**
 * Logout.
 */
export async function logoutFromSupabase(): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    await appendActivityLog(
      'auth.logout'
    );
  } catch {
    // Metrics must never block authentication.
  }

  const { error } =
    await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Update password.
 */
export async function updatePassword(
  newPassword: string
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } =
    await supabase.auth.updateUser({
      password: newPassword,
    });

  if (error) {
    throw new Error(error.message);
  }

  try {
    await appendActivityLog(
      'auth.password_updated'
    );
  } catch {
    // Metrics must never block authentication.
  }
}

/**
 * Complete the first-time password setup for a marketing employee.
 *
 * This:
 * 1. Updates the Supabase Auth password.
 * 2. Clears must_reset_password.
 * 3. Keeps the employee logged in.
 *
 * The employee profile itself is completed separately.
 */
export async function completeEmployeePasswordSetup(
  newPassword: string
): Promise<void> {
  const supabase = getSupabaseClient();

  if (!newPassword.trim()) {
    throw new Error(
      'Please provide a new password.'
    );
  }

  if (newPassword.trim().length < 8) {
    throw new Error(
      'Your new password must be at least 8 characters long.'
    );
  }

  /*
   * ============================================================
   * UPDATE SUPABASE AUTH PASSWORD
   * ============================================================
   */

  const {
    data: updatedUser,
    error: passwordError,
  } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (passwordError) {
    throw new Error(
      passwordError.message
    );
  }

  if (!updatedUser.user) {
    throw new Error(
      'Password was not updated. Please try again.'
    );
  }

  /*
   * ============================================================
   * GET CURRENT USER
   * ============================================================
   */

  const {
    data: sessionData,
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(
      sessionError.message
    );
  }

  const currentUser =
    sessionData.session?.user;

  if (!currentUser) {
    throw new Error(
      'Your session could not be restored. Please log in again.'
    );
  }

  /*
   * ============================================================
   * VERIFY MARKETING EMPLOYEE
   * ============================================================
   */

  const { data: profile, error: profileError } =
    await supabase
      .from('profiles')
      .select(`
        id,
        role,
        employee_number,
        employee_profile_completed,
        must_reset_password,
        temporary_access_expires_at
      `)
      .eq('id', currentUser.id)
      .single();

  if (profileError) {
    throw new Error(
      `Unable to load employee profile: ${profileError.message}`
    );
  }

  if (profile?.role !== 'marketing') {
    throw new Error(
      'This password setup is only available for marketing employees.'
    );
  }

  /*
   * ============================================================
   * CHECK TEMPORARY ACCESS EXPIRY
   * ============================================================
   */

  if (
    profile.temporary_access_expires_at
  ) {
    const expiresAt =
      new Date(
        profile.temporary_access_expires_at
      );

    if (
      !Number.isNaN(
        expiresAt.getTime()
      ) &&
      expiresAt.getTime() <
        Date.now()
    ) {
      throw new Error(
        'Your temporary access has expired. Please contact your administrator.'
      );
    }
  }

  /*
   * ============================================================
   * COMPLETE PASSWORD SETUP
   * ============================================================
   */

  const {
    error: updateProfileError,
  } = await supabase
    .from('profiles')
    .update({
      must_reset_password: false,
      last_login_at:
        new Date().toISOString(),
      last_seen_at:
        new Date().toISOString(),
    })
    .eq(
      'id',
      currentUser.id
    );

  if (updateProfileError) {
    throw new Error(
      `Password was changed, but employee setup could not be completed: ${updateProfileError.message}`
    );
  }

  /*
   * ============================================================
   * ACTIVITY LOG
   * ============================================================
   */

  try {
    await appendActivityLog(
      'auth.employee_password_setup_completed',
      {
        employee_number:
          profile.employee_number,
      }
    );
  } catch {
    /*
     * Activity logging must never
     * block successful authentication.
     */
  }

  console.log(
    '========================================'
  );

  console.log(
    'MARKETING EMPLOYEE PASSWORD SETUP'
  );

  console.log(
    'Employee:',
    currentUser.email
  );

  console.log(
    'Employee Number:',
    profile.employee_number
  );

  console.log(
    'must_reset_password → false'
  );

  console.log(
    '========================================'
  );
}

/**
 * Restore the currently authenticated session.
 */
export async function hydrateCurrentSession(): Promise<AuthPayload | null> {
  const supabase = getSupabaseClient();

  const { data, error } =
    await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  const session = data.session;

  if (
    !session?.access_token ||
    !session.refresh_token ||
    !session.user
  ) {
    return null;
  }

  /*
   * Reload profile here as well.
   *
   * This is important because the app may start with
   * an existing session and still needs to know whether
   * the user is admin or client.
   */
  const profile = await getUserProfile(
    session.user.id
  );

  const mappedUser = mapUser(
    session.user,
    profile
  );

  try {
    await syncProfileSnapshot();
  } catch {
    // Metrics must never block authentication.
  }

  return {
    tokens: {
      accessToken:
        session.access_token,

      refreshToken:
        session.refresh_token,
    },

    user: mappedUser,
  };
}

/**
 * Handle Supabase authentication/recovery URLs.
 */
export async function handleRecoveryUrl(
  url: string
): Promise<boolean> {
  const supabase = getSupabaseClient();

  const params = parseRecoveryUrl(url);

  const accessToken =
    params.access_token;

  const refreshToken =
    params.refresh_token;

  const tokenHash =
    params.token_hash;

  const type =
    params.type;

  if (
    accessToken &&
    refreshToken
  ) {
    const { error } =
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

    if (error) {
      throw new Error(error.message);
    }

    return true;
  }

  if (
    tokenHash &&
    type
  ) {
    const { error } =
      await supabase.auth.verifyOtp({
        type:
          type as
          | 'signup'
          | 'recovery'
          | 'email'
          | 'invite'
          | 'email_change'
          | 'magiclink',

        token_hash: tokenHash,
      });

    if (error) {
      throw new Error(error.message);
    }

    return true;
  }

  return false;
}