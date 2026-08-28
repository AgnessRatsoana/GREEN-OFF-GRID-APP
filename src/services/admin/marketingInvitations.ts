import { getSupabaseClient } from '../auth/supabaseClient';

export interface InviteMarketingUserInput {
  email: string;
  fullName: string;
  employeeNumber: string;
  contactNumber?: string;
}

export interface InviteMarketingUserResult {
  success: boolean;
  userId: string;
  email: string;
  employeeNumber: string;
  temporaryAccessExpiresAt: string;
  temporaryPassword?: string;
}

export async function inviteMarketingUser(
  input: InviteMarketingUserInput,
): Promise<InviteMarketingUserResult> {
  const supabase = getSupabaseClient();

  const {
    data: sessionData,
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !sessionData.session) {
    throw new Error(
      'You must be logged in as an administrator.',
    );
  }

  const { data, error } =
    await supabase.functions.invoke(
      'invite-marketing-user',
      {
        body: {
          email: input.email.trim().toLowerCase(),
          fullName: input.fullName.trim(),
          employeeNumber: input.employeeNumber.trim(),
          contactNumber:
            input.contactNumber?.trim() || undefined,
        },
      },
    );

  /*
   * Supabase Functions can return a FunctionsHttpError
   * when the Edge Function responds with 4xx/5xx.
   *
   * Try to read the actual JSON response from the
   * Edge Function so we can see the real server error.
   */
  if (error) {
    let serverMessage = '';

    try {
      const context = (error as any).context;

      if (context?.json) {
        const responseBody = await context.json();

        serverMessage =
          responseBody?.error ||
          responseBody?.message ||
          '';
      }
    } catch {
      // Ignore response parsing errors.
    }

    throw new Error(
      serverMessage ||
        error.message ||
        'Unable to invite marketing employee.',
    );
  }

  if (!data?.success) {
    throw new Error(
      data?.error ||
        'Unable to invite marketing employee.',
    );
  }

  return data as InviteMarketingUserResult;
}
