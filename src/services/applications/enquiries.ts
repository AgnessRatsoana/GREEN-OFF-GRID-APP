import type { RealtimeChannel } from '@supabase/supabase-js';

import { getSupabaseClient } from '../auth/supabaseClient';

export type EnquiryItemType = 'product' | 'package' | 'order';
export type EnquirySenderRole = 'customer' | 'marketing';

export interface CreateCustomerEnquiryInput {
  itemType: EnquiryItemType;
  itemId: string;
  message: string;
}

export interface EnquiryConversation {
  id: string;
  customerId: string;
  itemType: EnquiryItemType;
  itemId: string;
  status: 'new' | 'in_progress' | 'resolved';
  updatedAt: string;
  customerLastReadAt: string;
  marketingLastReadAt: string;
  unreadCount: number;
}

export interface EnquiryMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: EnquirySenderRole;
  body: string;
  createdAt: string;
}

type ConversationRow = {
  id: string;
  customer_id: string;
  item_type: EnquiryItemType;
  item_id: string;
  status: EnquiryConversation['status'];
  updated_at: string;
  customer_last_read_at: string;
  marketing_last_read_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: EnquirySenderRole;
  body: string;
  created_at: string;
};

type MessageActivityRow = Pick<MessageRow, 'conversation_id' | 'sender_role' | 'created_at'>;

const CONVERSATION_COLUMNS =
  'id,customer_id,item_type,item_id,status,updated_at,customer_last_read_at,marketing_last_read_at';
const MESSAGE_COLUMNS = 'id,conversation_id,sender_id,sender_role,body,created_at';

const mapConversation = (row: ConversationRow): EnquiryConversation => ({
  id: row.id,
  customerId: row.customer_id,
  itemType: row.item_type,
  itemId: row.item_id,
  status: row.status,
  updatedAt: row.updated_at,
  customerLastReadAt: row.customer_last_read_at,
  marketingLastReadAt: row.marketing_last_read_at,
  unreadCount: 0,
});

const mapMessage = (row: MessageRow): EnquiryMessage => ({
  id: row.id,
  conversationId: row.conversation_id,
  senderId: row.sender_id,
  senderRole: row.sender_role,
  body: row.body,
  createdAt: row.created_at,
});

async function getCurrentUser() {
  const { data, error } = await getSupabaseClient().auth.getUser();
  if (error || !data.user) {
    throw new Error('Please sign in before using messages.');
  }
  return data.user;
}

/**
 * Sender/viewer role is always resolved from the database profile,
 * never from stale auth metadata or client-provided values.
 */
export async function getViewerRole(): Promise<EnquirySenderRole> {
  const supabase = getSupabaseClient();
  const user = await getCurrentUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return profile?.role === 'marketing' || profile?.role === 'admin'
    ? 'marketing'
    : 'customer';
}

export async function createConversationWithMessage(
  input: CreateCustomerEnquiryInput,
): Promise<string> {
  const message = input.message.trim();
  if (!message) throw new Error('Please enter a message before sending.');

  const supabase = getSupabaseClient();
  const user = await getCurrentUser();

  const { data: existingConversation } = await supabase
    .from('enquiry_conversations')
    .select('id')
    .eq('customer_id', user.id)
    .eq('item_type', input.itemType)
    .eq('item_id', input.itemId)
    .maybeSingle();

  const { data: conversation, error: conversationError } = existingConversation
    ? { data: existingConversation, error: null }
    : await supabase
        .from('enquiry_conversations')
        .insert({
          customer_id: user.id,
          item_type: input.itemType,
          item_id: input.itemId,
          status: 'new',
        })
        .select('id')
        .single();

  if (conversationError || !conversation) {
    throw new Error('We could not start this conversation right now. Please try again.');
  }

  const { error: messageError } = await supabase.from('enquiry_messages').insert({
    conversation_id: conversation.id,
    sender_id: user.id,
    sender_role: 'customer',
    body: message,
  });

  if (messageError) {
    throw new Error('We could not send your message right now. Please try again.');
  }

  return conversation.id;
}

export async function fetchConversation(id: string): Promise<EnquiryConversation> {
  const { data, error } = await getSupabaseClient()
    .from('enquiry_conversations')
    .select(CONVERSATION_COLUMNS)
    .eq('id', id)
    .single();

  if (error || !data) throw new Error('We could not load this conversation.');
  return mapConversation(data as ConversationRow);
}

export async function fetchConversationMessages(id: string): Promise<EnquiryMessage[]> {
  const { data, error } = await getSupabaseClient()
    .from('enquiry_messages')
    .select(MESSAGE_COLUMNS)
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  if (error) throw new Error('We could not load messages right now. Please try again.');
  return (data ?? []).map((row) => mapMessage(row as MessageRow));
}

