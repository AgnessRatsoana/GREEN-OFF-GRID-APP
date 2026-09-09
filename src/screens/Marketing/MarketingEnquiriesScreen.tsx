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
  root: { flex: 1, backgroundColor: '#F5FAFA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 54, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: '#DDEAEA', backgroundColor: '#FFFFFF' },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 10, backgroundColor: '#EEF9F9' },
  title: { color: '#163838', fontSize: 21, fontWeight: '800' },
  subtitle: { color: '#557070', fontSize: 12, marginTop: 3 },
  content: { padding: 16, paddingBottom: 120, rowGap: 10 },
  card: { borderWidth: 1, borderColor: '#DDEAEA', borderRadius: 16, padding: 15, backgroundColor: '#FFFFFF' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  type: { color: '#78E0DA', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  status: { color: '#557070', fontSize: 11, textTransform: 'capitalize' },
  headerRight: { flexDirection: 'row', alignItems: 'center', columnGap: 8 },
  unreadBadge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: '#24B8B8', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  itemName: { color: '#163838', fontSize: 16, fontWeight: '800', marginTop: 9 },
  customer: { color: '#789292', fontSize: 11, marginTop: 5 },
  message: { color: '#557070', fontSize: 14, lineHeight: 21, marginTop: 8 },
  date: { color: '#789292', fontSize: 11, marginTop: 10 },
  errorText: { color: '#C94A4A', textAlign: 'center' },
  emptyText: { color: '#557070', textAlign: 'center', marginTop: 24 },
});