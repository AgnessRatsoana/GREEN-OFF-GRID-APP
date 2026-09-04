import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import { MARKETPLACE_PRODUCTS } from '../../data/marketplace';
import { PACKAGES } from '../../data/packages';
import type { RootStackParamList } from '../../navigation/types';
import {
  fetchMarketingConversations,
  subscribeToEnquiryActivity,
  type EnquiryConversation,
} from '../../services/applications/enquiries';

export function MarketingEnquiriesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<EnquiryConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadEnquiries = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      setErrorMessage(null);
      setConversations(await fetchMarketingConversations());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load customer enquiries.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { loadEnquiries(); }, []);

  // Live updates: a new customer message refreshes the list immediately.
  useEffect(() => {
    const unsubscribe = subscribeToEnquiryActivity(() => {
      loadEnquiries(true);
    });
    return unsubscribe;
  }, []);

  const getItemName = (conversation: EnquiryConversation) => {
    if (conversation.itemType === 'product') {
      return MARKETPLACE_PRODUCTS.find((item) => item.id === conversation.itemId)?.name ?? 'Product enquiry';
    }
    if (conversation.itemType === 'order') {
      return 'Order enquiry';
    }
    return PACKAGES.find((item) => item.id === conversation.itemId)?.title ?? 'Package enquiry';
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={8}><Ionicons name="arrow-back" size={22} color="#24b8b8" /></Pressable>
        <View><Text style={styles.title}>Customer Enquiries</Text><Text style={styles.subtitle}>Review customer messages</Text></View>
      </View>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadEnquiries(true)} tintColor="#24b8b8" />}
      >
        {isLoading ? <ActivityIndicator color="#24b8b8" /> : null}
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {!isLoading && !errorMessage && conversations.length === 0 ? <Text style={styles.emptyText}>No customer enquiries yet.</Text> : null}
        {conversations.map((conversation) => (
          <Pressable key={conversation.id} style={styles.card} onPress={() => navigation.navigate(ROUTES.ENQUIRY, { conversationId: conversation.id })}>
            <View style={styles.cardHeader}>
              <Text style={styles.type}>{conversation.itemType.toUpperCase()}</Text>
              <View style={styles.headerRight}>
                {conversation.unreadCount > 0 ? (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{conversation.unreadCount}</Text>
                  </View>
                ) : null}
                <Text style={styles.status}>{conversation.status.replace('_', ' ')}</Text>
              </View>
            </View>
            <Text style={styles.itemName}>{getItemName(conversation)}</Text>
            <Text style={styles.customer}>Customer conversation</Text>
            <Text style={styles.message}>Open conversation and reply</Text>
            <Text style={styles.date}>{new Date(conversation.updatedAt).toLocaleString()}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(36,184,184,0.18)' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  title: { color: '#123f3f', fontSize: 21, fontWeight: '800' },
  subtitle: { color: '#668080', fontSize: 12, marginTop: 2 },
  content: { padding: 18, rowGap: 10 },
  card: { borderWidth: 1, borderColor: 'rgba(36,184,184,0.2)', borderRadius: 14, padding: 14, backgroundColor: '#f7fdfd' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  type: { color: '#24b8b8', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  status: { color: '#668080', fontSize: 11, textTransform: 'capitalize' },
  headerRight: { flexDirection: 'row', alignItems: 'center', columnGap: 8 },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#24b8b8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  itemName: { color: '#123f3f', fontSize: 16, fontWeight: '800', marginTop: 7 },
  customer: { color: '#789292', fontSize: 11, marginTop: 5 },
  message: { color: '#4f6e6e', fontSize: 14, lineHeight: 21, marginTop: 8 },
  date: { color: '#789292', fontSize: 11, marginTop: 10 },
  errorText: { color: '#b34040', textAlign: 'center' },
  emptyText: { color: '#668080', textAlign: 'center', marginTop: 24 },
});