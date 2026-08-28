import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':
    'POST, OPTIONS',
};

interface InviteMarketingUserRequest {
  email: string;
  fullName: string;
  employeeNumber: string;
  contactNumber?: string;
}

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function generateTemporaryPassword(): string {
  const randomPart = crypto.randomUUID()
    .replace(/-/g, '')
    .slice(0, 12);

  return `GO-${randomPart}!`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse(
      { error: 'Method not allowed.' },
      405,
    );
  }

  try {
    const authHeader =
      req.headers.get('Authorization') ?? '';

    const accessToken =
      authHeader.replace('Bearer ', '').trim();

    if (!accessToken) {
      return jsonResponse(
        { error: 'Authentication required.' },
        401,
      );
    }

    const supabaseUrl =
      Deno.env.get('SUPABASE_URL') ?? '';

    const serviceRoleKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(
        {
          error:
            'Supabase server configuration is missing.',
        },
        500,
      );
    }

    /*
     * Server-side Supabase client.
     *
     * The service role key NEVER goes into
     * the mobile application.
     */
    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
    );

    /*
     * Verify administrator access token.
     */
    const {
      data: userResult,
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !userResult.user) {
      return jsonResponse(
        { error: 'Invalid authentication.' },
        401,
      );
    }

    const adminUser = userResult.user;

    /*
     * Confirm caller is an administrator.
     */
    const {
      data: adminProfile,
      error: adminProfileError,
    } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', adminUser.id)
      .single();

    if (
      adminProfileError ||
      adminProfile?.role !== 'admin'
    ) {
      return jsonResponse(
        {
          error:
            'Only administrators can create marketing employees.',
        },
        403,
      );
    }

    const body =
      (await req.json()) as InviteMarketingUserRequest;

    const email =
      body.email?.trim().toLowerCase();

    const fullName =
      body.fullName?.trim();

    const employeeNumber =
      body.employeeNumber?.trim();

    const contactNumber =
      body.contactNumber?.trim() || null;

    /*
     * Validate required fields.
     */
    if (!email || !fullName || !employeeNumber) {
      return jsonResponse(
        {
          error:
            'Email, full name and employee number are required.',
        },
        400,
      );
    }

    /*
     * Basic email validation.
     */
    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return jsonResponse(
        {
          error:
            'Please provide a valid email address.',
        },
        400,
      );
    }

    /*
     * Check employee number.
     */
    const {
      data: existingEmployee,
      error: employeeLookupError,
    } = await supabase
      .from('profiles')
      .select('id,email')
      .eq('employee_number', employeeNumber)
      .maybeSingle();

    if (employeeLookupError) {
      throw new Error(
        employeeLookupError.message,
      );
    }

    if (existingEmployee) {
      return jsonResponse(
        {
          error:
            'That employee number is already assigned.',
        },
        409,
      );
    }

    /*
     * Generate temporary credentials.
     */
    const temporaryPassword =
      generateTemporaryPassword();

    /*
     * Temporary access expires after 24 hours.
     */
    const temporaryAccessExpiresAt =
      new Date(
        Date.now() +
          24 * 60 * 60 * 1000,
      ).toISOString();

    /*
     * Create Supabase Auth account.
     */
    const {
      data: createdUser,
      error: createUserError,
    } =
      await supabase.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,

        user_metadata: {
          full_name: fullName,
          role: 'marketing',
          account_type: 'individual',
          employee_number:
            employeeNumber,
        },
      });

    if (
      createUserError ||
      !createdUser.user
    ) {
      return jsonResponse(
        {
          error:
            createUserError?.message ??
            'Unable to create marketing employee.',
        },
        400,
      );
    }

    const marketingUser =
      createdUser.user;

    /*
     * Create marketing employee profile.
     */
    const {
      error: profileError,
    } = await supabase
      .from('profiles')
      .upsert({
        id: marketingUser.id,
        email,
        full_name: fullName,
        role: 'marketing',
        account_type: 'individual',

        contact_number:
          contactNumber,

        employee_number:
          employeeNumber,

        employee_profile_completed:
          false,

        must_reset_password:
          true,

        invited_at:
          new Date().toISOString(),

        temporary_access_expires_at:
          temporaryAccessExpiresAt,

        intruder_flagged:
          false,

        intruder_flagged_at:
          null,
      });

    /*
     * If profile creation fails,
     * remove the Auth account so we don't
     * leave an incomplete employee behind.
     */
    if (profileError) {
      await supabase.auth.admin.deleteUser(
        marketingUser.id,
      );

      throw new Error(
        `Unable to create employee profile: ${profileError.message}`,
      );
    }

    /*
     * Record invitation in activity log.
     */
    await supabase
      .from('activity_logs')
      .insert({
        event_type:
          'admin.marketing_user_invited',

        actor_id:
          adminUser.id,

        actor_email:
          adminUser.email ?? null,

        metadata: {
          invited_user_id:
            marketingUser.id,

          invited_email:
            email,

          employee_number:
            employeeNumber,

          temporary_access_expires_at:
            temporaryAccessExpiresAt,
        },
      });

    /*
     * Return temporary credentials to the
     * administrator.
     *
     * No email provider is required.
     */
    return jsonResponse({
      success: true,

      userId:
        marketingUser.id,

      email,

      employeeNumber,

      temporaryAccessExpiresAt,

      temporaryPassword,

      message:
        'Marketing employee created successfully. Provide the temporary credentials to the employee.',
    });

  } catch (error) {
    console.error(
      'invite-marketing-user error:',
      error,
    );

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to create marketing employee.',
      },
      500,
    );
  }
});
