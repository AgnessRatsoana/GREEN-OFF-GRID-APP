// Supabase Edge Function: receives Yoco payment webhooks and updates order status server-side.
// Deploy with: supabase functions deploy yoco-webhook --no-verify-jwt
// Configure this function's URL in the Yoco Portal webhook settings.
// Secrets required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, YOCO_WEBHOOK_SECRET
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Verifies the webhook signature per Yoco's webhook signing scheme.
// Confirm the exact header names / algorithm against the current Yoco webhooks documentation before going live.
async function verifySignature(req: Request, rawBody: string): Promise<boolean> {
  const secret = Deno.env.get('YOCO_WEBHOOK_SECRET');
  const signatureHeader = req.headers.get('webhook-signature');
  const timestamp = req.headers.get('webhook-timestamp');
  const id = req.headers.get('webhook-id');

  if (!secret || !signatureHeader || !timestamp || !id) {
    return false;
  }

  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signatureBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedContent));
  const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));

  return signatureHeader.includes(expectedSignature);
}

Deno.serve(async (req) => {
  const rawBody = await req.text();

  const isValid = await verifySignature(req, rawBody);

  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Invalid signature.' }), { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const orderId = event?.payload?.metadata?.orderId;
  const eventType = event?.type as string | undefined;

  if (!orderId || !eventType) {
    return new Response(JSON.stringify({ error: 'Missing order reference.' }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const status = eventType === 'payment.succeeded' ? 'paid' : 'failed';

  await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