export async function sendConversationMessage(
  conversationId: string,
  body: string,
): Promise<EnquiryMessage> {
  const message = body.trim();
  if (!message) throw new Error('Please enter a message before sending.');

  const supabase = getSupabaseClient();
  const user = await getCurrentUser();
  const role = await getViewerRole();

  const { data, error } = await supabase
    .from('enquiry_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      sender_role: role,
      body: message,
    })
    .select(MESSAGE_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error('We could not send your message right now. Please try again.');
  }

  return mapMessage(data as MessageRow);
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const role = await getViewerRole();
  const column = role === 'customer' ? 'customer_last_read_at' : 'marketing_last_read_at';

  const { error } = await getSupabaseClient()
    .from('enquiry_conversations')
    .update({ [column]: new Date().toISOString() })
    .eq('id', conversationId);

  if (error) throw new Error('We could not update this conversation.');
}

async function withUnreadCounts(
  conversations: EnquiryConversation[],
  viewerRole: EnquirySenderRole,
): Promise<EnquiryConversation[]> {
  if (conversations.length === 0) return conversations;

  const supabase = getSupabaseClient();
  const ids = conversations.map((conversation) => conversation.id);
  const { data, error } = await supabase
    .from('enquiry_messages')
    .select('conversation_id,sender_role,created_at')
    .in('conversation_id', ids);

  if (error || !data) return conversations;

  const otherRole: EnquirySenderRole = viewerRole === 'customer' ? 'marketing' : 'customer';
  const activity = data as MessageActivityRow[];

  return conversations.map((conversation) => {
    const lastReadAt =
      viewerRole === 'customer'
        ? conversation.customerLastReadAt
        : conversation.marketingLastReadAt;
    const lastReadTime = new Date(lastReadAt).getTime();

    const unreadCount = activity.filter(
      (activityMessage) =>
        activityMessage.conversation_id === conversation.id &&
        activityMessage.sender_role === otherRole &&
        new Date(activityMessage.created_at).getTime() > lastReadTime,
    ).length;

    return { ...conversation, unreadCount };
  });
}

export async function fetchCustomerConversations(): Promise<EnquiryConversation[]> {
  const user = await getCurrentUser();
  const { data, error } = await getSupabaseClient()
    .from('enquiry_conversations')
    .select(CONVERSATION_COLUMNS)
    .eq('customer_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) throw new Error('We could not load your messages right now. Please try again.');

  const conversations = (data ?? []).map((row) => mapConversation(row as ConversationRow));
  return withUnreadCounts(conversations, 'customer');
}

export async function fetchMarketingConversations(): Promise<EnquiryConversation[]> {
  const { data, error } = await getSupabaseClient()
    .from('enquiry_conversations')
    .select(CONVERSATION_COLUMNS)
    .order('updated_at', { ascending: false });

  if (error) throw new Error('Unable to load customer conversations.');

  const conversations = (data ?? []).map((row) => mapConversation(row as ConversationRow));
  return withUnreadCounts(conversations, 'marketing');
}

export async function fetchViewerUnreadTotal(): Promise<number> {
  const role = await getViewerRole();
  const conversations =
    role === 'customer'
      ? await fetchCustomerConversations()
      : await fetchMarketingConversations();

  return conversations.reduce((total, conversation) => total + conversation.unreadCount, 0);
}

/**
 * supabase-js caches channels by name. A fixed name would make every
 * subscriber share one channel instance, and calling .on() after .subscribe()
 * throws. Unique names keep each subscription independent.
 */
let realtimeChannelCounter = 0;
function createRealtimeChannelName(prefix: string): string {
  realtimeChannelCounter += 1;
  return `${prefix}-${realtimeChannelCounter}`;
}

/**
 * Live message stream for one open conversation. RLS ensures a customer only
 * receives rows from their own conversations.
 */
export function subscribeToConversationMessages(
  conversationId: string,
  onMessage: (message: EnquiryMessage) => void,
): () => void {
  const supabase = getSupabaseClient();
  const channel: RealtimeChannel = supabase
    .channel(createRealtimeChannelName(`enquiry-thread-${conversationId}`))
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'enquiry_messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onMessage(mapMessage(payload.new as MessageRow)),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

/**
 * Global activity stream used for conversation lists and the unread badge.
 */
export function subscribeToEnquiryActivity(
  onActivity: (message: EnquiryMessage) => void,
): () => void {
  const supabase = getSupabaseClient();
  const channel: RealtimeChannel = supabase
    .channel(createRealtimeChannelName('enquiry-activity'))
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'enquiry_messages' },
      (payload) => onActivity(mapMessage(payload.new as MessageRow)),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
