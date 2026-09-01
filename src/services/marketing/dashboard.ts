import { getSupabaseClient } from '../auth/supabaseClient';

export interface MarketingDashboardStats {
  products: number;
  packages: number;
  applications: number;
  activity: number;
}

export async function fetchMarketingDashboardStats(): Promise<MarketingDashboardStats> {
  const supabase = getSupabaseClient();

  const [
    productsResult,
    packagesResult,
    applicationsResult,
    activityResult,
  ] = await Promise.all([
    supabase
      .from('marketplace_products')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('is_active', true),

    supabase
      .from('franchise_packages')
      .select('id', {
        count: 'exact',
        head: true,
      }),

    supabase
      .from('applications')
      .select('id', {
        count: 'exact',
        head: true,
      }),

    supabase
      .from('activity_logs')
      .select('id', {
        count: 'exact',
        head: true,
      }),
  ]);

  if (productsResult.error) {
    throw new Error(
      `Unable to load product count: ${productsResult.error.message}`,
    );
  }

  if (packagesResult.error) {
    throw new Error(
      `Unable to load franchise package count: ${packagesResult.error.message}`,
    );
  }

  if (applicationsResult.error) {
    throw new Error(
      `Unable to load application count: ${applicationsResult.error.message}`,
    );
  }

  if (activityResult.error) {
    throw new Error(
      `Unable to load activity count: ${activityResult.error.message}`,
    );
  }

  return {
    products: productsResult.count ?? 0,
    packages: packagesResult.count ?? 0,
    applications: applicationsResult.count ?? 0,
    activity: activityResult.count ?? 0,
  };
}