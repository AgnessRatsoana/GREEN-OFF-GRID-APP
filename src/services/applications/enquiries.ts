import { getSupabaseClient } from '../auth/supabaseClient';

export type EnquiryItemType = 'product' | 'package';

export interface CreateCustomerEnquiryInput {
  itemType: EnquiryItemType;
  itemId: string;
  message: string;
}

export async function createCustomerEnquiry(input: CreateCustomerEnquiryInput): Promise<void> {
  const message = input.message.trim();
  if (!message) {
    throw new Error('Please enter a message before sending.');
  }

  const supabase = getSupabaseClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getUser();

  if (sessionError) {
    throw new Error('We could not verify your account. Please try again.');
  }

  if (!sessionData.user) {
    throw new Error('Please sign in before sending an enquiry.');
  }

  const { error } = await supabase.from('customer_enquiries').insert({
    customer_id: sessionData.user.id,
    item_type: input.itemType,
    item_id: input.itemId,
    message,
    status: 'new',
  });

  if (error) {
    throw new Error('We could not send your enquiry right now. Please try again.');
  }
}

export interface CustomerEnquiry {
  id: string;
  customerId: string;
  itemType: EnquiryItemType;
  itemId: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved';
  createdAt: string;
}

type CustomerEnquiryRow = {
  id: string;
  customer_id: string;
  item_type: EnquiryItemType;
  item_id: string;
  message: string;
  status: CustomerEnquiry['status'];
  created_at: string;
};

const mapEnquiry = (row: CustomerEnquiryRow): CustomerEnquiry => ({
  id: row.id,
  customerId: row.customer_id,
  itemType: row.item_type,
  itemId: row.item_id,
  message: row.message,
  status: row.status,
  createdAt: row.created_at,
});

const ENQUIRY_COLUMNS = 'id,customer_id,item_type,item_id,message,status,created_at';

export async function fetchCustomerEnquiries(): Promise<CustomerEnquiry[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('customer_enquiries')
    .select(ENQUIRY_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('We could not load your messages right now. Please try again.');
  }

  return (data ?? []).map((row) => mapEnquiry(row as CustomerEnquiryRow));
}

export async function fetchMarketingEnquiries(): Promise<CustomerEnquiry[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('customer_enquiries')
    .select(ENQUIRY_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Unable to load customer enquiries.');
  }

  return (data ?? []).map((row) => mapEnquiry(row as CustomerEnquiryRow));
}

export interface EnquiryConversation {
  id: string;
  customerId: string;
  itemType: EnquiryItemType;
  itemId: string;
  status: 'new' | 'in_progress' | 'resolved';
  updatedAt: string;
}

export interface EnquiryMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: 'customer' | 'marketing';
  body: string;
  createdAt: string;
}

type ConversationRow = Omit<EnquiryConversation, 'customerId' | 'itemType' | 'itemId' | 'updatedAt'> & {
  customer_id: string;
  item_type: EnquiryItemType;
  item_id: string;
  updated_at: string;
};

type MessageRow = Omit<EnquiryMessage, 'conversationId' | 'senderId' | 'senderRole' | 'createdAt'> & {
  conversation_id: string;
  sender_id: string;
  sender_role: 'customer' | 'marketing';
  created_at: string;
};

const CONVERSATION_COLUMNS = 'id,customer_id,item_type,item_id,status,updated_at';
const MESSAGE_COLUMNS = 'id,conversation_id,sender_id,sender_role,body,created_at';

const mapConversation = (row: ConversationRow): EnquiryConversation => ({
  id: row.id,
  customerId: row.customer_id,
  itemType: row.item_type,
  itemId: row.item_id,
  status: row.status,
  updatedAt: row.updated_at,
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

export async function createConversationWithMessage(input: CreateCustomerEnquiryInput): Promise<string> {
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
        .insert({ customer_id: user.id, item_type: input.itemType, item_id: input.itemId, status: 'new' })
        .select('id')
        .single();
  if (conversationError || !conversation) throw new Error('We could not start this conversation right now. Please try again.');

  const { error: messageError } = await supabase.from('enquiry_messages').insert({
    conversation_id: conversation.id,
    sender_id: user.id,
    sender_role: 'customer',
    body: message,
  });
  if (messageError) throw new Error('We could not send your message right now. Please try again.');
  return conversation.id;
}

export async function fetchConversation(id: string): Promise<EnquiryConversation> {
  const { data, error } = await getSupabaseClient().from('enquiry_conversations').select(CONVERSATION_COLUMNS).eq('id', id).single();
  if (error || !data) throw new Error('We could not load this conversation.');
  return mapConversation(data as ConversationRow);
}

export async function fetchConversationMessages(id: string): Promise<EnquiryMessage[]> {
  const { data, error } = await getSupabaseClient().from('enquiry_messages').select(MESSAGE_COLUMNS).eq('conversation_id', id).order('created_at', { ascending: true });
  if (error) throw new Error('We could not load messages right now. Please try again.');
  return (data ?? []).map((row) => mapMessage(row as MessageRow));
}

export async function sendConversationMessage(conversationId: string, body: string): Promise<void> {
  const message = body.trim();
  if (!message) throw new Error('Please enter a message before sending.');
  const supabase = getSupabaseClient();
  const user = await getCurrentUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = profile?.role === 'marketing' || profile?.role === 'admin' ? 'marketing' : 'customer';
  const { error } = await supabase.from('enquiry_messages').insert({ conversation_id: conversationId, sender_id: user.id, sender_role: role, body: message });
  if (error) throw new Error('We could not send your message right now. Please try again.');
}

export async function fetchCustomerConversations(): Promise<EnquiryConversation[]> {
  const user = await getCurrentUser();
  const { data, error } = await getSupabaseClient().from('enquiry_conversations').select(CONVERSATION_COLUMNS).eq('customer_id', user.id).order('updated_at', { ascending: false });
  if (error) throw new Error('We could not load your messages right now. Please try again.');
  return (data ?? []).map((row) => mapConversation(row as ConversationRow));
}

export async function fetchMarketingConversations(): Promise<EnquiryConversation[]> {
  const { data, error } = await getSupabaseClient().from('enquiry_conversations').select(CONVERSATION_COLUMNS).order('updated_at', { ascending: false });
  if (error) throw new Error('Unable to load customer conversations.');
  return (data ?? []).map((row) => mapConversation(row as ConversationRow));
}