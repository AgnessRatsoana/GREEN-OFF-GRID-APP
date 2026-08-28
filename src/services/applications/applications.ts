import { getSupabaseClient } from '../auth/supabaseClient';

export type ApplicationStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Consultation'
  | 'Approved'
  | 'Rejected';

export interface CreateApplicationInput {
  packageId: string;
  packageTitle: string;

  fullName: string;
  email: string;
  phone?: string;

  businessName?: string;

  city?: string;
  province?: string;

  projectType?: 'Residential' | 'Commercial' | 'Industrial';

  budget?: string;
  notes?: string;
}

export interface Application {
  id: string;
  user_id: string | null;

  package_id: string;
  package_title: string;

  full_name: string;
  email: string;
  phone: string | null;

  business_name: string | null;

  city: string | null;
  province: string | null;

  project_type: 'Residential' | 'Commercial' | 'Industrial' | null;

  budget: string | null;
  notes: string | null;

  status: ApplicationStatus;

  created_at: string;
  updated_at: string;
}

/**
 * Create a new franchise application for the
 * currently authenticated user.
 */
export async function createApplication(
  input: CreateApplicationInput,
): Promise<Application> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error('You must be logged in to submit an application.');
  }

  const { data, error } = await supabase
    .from('applications')
    .insert({
      user_id: user.id,

      package_id: input.packageId,
      package_title: input.packageTitle,

      full_name: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || null,

      business_name: input.businessName?.trim() || null,

      city: input.city?.trim() || null,
      province: input.province?.trim() || null,

      project_type: input.projectType || null,

      budget: input.budget?.trim() || null,
      notes: input.notes?.trim() || null,

      status: 'Submitted',
    })
    .select('*')
    .single();

  if (error) {
    console.error('Create application error:', error);

    throw new Error(
      error.message || 'Unable to submit your application.',
    );
  }

  return data as Application;
}


/**
 * Get applications belonging to the currently
 * authenticated customer.
 */
export async function fetchMyApplications(): Promise<Application[]> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error('You must be logged in.');
  }

  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(
      error.message || 'Unable to load your applications.',
    );
  }

  return (data || []) as Application[];
}


/**
 * Get one application belonging to the currently
 * authenticated customer.
 */
export async function fetchMyApplication(
  applicationId: string,
): Promise<Application | null> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error('You must be logged in.');
  }

  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(
      error.message || 'Unable to load the application.',
    );
  }

  return data as Application | null;
}