import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ROUTES } from '../../constants/routes';
import type { RootStackParamList } from '../../navigation/types';
import {
  deleteCarouselItem,
  fetchCarouselItems,
  saveCarouselItem,
  subscribeToCarouselItems,
  uploadCarouselMedia,
  type CarouselItem,
  type CarouselMediaType,
} from '../../services/marketing/carousel';
import { useAuthStore } from '../../store/authStore';

const builtInSlides = [
  { id: 'built-in-1', title: "We've got your back", image: require('../../assets/images/franchise-outlet-4.jpeg') },
  { id: 'built-in-2', title: 'Power every install with quality gear', image: require('../../assets/images/panellCorousel.jpg') },
  { id: 'built-in-3', title: 'From chargers to clamps, build smarter', image: require('../../assets/images/sollarCorousel.jpg') },
];

function CarouselPreviewMedia({ type, uri }: { type: CarouselMediaType; uri: string }) {
  const player = useVideoPlayer(type === 'video' ? uri : '', (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
    videoPlayer.play();
  });

  if (type === 'video') {
    return <VideoView player={player} style={styles.previewMedia} contentFit="cover" nativeControls={false} />;
  }

  return <Image source={{ uri }} style={styles.previewMedia} resizeMode="cover" />;
}

export function MarketingCarouselScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const role = useAuthStore((state) => state.user?.role);
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [mediaType, setMediaType] = useState<CarouselMediaType>('image');
  const [mediaUri, setMediaUri] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [mainTitle, setMainTitle] = useState('');
  const [pointOne, setPointOne] = useState('');
  const [pointTwo, setPointTwo] = useState('');
  const [primaryButtonText, setPrimaryButtonText] = useState('Explore');
  const [secondaryButtonText, setSecondaryButtonText] = useState('Learn more');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await fetchCarouselItems(true));
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load carousel content.');
    }
  }, []);

  useEffect(() => {
    if (role !== 'marketing' && role !== 'admin') {
      navigation.goBack();
      return;
    }
    load();
    const unsubscribe = subscribeToCarouselItems(load);
    return unsubscribe;
  }, [load, navigation, role]);

  const pickMedia = async (type: CarouselMediaType) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow media access to choose carousel content.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'image' ? ['images'] : ['videos'],
      allowsEditing: type === 'image',
      aspect: [16, 9],
      quality: 0.85,
      videoMaxDuration: 30,
    });

    if (result.canceled || !result.assets[0]) return;

    setIsUploading(true);
    try {
      setMediaType(type);
      setMediaUri(await uploadCarouselMedia(result.assets[0].uri, type));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload carousel media.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setEditingId(undefined);
    setMediaType('image');
    setMediaUri('');
    setSubtitle('');
    setMainTitle('');
    setPointOne('');
    setPointTwo('');
    setPrimaryButtonText('Explore');
    setSecondaryButtonText('Learn more');
    setDisplayOrder('0');
    setIsActive(true);
  };

  const save = async () => {
    if (!mediaUri || !mainTitle.trim()) {
      Alert.alert('Missing details', 'Choose media and enter the main carousel title.');
      return;
    }

    setIsSaving(true);
    try {
      await saveCarouselItem({
        id: editingId,
        type: mediaType,
        uri: mediaUri,
        subtitle,
        mainTitle,
        pointOne,
        pointTwo,
        primaryButtonText,
        secondaryButtonText,
        displayOrder: Number(displayOrder) || 0,
        isActive,
      });
      resetForm();
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save carousel content.');
    } finally {
      setIsSaving(false);
    }
  };

  const edit = (item: CarouselItem) => {
    setEditingId(item.id);
    setMediaType(item.type);
    setMediaUri(item.uri);
    setSubtitle(item.subtitle);
    setMainTitle(item.mainTitle);
    setPointOne(item.pointOne);
    setPointTwo(item.pointTwo);
    setPrimaryButtonText(item.primaryButtonText);
    setSecondaryButtonText(item.secondaryButtonText);
    setDisplayOrder(String(item.displayOrder));
    setIsActive(item.isActive);
  };

  const remove = (item: CarouselItem) => {
    Alert.alert('Delete carousel content?', item.mainTitle, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteCarouselItem(item.id);
          if (editingId === item.id) resetForm();
          await load();
        } catch (deleteError) {
          setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete carousel content.');
        }
      } },
    ]);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={21} color="#0F6464" />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>MARKETING STUDIO</Text>
          <Text style={styles.headerTitle}>Carousel manager</Text>
        </View>
        <Ionicons name="images-outline" size={24} color="#24B8B8" />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Client carousel</Text>
          <Text style={styles.introText}>Use the same fields that appear on the client dashboard. Changes are shared immediately with every client device.</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{editingId ? 'Edit carousel slide' : 'Create carousel slide'}</Text>
            {editingId ? <Pressable onPress={resetForm}><Text style={styles.cancelText}>Cancel edit</Text></Pressable> : null}
          </View>

          <View style={styles.mediaRow}>
            <Pressable style={[styles.mediaButton, mediaType === 'image' && styles.mediaButtonActive]} onPress={() => pickMedia('image')}>
              <Ionicons name="image-outline" size={18} color={mediaType === 'image' ? '#FFFFFF' : '#0F6464'} />
              <Text style={[styles.mediaButtonText, mediaType === 'image' && styles.mediaButtonTextActive]}>Upload image</Text>
            </Pressable>
            <Pressable style={[styles.mediaButton, mediaType === 'video' && styles.mediaButtonActive]} onPress={() => pickMedia('video')}>
              <Ionicons name="videocam-outline" size={18} color={mediaType === 'video' ? '#FFFFFF' : '#0F6464'} />
              <Text style={[styles.mediaButtonText, mediaType === 'video' && styles.mediaButtonTextActive]}>Upload video</Text>
            </Pressable>
          </View>
          {isUploading ? <ActivityIndicator color="#24B8B8" /> : null}
          {mediaUri ? <View style={styles.mediaPreview}><Text style={styles.mediaPreviewText}>{mediaType === 'video' ? 'Video uploaded and ready' : 'Image uploaded and ready'}</Text></View> : null}

          <TextInput value={subtitle} onChangeText={setSubtitle} placeholder="Subtitle e.g. Got a FRANCHISE?" placeholderTextColor="#789292" style={styles.input} />
          <TextInput value={mainTitle} onChangeText={setMainTitle} placeholder="Main title e.g. We've got your back" placeholderTextColor="#789292" style={styles.input} />
          <TextInput value={pointOne} onChangeText={setPointOne} placeholder="First bullet point" placeholderTextColor="#789292" style={styles.input} />
          <TextInput value={pointTwo} onChangeText={setPointTwo} placeholder="Second bullet point" placeholderTextColor="#789292" style={styles.input} />
          <View style={styles.splitRow}>
            <TextInput value={primaryButtonText} onChangeText={setPrimaryButtonText} placeholder="Primary button" placeholderTextColor="#789292" style={[styles.input, styles.splitInput]} />
            <TextInput value={secondaryButtonText} onChangeText={setSecondaryButtonText} placeholder="Secondary button" placeholderTextColor="#789292" style={[styles.input, styles.splitInput]} />
          </View>
          <View style={styles.settingsRow}>
            <TextInput value={displayOrder} onChangeText={setDisplayOrder} keyboardType="number-pad" placeholder="Order" placeholderTextColor="#789292" style={[styles.input, styles.orderInput]} />
            <View style={styles.activeRow}><Text style={styles.activeLabel}>Visible to clients</Text><Switch value={isActive} onValueChange={setIsActive} trackColor={{ false: '#CBD8D8', true: '#8ADBD7' }} thumbColor={isActive ? '#0F6464' : '#FFFFFF'} /></View>
          </View>
          {mediaUri ? (
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>LIVE PREVIEW</Text>
              <View style={styles.previewSlide}>
                <CarouselPreviewMedia type={mediaType} uri={mediaUri} />
                <LinearGradient colors={['#24b8b8A6', '#24b8b87A', '#24b8b83D', '#24b8b800']} locations={[0, 0.32, 0.56, 0.78]} start={{ x: 0, y: 0.22 }} end={{ x: 1, y: 0.04 }} style={styles.previewOverlay} />
                <View style={styles.previewContent}>
                  <Text style={styles.previewSubtitle}>{subtitle || 'Subtitle'}</Text>
                  <Text style={styles.previewTitle}>{mainTitle || 'Main title'}</Text>
                  <Text style={styles.previewPoint}>⚡ {pointOne || 'First bullet point'}</Text>
                  <Text style={styles.previewPoint}>⚡ {pointTwo || 'Second bullet point'}</Text>
                  <View style={styles.previewButtons}><Text style={styles.previewPrimary}>{primaryButtonText || 'Explore'}</Text><Text style={styles.previewSecondary}>{secondaryButtonText || 'Learn more'}</Text></View>
                </View>
              </View>
            </View>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.saveButton} onPress={save} disabled={isSaving || isUploading}>
            {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <><Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" /><Text style={styles.saveButtonText}>{editingId ? 'Save changes' : 'Publish carousel slide'}</Text></>}
          </Pressable>
        </View>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>All carousel slides</Text><Text style={styles.count}>{items.length}</Text></View>
        <Text style={styles.builtInHeading}>Built-in client slides</Text>
        {builtInSlides.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemMedia}><Image source={item.image} style={styles.itemImage} resizeMode="cover" /></View>
            <View style={styles.itemBody}>
              <Text style={styles.itemType}>BUILT-IN · CLIENT DEFAULT</Text>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemMeta}>Available on the client dashboard fallback carousel.</Text>
            </View>
          </View>
        ))}
        {items.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={[styles.itemMedia, item.type === 'video' && styles.videoMedia]}>
              {item.type === 'image' ? (
                <Image source={{ uri: item.uri }} style={styles.itemImage} resizeMode="cover" />
              ) : (
                <>
                  <Ionicons name="videocam" size={23} color="#24B8B8" />
                  <Text style={styles.videoBadge}>VIDEO</Text>
                </>
              )}
            </View>
            <View style={styles.itemBody}>
              <Text style={styles.itemType}>{item.type.toUpperCase()} · {item.isActive ? 'VISIBLE' : 'HIDDEN'}</Text>
              <Text style={styles.itemTitle}>{item.mainTitle}</Text>
              <Text style={styles.itemMeta}>{item.subtitle || 'No subtitle'} · Order {item.displayOrder}</Text>
              <Text style={styles.itemDate}>Updated {new Date(item.updatedAt).toLocaleString()}</Text>
            </View>
            <View style={styles.itemActions}><Pressable onPress={() => edit(item)}><Ionicons name="create-outline" size={21} color="#0F6464" /></Pressable><Pressable onPress={() => remove(item)}><Ionicons name="trash-outline" size={21} color="#C94A4A" /></Pressable></View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5FAFA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 54, paddingBottom: 17, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#DDEAEA' },
  headerButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF9F9' },
  headerCopy: { flex: 1, marginLeft: 12 },
  eyebrow: { color: '#0F6464', fontSize: 10, fontWeight: '800', letterSpacing: 1.3 },
  headerTitle: { color: '#163838', fontSize: 22, fontWeight: '800', marginTop: 3 },
  content: { padding: 16, paddingBottom: 120, gap: 14 },
  introCard: { padding: 18, borderRadius: 18, backgroundColor: '#0D6464' },
  introTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  introText: { color: '#D8F4F2', fontSize: 13, lineHeight: 19, marginTop: 6 },
  formCard: { padding: 16, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDEAEA', gap: 11 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: '#163838', fontSize: 17, fontWeight: '800' },
  cancelText: { color: '#0F6464', fontSize: 12, fontWeight: '700' },
  count: { color: '#0F6464', fontSize: 13, fontWeight: '800' },
  mediaRow: { flexDirection: 'row', gap: 8 },
  mediaButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12, backgroundColor: '#EEF9F9', borderWidth: 1, borderColor: '#B9DCDC' },
  mediaButtonActive: { backgroundColor: '#24B8B8', borderColor: '#24B8B8' },
  mediaButtonText: { color: '#0F6464', fontSize: 12, fontWeight: '700' },
  mediaButtonTextActive: { color: '#FFFFFF' },
  mediaPreview: { padding: 12, borderRadius: 12, backgroundColor: '#F0FAFA', borderWidth: 1, borderColor: '#C6E7E5' },
  mediaPreviewText: { color: '#0F6464', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  previewCard: { marginTop: 3, gap: 7 },
  previewLabel: { color: '#0F6464', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  previewSlide: { height: 190, borderRadius: 18, overflow: 'hidden', position: 'relative', backgroundColor: '#0D6464' },
  previewMedia: { ...StyleSheet.absoluteFillObject },
  previewOverlay: { ...StyleSheet.absoluteFillObject },
  previewContent: { flex: 1, padding: 16, justifyContent: 'flex-start' },
  previewSubtitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '400' },
  previewTitle: { color: '#FFFFFF', fontSize: 21, lineHeight: 25, fontWeight: '800', maxWidth: '84%', marginTop: 3 },
  previewPoint: { color: '#FFFFFF', fontSize: 10, lineHeight: 14, marginTop: 6 },
  previewButtons: { flexDirection: 'row', gap: 6, marginTop: 10 },
  previewPrimary: { color: '#1F7F7F', backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, fontSize: 9, fontWeight: '700' },
  previewSecondary: { color: '#FFFFFF', borderWidth: 1, borderColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, fontSize: 9, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#C8DCDC', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, color: '#163838', backgroundColor: '#FFFFFF', fontSize: 14 },
  splitRow: { flexDirection: 'row', gap: 8 },
  splitInput: { flex: 1 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderInput: { width: 90 },
  activeRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  activeLabel: { color: '#557070', fontSize: 12, fontWeight: '700' },
  error: { color: '#C94A4A', fontSize: 12, lineHeight: 17 },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#24B8B8', borderRadius: 12, paddingVertical: 12 },
  saveButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  itemCard: { flexDirection: 'row', alignItems: 'center', padding: 11, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDEAEA', gap: 11 },
  builtInHeading: { color: '#557070', fontSize: 12, fontWeight: '800', marginTop: -4 },
  itemMedia: { width: 58, height: 58, borderRadius: 12, backgroundColor: '#EEF9F9', alignItems: 'center', justifyContent: 'center' },
  videoMedia: { backgroundColor: '#E6F5F4' },
  itemImage: { width: '100%', height: '100%' },
  videoBadge: { color: '#0F6464', fontSize: 8, fontWeight: '800', marginTop: 3 },
  itemBody: { flex: 1 },
  itemType: { color: '#0F6464', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  itemTitle: { color: '#163838', fontSize: 14, fontWeight: '800', marginTop: 3 },
  itemMeta: { color: '#557070', fontSize: 11, lineHeight: 15, marginTop: 3 },
  itemDate: { color: '#789292', fontSize: 10, marginTop: 4 },
  itemActions: { gap: 14 },
});
