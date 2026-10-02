export {
  registerWithSupabase,
  loginWithSupabase,
  requestPasswordReset,
  updatePassword,
  updateClientProfile,
  completeEmployeePasswordSetup,
  logoutFromSupabase,
  hydrateCurrentSession,
  handleRecoveryUrl,
  refreshSupabaseSession,
  deactivateAccount,
  deleteAccountPermanently,
} from './supabaseAuth';