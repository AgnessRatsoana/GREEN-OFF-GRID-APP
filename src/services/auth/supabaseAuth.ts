import { AuthPayload, AuthUser } from '../../types/auth';
import { appendActivityLog, syncProfileSnapshot } from '../admin/dashboard';
import { getSupabaseClient } from './supabaseClient';

function mapUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): AuthUser {
  const metadata = user.user_metadata ?? {};
  const fullName = (metadata.full_name as string | undefined) || (metadata.name as string | undefined) || 'User';
  const role = metadata.role === 'admin' ? 'admin' : 'client';
  const accountType = metadata.account_type === 'business' ? 'business' : 'individual';

  return {
    id: user.id,
    name: fullName,
    email: user.email || '',
    avatarUrl: (metadata.avatar_url as string | undefined) || null,
    role,
    accountType,
    businessName: (metadata.business_name as string | undefined) || null,
    businessRegistrationNumber: (metadata.business_registration_number as string | undefined) || null,
    contactNumber: (metadata.contact_number as string | undefined) || null,
  };
}

function parseRecoveryUrl(url: string): Record<string, string> {
  const result: Record<string, string> = {};
  const [base, hash = ''] = url.split('#');
  const queryString = base.includes('?') ? base.split('?')[1] : '';
  const hashString = hash.includes('?') ? hash.split('?')[1] : hash;
  const params = new URLSearchParams(queryString || hashString);
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

export async function loginWithSupabase(email: string, password: string): Promise<AuthPayload> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session || !data.user) {
    throw new Error('Login succeeded but no session was returned.');
  }

  try {
    await syncProfileSnapshot();
    await appendActivityLog('auth.login', {
      email,
    });
  } catch {
    // Metrics should never block authentication.
  }

  return {
    tokens: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    },
    user: mapUser(data.user),
  };
}

export async function registerWithSupabase(
  email: string,
  password: string,
  fullName: string,
  accountType: 'individual' | 'business' = 'individual',
  businessDetails?: { businessName?: string; businessRegistrationNumber?: string; contactNumber?: string },
): Promise<AuthPayload | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'client',
        account_type: accountType,
        business_name: businessDetails?.businessName || null,
        business_registration_number: businessDetails?.businessRegistrationNumber || null,
        contact_number: businessDetails?.contactNumber || null,
      },
      emailRedirectTo: 'green-off-grid-mobile-app://login',
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session || !data.user) {
    return null;
  }

  try {
    await syncProfileSnapshot();
    await appendActivityLog('auth.register', {
      email,
    });
  } catch {
    // Metrics should never block authentication.
  }

  return {
    tokens: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    },
    user: mapUser(data.user),
  };
}

export async function requestPasswordReset(email: string, redirectTo: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    throw new Error(error.message);
  }

  try {
    await appendActivityLog('auth.password_reset_requested', {
      email,
    });
  } catch {
    // Metrics should never block authentication.
  }
}

export async function refreshSupabaseSession(refreshToken: string): Promise<AuthPayload> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session || !data.user) {
    throw new Error('Unable to restore session.');
  }

  try {
    await syncProfileSnapshot();
    await appendActivityLog('auth.session_refreshed');
  } catch {
    // Metrics should never block authentication.
  }

  return {
    tokens: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    },
    user: mapUser(data.user),
  };
}

export async function logoutFromSupabase(): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    await appendActivityLog('auth.logout');
  } catch {
    // Metrics should never block authentication.
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

export async function updatePassword(newPassword: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    throw new Error(error.message);
  }

  try {
    await appendActivityLog('auth.password_updated');
  } catch {
    // Metrics should never block authentication.
  }
}

export async function hydrateCurrentSession(): Promise<AuthPayload | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  const session = data.session;

  if (!session?.access_token || !session.refresh_token || !session.user) {
    return null;
  }

  try {
    await syncProfileSnapshot();
  } catch {
    // Metrics should never block authentication.
  }

  return {
    tokens: {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
    },
    user: mapUser(session.user),
  };
}

export async function handleRecoveryUrl(url: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const params = parseRecoveryUrl(url);
  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  const tokenHash = params.token_hash;
  const type = params.type;

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      throw new Error(error.message);
    }

    return true;
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as 'signup' | 'recovery' | 'email' | 'invite' | 'email_change' | 'magiclink',
      token_hash: tokenHash,
    });

    if (error) {
      throw new Error(error.message);
    }

    return true;
  }

  return false;
}
