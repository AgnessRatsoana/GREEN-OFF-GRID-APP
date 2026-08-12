const FALLBACK_SUPABASE_URL = 'https://mfmlyasvqehttlfutozo.supabase.co';
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_sLLG9MvmAkC5KlE-OzSA7w_MZ8LhkIa';

export const ENV = {
  API_BASE_URL: '',
  SUPABASE_URL:
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    FALLBACK_SUPABASE_URL,
  SUPABASE_ANON_KEY:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    FALLBACK_SUPABASE_PUBLISHABLE_KEY,
} as const;
