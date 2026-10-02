import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':
    'POST, OPTIONS',
};

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    },
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse(
      {
        error: 'Method not allowed.',
      },
      405,
    );
  }

  try {
    const supabaseUrl =
      Deno.env.get('SUPABASE_URL') ?? '';

    const serviceRoleKey =
      Deno.env.get(
        'SUPABASE_SERVICE_ROLE_KEY',
      ) ?? '';

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      return jsonResponse(
        {
          error:
            'Supabase server configuration is missing.',
        },
        500,
      );
    }

    const authHeader =
      req.headers.get('Authorization') ?? '';

    const accessToken =
      authHeader
        .replace('Bearer ', '')
        .trim();

    if (!accessToken) {
      return jsonResponse(
        {
          error:
            'Authentication required.',
        },
        401,
      );
    }

    /*
     * Service-role client.
     *
     * This key NEVER goes into the mobile app.
     */
    const supabase =
      createClient(
        supabaseUrl,
        serviceRoleKey,
      );

    /*
     * Identify the caller from their own access token.
     * A user can only ever delete their own account.
     */
    const {
      data: userResult,
      error: userError,
    } =
      await supabase.auth.getUser(
        accessToken,
      );

    if (
      userError ||
      !userResult.user
    ) {
      return jsonResponse(
        {
          error:
            'Invalid or expired session.',
        },
        401,
      );
    }

    const { error: deleteError } =
      await supabase.auth.admin.deleteUser(
        userResult.user.id,
      );

    if (deleteError) {
      return jsonResponse(
        {
          error: deleteError.message,
        },
        500,
      );
    }

    return jsonResponse({
      success: true,
    });
  } catch (err) {
    return jsonResponse(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Unexpected error deleting account.',
      },
      500,
    );
  }
});
