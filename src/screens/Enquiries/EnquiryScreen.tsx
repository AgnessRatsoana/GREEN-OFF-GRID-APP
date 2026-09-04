import React, { useEffect, useState } from 'react';

import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import { MARKETPLACE_PRODUCTS } from '../../data/marketplace';
import { PACKAGES } from '../../data/packages';
import { createConversationWithMessage, fetchConversation, fetchConversationMessages, sendConversationMessage, type EnquiryConversation, type EnquiryMessage } from '../../services/applications/enquiries';
import { fetchMarketplaceProductById, type MarketplaceProduct as RemoteMarketplaceProduct } from '../../services/marketplace/marketplace';
import type { RootStackParamList } from '../../navigation/types';
import { appTheme } from '../../theme';

const PRODUCT_IMAGE = require('../../assets/images/demoAccesories.jpg');

export function EnquiryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, typeof ROUTES.ENQUIRY>>();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState(
    route.params.itemType === 'product'
      ? "Hi, I'm interested in this product. Please provide me with more information about pricing, availability and how I can proceed with my enquiry."
      : "Hi, I'm interested in this package. Please provide me with more information about the package, pricing and how I can proceed with my enquiry.",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [conversation, setConversation] = useState<EnquiryConversation | null>(null);
  const [messages, setMessages] = useState<EnquiryMessage[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(route.params.conversationId));
  const [remoteProduct, setRemoteProduct] = useState<RemoteMarketplaceProduct | null>(null);

  const itemType = conversation?.itemType ?? route.params.itemType;
  const itemId = conversation?.itemId ?? route.params.itemId;
  const staticProduct = itemType === 'product' && itemId
    ? MARKETPLACE_PRODUCTS.find((product) => product.id === itemId)
    : undefined;
  const productItem = itemType === 'product'
    ? remoteProduct ?? (staticProduct ? { id: staticProduct.id, name: staticProduct.name, price: staticProduct.price, imageUrl: null } : null)
    : null;
  const packageItem = itemType === 'package' && itemId
    ? PACKAGES.find((pkg) => pkg.id === itemId)
    : undefined;
  const item = productItem ?? packageItem;
  const itemName = productItem?.name ?? packageItem?.title ?? '';
  const itemPrice = productItem
    ? `R ${productItem.price.toLocaleString()}`
    : packageItem?.price ?? '';
  const itemImage = productItem?.imageUrl
    ? { uri: productItem.imageUrl }
    : productItem
      ? PRODUCT_IMAGE
      : packageItem?.imageSource;

  useEffect(() => {
    if (!route.params.conversationId) return;
    const conversationId = route.params.conversationId;
    const loadThread = () => Promise.all([fetchConversation(conversationId), fetchConversationMessages(conversationId)])
      .then(([loadedConversation, loadedMessages]) => {
        setConversation(loadedConversation);
        setMessages(loadedMessages);
      })
      .catch((error) => setErrorMessage(error instanceof Error ? error.message : 'Unable to load conversation.'))
      .finally(() => setIsLoading(false));

    loadThread();
    const refreshTimer = setInterval(() => {
      fetchConversationMessages(conversationId).then(setMessages).catch(() => undefined);
    }, 5000);
    return () => clearInterval(refreshTimer);
  }, [route.params.conversationId]);

  useEffect(() => {
    if (itemType !== 'product' || !itemId || MARKETPLACE_PRODUCTS.some((product) => product.id === itemId)) {
      setRemoteProduct(null);
      return;
    }

    // Legacy Home catalogue IDs are not Supabase UUIDs.
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(itemId)) {
      setRemoteProduct(null);
      return;
    }

    fetchMarketplaceProductById(itemId).then(setRemoteProduct).catch(() => setRemoteProduct(null));
  }, [itemId, itemType]);

  const submit = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setErrorMessage('Please enter a message before sending.');
      return;
    }
    if (!item || isSubmitting) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      if (conversation) {
        await sendConversationMessage(conversation.id, trimmedMessage);
        setMessages((previous) => [...previous, { id: `local-${Date.now()}`, conversationId: conversation.id, senderId: '', senderRole: 'customer', body: trimmedMessage, createdAt: new Date().toISOString() }]);
      } else if (route.params.itemType && item) {
        const conversationId = await createConversationWithMessage({ itemType: route.params.itemType, itemId: item.id, message: trimmedMessage });
        navigation.replace(ROUTES.ENQUIRY, { conversationId });
        return;
      }
      setMessage('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'We could not send your enquiry right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerButton} hitSlop={8}>
          <Ionicons name="arrow-back" size={21} color="#1a3f3f" />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Enquire</Text>
          <Text style={styles.headerSubtitle}>Send us your enquiry</Text>
        </View>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerButton} hitSlop={8}>
          <Ionicons name="close" size={22} color="#1a3f3f" />
        </Pressable>
      </View>

      {isLoading ? <View style={styles.loading}><ActivityIndicator color="#24b8b8" /></View> : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!item && !conversation ? (
            <View style={styles.notice}><Text style={styles.noticeText}>This item is no longer available.</Text></View>
          ) : conversation ? null : (
            <View style={styles.itemCard}>
              <Image source={itemImage} style={styles.itemImage} contentFit="cover" />
              <View style={styles.itemDetails}>
                <Text style={styles.itemType}>{route.params.itemType === 'product' ? 'PRODUCT' : 'PACKAGE'}</Text>
                <Text style={styles.itemName}>{itemName}</Text>
                <Text style={styles.itemPrice}>{itemPrice}</Text>
              </View>
            </View>
          )}

          {conversation ? <View style={styles.thread}>{messages.map((threadMessage) => <View key={threadMessage.id} style={[styles.bubble, threadMessage.senderRole === 'customer' ? styles.customerBubble : styles.marketingBubble]}><Text style={styles.bubbleText}>{threadMessage.body}</Text><Text style={styles.bubbleTime}>{new Date(threadMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text></View>)}</View> : <Text style={styles.fieldLabel}>Your message</Text>}
          <TextInput
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
            placeholder="Type a message..."
            placeholderTextColor="#789292"
            style={styles.input}
            maxLength={4000}
            editable={!isSubmitting}
          />
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          <Pressable
            style={[styles.sendButton, (!message.trim() || !item || isSubmitting) && styles.sendButtonDisabled]}
            onPress={submit}
            disabled={!message.trim() || !item || isSubmitting}
          >
            {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.sendText}>{conversation ? 'Send' : 'Send enquiry'}</Text><Ionicons name="send" size={16} color="#FFFFFF" /></>}
          </Pressable>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: appTheme.spacing.md, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(36,184,184,0.18)' },
  headerButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, marginLeft: 4 },
  headerTitle: { color: '#1a3f3f', fontSize: 21, fontWeight: '800' },
  headerSubtitle: { color: '#668080', fontSize: 12, marginTop: 2 },
  content: { padding: appTheme.spacing.md, rowGap: appTheme.spacing.sm },
  itemCard: { flexDirection: 'row', borderWidth: 1, borderColor: 'rgba(36,184,184,0.22)', borderRadius: 14, padding: 10, backgroundColor: '#f7fdfd', minHeight: 110 },
  itemImage: { width: 96, height: 90, borderRadius: 10, backgroundColor: '#dbeeee' },
  itemDetails: { flex: 1, paddingLeft: 12, justifyContent: 'center' },
  itemType: { color: '#24b8b8', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  itemName: { color: '#123f3f', fontSize: 16, fontWeight: '800', marginTop: 5 },
  itemPrice: { color: '#1a3f3f', fontSize: 15, fontWeight: '700', marginTop: 5 },
  fieldLabel: { color: '#1a3f3f', fontSize: 14, fontWeight: '700', marginTop: 12 },
  input: { minHeight: 150, borderWidth: 1, borderColor: '#c7dddd', borderRadius: 12, padding: 14, color: '#1a3f3f', fontSize: 15, lineHeight: 22, backgroundColor: '#FFFFFF' },
  sendButton: { minHeight: 50, borderRadius: 12, backgroundColor: '#24b8b8', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', columnGap: 9, marginTop: 10 },
  sendButtonDisabled: { opacity: 0.45 },
  sendText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  errorText: { color: '#b34040', fontSize: 13 },
  notice: { borderRadius: 12, backgroundColor: '#fff6f2', padding: 16 },
  noticeText: { color: '#9a4d3c', fontSize: 14 },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  successIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#24b8b8', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  successTitle: { color: '#1a3f3f', fontSize: 24, fontWeight: '800' },
  successText: { color: '#668080', fontSize: 15, lineHeight: 23, textAlign: 'center', marginTop: 10 },
  doneButton: { width: '100%', minHeight: 50, borderRadius: 12, backgroundColor: '#24b8b8', alignItems: 'center', justifyContent: 'center', marginTop: 26 },
  doneText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  thread: { rowGap: 10, paddingVertical: 8 },
  bubble: { maxWidth: '82%', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 16 },
  customerBubble: { alignSelf: 'flex-end', backgroundColor: '#d7f6f2', borderBottomRightRadius: 4 },
  marketingBubble: { alignSelf: 'flex-start', backgroundColor: '#f0f3f3', borderBottomLeftRadius: 4 },
  bubbleText: { color: '#123f3f', fontSize: 15, lineHeight: 21 },
  bubbleTime: { color: '#789292', fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },
});