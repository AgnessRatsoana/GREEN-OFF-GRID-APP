// Supabase Edge Function: creates a Yoco hosted checkout session and a pending order row.
// Deploy with: supabase functions deploy create-yoco-checkout
// Secrets required (set with `supabase secrets set`):
//   YOCO_SECRET_KEY      - Yoco secret key from the Yoco Portal (Test or Live)
//   SUPABASE_URL         - auto-provided by Supabase
//   SUPABASE_SERVICE_ROLE_KEY - service role key, used to write orders bypassing RLS
import { createClient } from 'jsr:@supabase/supabase-js@2';

const YOCO_CHECKOUT_URL = 'https://payments.yoco.com/api/checkouts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: userResult, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );

    if (userError || !userResult.user) {
      return new Response(JSON.stringify({ error: 'Not authenticated.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { items, successUrl, cancelUrl } = (await req.json()) as {
      items: CheckoutItem[];
      successUrl: string;
      cancelUrl: string;
    };

    if (!items?.length) {
      return new Response(JSON.stringify({ error: 'No items provided.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const amountCents = items.reduce(
      (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
      0,
    );

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userResult.user.id,
        amount_cents: amountCents,
        currency: 'ZAR',
        status: 'pending',
        items,
      })
      .select('id')
      .single();

    if (orderError || !order) {
      throw new Error(orderError?.message ?? 'Unable to create order.');
    }

    const yocoResponse = await fetch(YOCO_CHECKOUT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('YOCO_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountCents,
        currency: 'ZAR',
        successUrl,
        cancelUrl,
        failureUrl: cancelUrl,
        metadata: { orderId: order.id },
      }),
    });

    if (!yocoResponse.ok) {
      const errorBody = await yocoResponse.text();
      throw new Error(`Yoco checkout failed: ${errorBody}`);
    }

    const yocoCheckout = await yocoResponse.json();

    await supabase
      .from('orders')
      .update({ yoco_checkout_id: yocoCheckout.id })
      .eq('id', order.id);

    return new Response(
      JSON.stringify({ orderId: order.id, redirectUrl: yocoCheckout.redirectUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
