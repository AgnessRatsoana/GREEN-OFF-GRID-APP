import { getSupabaseClient } from '../auth/supabaseClient';

export interface YocoCheckoutItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface YocoCheckoutResult {
  orderId: string;
  redirectUrl: string;
}

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

// The Yoco secret key never touches this app. This calls a Supabase Edge Function
// that creates the order and the hosted checkout session server-side.
export async function createYocoCheckout(
  items: YocoCheckoutItem[],
  successUrl: string,
  cancelUrl: string,
): Promise<YocoCheckoutResult> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke('create-yoco-checkout', {
    body: { items, successUrl, cancelUrl },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.redirectUrl || !data?.orderId) {
    throw new Error('Yoco checkout could not be created.');
  }

  return { orderId: data.orderId, redirectUrl: data.redirectUrl };
}

export async function getOrderStatus(orderId: string): Promise<OrderStatus> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Order not found.');
  }

  return data.status as OrderStatus;
}
