import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../../navigation/types';
import { ROUTES } from '../../constants/routes';
import {
  fetchCustomerConversations,
  subscribeToEnquiryActivity,
  type EnquiryConversation,
} from '../../services/applications/enquiries';
import { MARKETPLACE_PRODUCTS } from '../../data/marketplace';
import { PACKAGES } from '../../data/packages';
import { appTheme } from '../../theme';
import type { AppTheme } from '../../theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { FLOATING_NAV_CONTENT_INSET } from '../../components/common/FloatingBottomNav';

export function MessagesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<EnquiryConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const theme = useAppTheme();
  const styles = createStyles(theme);

  const loadEnquiries = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      setErrorMessage(null);
      setConversations(await fetchCustomerConversations());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load messages.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { loadEnquiries(); }, []);

  // Live updates: a new marketing reply refreshes the list immediately.
  useEffect(() => {
    const unsubscribe = subscribeToEnquiryActivity(() => {
      loadEnquiries(true);
    });
    return unsubscribe;
  }, []);

  const getItemName = (conversation: EnquiryConversation) => {
    if (conversation.itemType === 'product') return MARKETPLACE_PRODUCTS.find((item) => item.id === conversation.itemId)?.name ?? 'Product enquiry';
    if (conversation.itemType === 'order') return 'Order enquiry';
    return PACKAGES.find((item) => item.id === conversation.itemId)?.title ?? 'Package enquiry';
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.primaryAccent} />
        </Pressable>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.iconDecor}>
          <Ionicons name="chatbubble-ellipses-outline" size={22} color={theme.colors.primaryAccent} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + FLOATING_NAV_CONTENT_INSET }]}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadEnquiries(true)} tintColor={theme.colors.primaryAccent} />}
      >
        {isLoading ? <ActivityIndicator color={theme.colors.primaryAccent} /> : null}
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {!isLoading && !errorMessage && conversations.length === 0 ? (
          <View style={styles.contentWrap}><Text style={styles.title}>No messages yet</Text><Text style={styles.subtitle}>Your product and package enquiries will appear here.</Text></View>
        ) : null}
        {conversations.map((conversation) => (
          <Pressable
            key={conversation.id}
            style={styles.messageCard}
            onPress={() => {
              const rootNavigation = navigation.getParent() as unknown as
                | NativeStackNavigationProp<RootStackParamList>
                | undefined;
              rootNavigation?.navigate(ROUTES.ENQUIRY, { conversationId: conversation.id });
            }}
          >
            <View style={styles.messageHeader}>
              <Text style={styles.itemType}>{conversation.itemType.toUpperCase()}</Text>
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
            <Text style={styles.messageText}>Open conversation</Text>
            <Text style={styles.dateText}>{new Date(conversation.updatedAt).toLocaleDateString()}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: appTheme.spacing.md,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(36,184,184,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: appTheme.spacing.sm,
  },
  headerTitle: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  iconDecor: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(36,184,184,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: appTheme.spacing.md,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: appTheme.spacing.sm,
    color: theme.colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
  content: { padding: appTheme.spacing.md, rowGap: appTheme.spacing.sm },
  messageCard: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 14, backgroundColor: theme.colors.surface },
  messageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemType: { color: theme.colors.primaryAccent, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  status: { color: theme.colors.textSecondary, fontSize: 11, textTransform: 'capitalize' },
  headerRight: { flexDirection: 'row', alignItems: 'center', columnGap: 8 },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primaryAccent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  itemName: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: '800', marginTop: 7 },
  messageText: { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 8 },
  dateText: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 10 },
  errorText: { color: '#b34040', textAlign: 'center', marginTop: 12 },
});
