import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
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
  createComboDeal,
  deleteComboDeal,
  fetchAllComboDeals,
  updateComboDeal,
  type ComboDeal,
} from '../../services/marketing/comboDeals';
import {
  pickComboDealImages,
  uploadComboDealImage,
} from '../../services/marketing/comboMedia';
import { useAuthStore } from '../../store/authStore';

export function ComboDealsManagementScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const role = useAuthStore((state) => state.user?.role);

  const [items, setItems] = useState<ComboDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [rating, setRating] = useState('4.8');
  const [images, setImages] = useState<{ uri: string; isNew: boolean }[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [bulletsInput, setBulletsInput] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadComboDeals = async () => {
    try {
      setLoading(true);
      setItems(await fetchAllComboDeals());
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load combo deals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role !== 'marketing' && role !== 'admin') {
      navigation.goBack();
      return;
    }

    void loadComboDeals();
  }, [navigation, role]);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setRating('4.8');
    setImages([]);
    setBulletsInput('');
    setDisplayOrder('0');
    setIsActive(true);
  };

  const editItem = (item: ComboDeal) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description);
    setPrice(String(item.price));
    setRating(String(item.rating));
    setImages(
      item.images.length
        ? item.images.map((url) => ({ uri: url, isNew: false }))
        : item.imageUrl
          ? [{ uri: item.imageUrl, isNew: false }]
          : [],
    );
    setBulletsInput(item.bullets.join('\n'));
    setDisplayOrder(String(item.displayOrder));
    setIsActive(item.isActive);
  };

  const handleImagePick = async () => {
    try {
      setError(null);

      const pickedUris = await pickComboDealImages();
      if (!pickedUris.length) {
        return;
      }

      setImages((current) => [
        ...current,
        ...pickedUris.map((uri) => ({ uri, isNew: true })),
      ]);
    } catch (pickerError) {
      setError(pickerError instanceof Error ? pickerError.message : 'Unable to select combo images.');
    }
  };

  const handleRemoveImage = (uri: string) => {
    setImages((current) => current.filter((image) => image.uri !== uri));
  };

  const handleSetCoverImage = (uri: string) => {
    setImages((current) => {
      const index = current.findIndex((image) => image.uri === uri);

      if (index <= 0) {
        return current;
      }

      const next = [...current];
      const [selected] = next.splice(index, 1);
      next.unshift(selected);
      return next;
    });
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim() || !price.trim()) {
      setError('Title, description and price are required.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      let finalImages: string[] = [];

      if (images.some((image) => image.isNew)) {
        setIsUploadingImage(true);
        finalImages = await Promise.all(
          images.map((image) =>
            image.isNew ? uploadComboDealImage(image.uri) : Promise.resolve(image.uri),
          ),
        );
      } else {
        finalImages = images.map((image) => image.uri);
      }

      const parsedBullets = bulletsInput
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

      const payload = {
        title,
        description,
        price: Number(price),
        rating: Number(rating || 4.8),
        images: finalImages,
        bullets: parsedBullets,
        isActive,
        displayOrder: Number(displayOrder || 0),
      };

      if (editingId) {
        await updateComboDeal({ id: editingId, ...payload });
      } else {
        await createComboDeal(payload);
      }

      resetForm();
      await loadComboDeals();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save combo deal.');
    } finally {
      setIsSaving(false);
      setIsUploadingImage(false);
    }
  };

  const handleDelete = (item: ComboDeal) => {
    Alert.alert('Delete combo deal', `Delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComboDeal(item.id);
            if (editingId === item.id) resetForm();
            await loadComboDeals();
          } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete combo deal.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#24B8B8" />
        <Text style={styles.loadingText}>Loading combo deals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#0F6464" />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>MANAGEMENT</Text>
          <Text style={styles.headerTitle}>Combo deals</Text>
        </View>
        <Ionicons name="bag-outline" size={24} color="#24B8B8" />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>{editingId ? 'Edit combo deal' : 'Create combo deal'}</Text>
            {editingId ? (
              <Pressable onPress={resetForm}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            ) : null}
          </View>

          <TextInput value={title} onChangeText={setTitle} placeholder="Title" style={styles.input} placeholderTextColor="#789292" />
          <TextInput value={description} onChangeText={setDescription} placeholder="Description" style={[styles.input, styles.textArea]} multiline placeholderTextColor="#789292" />
          <TextInput value={price} onChangeText={setPrice} placeholder="Price" keyboardType="numeric" style={styles.input} placeholderTextColor="#789292" />
          <TextInput value={rating} onChangeText={setRating} placeholder="Rating" keyboardType="decimal-pad" style={styles.input} placeholderTextColor="#789292" />

          <View style={styles.imageSection}>
            <Text style={styles.imageSectionTitle}>Combo deal images</Text>
            <Text style={styles.imageSectionSubtitle}>Add one or more images. The first image is the cover shown on cards and in the cart.</Text>

            {images.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageGalleryScroll} contentContainerStyle={styles.imageGalleryRow}>
                {images.map((image, index) => (
                  <View key={image.uri} style={styles.imageThumbWrap}>
                    <Image source={{ uri: image.uri }} style={styles.imageThumb} resizeMode="cover" />

                    {index === 0 ? (
                      <View style={styles.coverBadge}>
                        <Ionicons name="star" size={11} color="#FFFFFF" />
                        <Text style={styles.coverBadgeText}>Cover</Text>
                      </View>
                    ) : (
                      <Pressable style={styles.setCoverButton} onPress={() => handleSetCoverImage(image.uri)} disabled={isSaving || isUploadingImage} hitSlop={6}>
                        <Ionicons name="star-outline" size={13} color="#FFFFFF" />
                      </Pressable>
                    )}

                    <Pressable style={styles.removeImageButton} onPress={() => handleRemoveImage(image.uri)} disabled={isSaving || isUploadingImage} hitSlop={6}>
                      <Ionicons name="close" size={13} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.imagePlaceholder}>
                <View style={styles.imagePlaceholderIcon}>
                  <Ionicons name="image-outline" size={32} color="#0F6464" />
                </View>
                <Text style={styles.imagePlaceholderTitle}>No images selected</Text>
                <Text style={styles.imagePlaceholderText}>Choose one or more images from your device media library.</Text>
              </View>
            )}

            <Pressable style={[styles.imagePickerButton, (isSaving || isUploadingImage) && styles.disabledButton]} onPress={handleImagePick} disabled={isSaving || isUploadingImage}>
              {isUploadingImage ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />}
              <Text style={styles.imagePickerButtonText}>{images.length ? 'Add More Images' : 'Choose Images'}</Text>
            </Pressable>
            <Text style={styles.imageHint}>JPG, JPEG, PNG, WEBP, GIF and HEIC images are supported. Tap the star to set the cover image.</Text>
          </View>

          <TextInput value={bulletsInput} onChangeText={setBulletsInput} placeholder="Each bullet on a new line" style={[styles.input, styles.textArea]} multiline placeholderTextColor="#789292" />
          <View style={styles.row}>
            <TextInput value={displayOrder} onChangeText={setDisplayOrder} placeholder="Order" keyboardType="number-pad" style={[styles.input, styles.orderInput]} placeholderTextColor="#789292" />
            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Visible</Text>
              <Switch value={isActive} onValueChange={setIsActive} trackColor={{ false: '#CBD8D8', true: '#8ADBD7' }} thumbColor={isActive ? '#0F6464' : '#FFFFFF'} />
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>{editingId ? 'Save changes' : 'Publish combo deal'}</Text>}
          </Pressable>
        </View>

        <View style={styles.listHeader}><Text style={styles.sectionTitle}>Current combo deals</Text><Text style={styles.count}>{items.length}</Text></View>

        {items.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemImageWrap}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} resizeMode="cover" />
              ) : (
                <Ionicons name="image-outline" size={22} color="#24B8B8" />
              )}
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemMeta}>{item.isActive ? 'Active' : 'Hidden'} • R {item.price.toFixed(2)} • Order {item.displayOrder}</Text>
              <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>
            </View>
            <View style={styles.itemActions}>
              <Pressable onPress={() => editItem(item)}><Ionicons name="create-outline" size={22} color="#0F6464" /></Pressable>
              <Pressable onPress={() => handleDelete(item)}><Ionicons name="trash-outline" size={22} color="#C94A4A" /></Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5FAFA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 54, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#DDEAEA' },
  backButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EEF9F9', alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, marginLeft: 12 },
  eyebrow: { color: '#0F6464', fontSize: 10, fontWeight: '800', letterSpacing: 1.3 },
  headerTitle: { color: '#163838', fontSize: 22, fontWeight: '800' },
  content: { padding: 16, gap: 14, paddingBottom: 120 },
  formCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDEAEA', borderRadius: 18, padding: 16, gap: 10 },
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: '#163838', fontSize: 18, fontWeight: '800' },
  cancelText: { color: '#0F6464', fontSize: 12, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#C8DCDC', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, color: '#163838', backgroundColor: '#FFFFFF', fontSize: 14 },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10 },
  orderInput: { width: 96 },
  switchRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#C8DCDC', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11 },
  switchText: { color: '#557070', fontSize: 12, fontWeight: '700' },
  error: { color: '#C94A4A', fontSize: 12, lineHeight: 17 },
  imageSection: { gap: 8, marginTop: 6 },
  imageSectionTitle: { color: '#163838', fontSize: 14, fontWeight: '800' },
  imageSectionSubtitle: { color: '#557070', fontSize: 12, lineHeight: 17 },
  imagePlaceholder: { minHeight: 150, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: '#C6E7E5', backgroundColor: '#F7FCFC', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 6 },
  imagePlaceholderIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#E3F5F4', alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderTitle: { color: '#163838', fontSize: 14, fontWeight: '800' },
  imagePlaceholderText: { color: '#557070', fontSize: 12, textAlign: 'center', lineHeight: 17 },
  imagePickerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0F6464', borderRadius: 12, paddingVertical: 12 },
  imagePickerButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  imageGalleryScroll: { marginBottom: 4 },
  imageGalleryRow: { flexDirection: 'row', columnGap: 10 },
  imageThumbWrap: { width: 120, height: 120, borderRadius: 12, overflow: 'hidden', backgroundColor: '#EEF9F9', position: 'relative' },
  imageThumb: { width: '100%', height: '100%' },
  coverBadge: { position: 'absolute', left: 6, bottom: 6, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(15,100,100,0.92)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 },
  coverBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  setCoverButton: { position: 'absolute', left: 6, bottom: 6, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  removeImageButton: { position: 'absolute', right: 6, top: 6, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)' },
  imageHint: { color: '#789292', fontSize: 11, lineHeight: 15 },
  disabledButton: { opacity: 0.6 },
  saveButton: { backgroundColor: '#24B8B8', borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  count: { color: '#0F6464', fontSize: 13, fontWeight: '800' },
  itemCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDEAEA', borderRadius: 16, padding: 12, gap: 10 },
  itemImageWrap: { width: 58, height: 58, borderRadius: 12, overflow: 'hidden', backgroundColor: '#EEF9F9', alignItems: 'center', justifyContent: 'center' },
  itemImage: { width: '100%', height: '100%' },
  itemContent: { flex: 1 },
  itemTitle: { color: '#163838', fontSize: 14, fontWeight: '800' },
  itemMeta: { color: '#0F6464', fontSize: 10, fontWeight: '700', marginTop: 2 },
  itemDescription: { color: '#557070', fontSize: 11, lineHeight: 15, marginTop: 3 },
  itemActions: { gap: 12, alignItems: 'center', justifyContent: 'center' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5FAFA' },
  loadingText: { color: '#163838', fontSize: 14, fontWeight: '700', marginTop: 10 },
});
