import type { RealtimeChannel } from '@supabase/supabase-js';

import { getSupabaseClient } from '../auth/supabaseClient';

export interface OrderItemLine {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
}

export interface CreateOrderInput {
  customerName: string;
  deliveryAddress: string;
  deliveryCity: string;
  items: OrderItemLine[];
  amountCents: number;
}

export interface TrackedOrder {
  id: string;
  orderNumber: string;
  status: string;
  items: OrderItemLine[];
  amountCents: number;
  customerName: string | null;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  createdAt: string;
  confirmedAt: string | null;
  packagedAt: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
}

export interface MarketingOrder extends TrackedOrder {
  userId: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  accountType: string | null;
  businessName: string | null;
}

export type OrderAdvanceAction = 'package' | 'dispatch' | 'deliver';

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  items: OrderItemLine[] | null;
  amount_cents: number;
  customer_name: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  created_at: string;
  confirmed_at: string | null;
  packaged_at: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
};

const ORDER_COLUMNS =
  'id,order_number,status,items,amount_cents,customer_name,delivery_address,delivery_city,created_at,confirmed_at,packaged_at,dispatched_at,delivered_at';

const mapOrder = (row: OrderRow): TrackedOrder => ({
  id: row.id,
  orderNumber: row.order_number,
  status: row.status,
  items: row.items ?? [],
  amountCents: row.amount_cents,
  customerName: row.customer_name,
  deliveryAddress: row.delivery_address,
  deliveryCity: row.delivery_city,
  createdAt: row.created_at,
  confirmedAt: row.confirmed_at,
  packagedAt: row.packaged_at,
  dispatchedAt: row.dispatched_at,
  deliveredAt: row.delivered_at,
});

function generateOrderNumber(): string {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GOG-${datePart}-${randomPart}`;
}

async function getCurrentUser() {
  const { data, error } = await getSupabaseClient().auth.getUser();
  if (error || !data.user) {
    throw new Error('Please sign in before placing an order.');
  }
  return data.user;
}

export async function createOrder(input: CreateOrderInput): Promise<TrackedOrder> {
  const supabase = getSupabaseClient();
  const user = await getCurrentUser();

  const row = {
    user_id: user.id,
    order_number: generateOrderNumber(),
    amount_cents: input.amountCents,
    currency: 'ZAR',
    status: 'confirmed',
    items: input.items,
    customer_name: input.customerName.trim(),
    delivery_address: input.deliveryAddress.trim(),
    delivery_city: input.deliveryCity.trim(),
    confirmed_at: new Date().toISOString(),
  };

  // The order number is unique in the database; retry once on the rare collision.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { data, error } = await supabase
      .from('orders')
      .insert(attempt === 0 ? row : { ...row, order_number: generateOrderNumber() })
      .select(ORDER_COLUMNS)
      .single();

    if (!error && data) {
      return mapOrder(data as OrderRow);
    }

    if (error && error.code !== '23505') {
      console.error('CREATE ORDER ERROR:', JSON.stringify(error));
      throw new Error(`Order failed: ${error.message} (${error.code})`);
    }
  }

  throw new Error('We could not place your order right now. Please try again.');
}

export async function getOrderById(orderId: string): Promise<TrackedOrder> {
  const { data, error } = await getSupabaseClient()
    .from('orders')
    .select(ORDER_COLUMNS)
    .eq('id', orderId)
    .single();

  if (error || !data) {
    throw new Error('We could not load this order.');
  }

  return mapOrder(data as OrderRow);
}

export async function fetchCustomerOrders(): Promise<TrackedOrder[]> {
  const user = await getCurrentUser();
  const { data, error } = await getSupabaseClient()
    .from('orders')
    .select(ORDER_COLUMNS)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('We could not load your orders right now. Please try again.');
  }

  return (data ?? []).map((row) => mapOrder(row as OrderRow));
}

type ProfileLite = {
  id: string;
  email: string | null;
  contact_number: string | null;
  account_type: string | null;
  business_name: string | null;
};

/**
 * Marketing view of every order. Profiles are fetched in a second query and
 * joined in code — more reliable than a PostgREST embed, which depends on a
 * detected foreign-key relationship.
 */
export async function fetchMarketingOrders(): Promise<MarketingOrder[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('orders')
    .select(`${ORDER_COLUMNS},user_id`)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Unable to load orders.');
  }

  const rows = (data ?? []) as Array<OrderRow & { user_id: string | null }>;
  const userIds = [...new Set(rows.map((row) => row.user_id).filter(Boolean))] as string[];

  let profilesById = new Map<string, ProfileLite>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id,email,contact_number,account_type,business_name')
      .in('id', userIds);

    profilesById = new Map(
      ((profiles ?? []) as ProfileLite[]).map((profile) => [profile.id, profile]),
    );
  }

  return rows.map((row) => {
    const profile = row.user_id ? profilesById.get(row.user_id) ?? null : null;
    return {
      ...mapOrder(row),
      userId: row.user_id,
      customerEmail: profile?.email ?? null,
      customerPhone: profile?.contact_number ?? null,
      accountType: profile?.account_type ?? null,
      businessName: profile?.business_name ?? null,
    };
  });
}

/**
 * Advance an order to its next fulfilment stage, stamping the timestamp.
 */
export async function advanceOrderStatus(
  orderId: string,
  action: OrderAdvanceAction,
): Promise<TrackedOrder> {
  const timestamp = new Date().toISOString();
  const update =
    action === 'package'
      ? { packaged_at: timestamp, status: 'packaged' }
      : action === 'dispatch'
        ? { dispatched_at: timestamp, status: 'dispatched' }
        : { delivered_at: timestamp, status: 'delivered' };

  const { data, error } = await getSupabaseClient()
    .from('orders')
    .update(update)
    .eq('id', orderId)
    .select(ORDER_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error('We could not update this order. Please try again.');
  }

  return mapOrder(data as OrderRow);
}

/**
 * Live order-status updates for the tracking screen.
 */
export function subscribeToOrderUpdates(
  orderId: string,
  onUpdate: (order: TrackedOrder) => void,
): () => void {
  const supabase = getSupabaseClient();
  const channel: RealtimeChannel = supabase
    .channel(`order-tracking-${orderId}-${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      },
      (payload) => onUpdate(mapOrder(payload.new as OrderRow)),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
