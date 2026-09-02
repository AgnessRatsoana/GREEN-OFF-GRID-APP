import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  createMarketplaceProduct,
  fetchMarketplaceProductById,
  updateMarketplaceProduct,
  type MarketplaceProduct,
} from '../../services/marketplace/marketplace';

import {
  pickMarketingImage,
  uploadMarketingImage,
} from '../../services/marketing/media';

import type { RootStackParamList } from '../../navigation/types';

type NavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

type RouteParams = {
  productId?: string;
};

const COLORS = {
  background: '#F5F7F8',
  card: '#FFFFFF',
  primary: '#0F766E',
  primaryDark: '#115E59',
  text: '#172033',
  muted: '#6B7280',
  border: '#E5E7EB',
  danger: '#DC2626',
  success: '#15803D',
  warning: '#D97706',
};

export function AddProductScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();

  const { productId } =
    (route.params as RouteParams | undefined) ?? {};

  const isEditing = Boolean(productId);

  const [product, setProduct] =
    useState<MarketplaceProduct | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedImageUri, setSelectedImageUri] =
    useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      return;
    }

    let mounted = true;

    const loadProduct = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data =
          await fetchMarketplaceProductById(productId);

        if (!mounted) {
          return;
        }

        setProduct(data);

        setName(data.name);
        setDescription(data.description);
        setPrice(String(data.price));
        setCostPrice(
          data.costPrice === null
            ? ''
            : String(data.costPrice),
        );
        setBrand(data.brand);
        setCategory(data.category);
        setSku(data.sku);
        setQuantity(String(data.quantity));
        setImageUrl(data.imageUrl ?? '');
        setIsActive(data.isActive);
        setSelectedImageUri(null);
      } catch (loadError) {
        console.error(
          'LOAD PRODUCT ERROR:',
          loadError,
        );

        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load the product.',
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      mounted = false;
    };
  }, [productId]);

  const validateForm = (): boolean => {
    const trimmedName = name.trim();
    const trimmedDescription =
      description.trim();
    const trimmedBrand = brand.trim();
    const trimmedCategory = category.trim();
    const trimmedSku = sku.trim();

    if (!trimmedName) {
      Alert.alert(
        'Missing Product Name',
        'Please enter a product name.',
      );
      return false;
    }

    if (!trimmedDescription) {
      Alert.alert(
        'Missing Description',
        'Please enter a product description.',
      );
      return false;
    }

    if (!price.trim()) {
      Alert.alert(
        'Missing Price',
        'Please enter the selling price.',
      );
      return false;
    }

    const numericPrice = Number(price);

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      Alert.alert(
        'Invalid Price',
        'Please enter a valid selling price.',
      );
      return false;
    }

    if (!trimmedBrand) {
      Alert.alert(
        'Missing Brand',
        'Please enter the product brand.',
      );
      return false;
    }

    if (!trimmedCategory) {
      Alert.alert(
        'Missing Category',
        'Please enter the product category.',
      );
      return false;
    }

    if (!trimmedSku) {
      Alert.alert(
        'Missing SKU',
        'Please enter a product SKU.',
      );
      return false;
    }

    if (!quantity.trim()) {
      Alert.alert(
        'Missing Stock',
        'Please enter the stock quantity.',
      );
      return false;
    }

    const numericQuantity = Number(quantity);

    if (
      !Number.isInteger(numericQuantity) ||
      numericQuantity < 0
    ) {
      Alert.alert(
        'Invalid Stock',
        'Stock quantity must be a whole number of 0 or more.',
      );
      return false;
    }

    if (costPrice.trim()) {
      const numericCostPrice =
        Number(costPrice);

      if (
        !Number.isFinite(numericCostPrice) ||
        numericCostPrice < 0
      ) {
        Alert.alert(
          'Invalid Cost Price',
          'Please enter a valid cost price.',
        );
        return false;
      }
    }

    return true;
  };

  const handleChooseImage = async () => {
    try {
      setError(null);

      const uri =
        await pickMarketingImage();

      if (!uri) {
        return;
      }

      setSelectedImageUri(uri);
    } catch (imageError) {
      console.error(
        'PRODUCT IMAGE PICKER ERROR:',
        imageError,
      );

      Alert.alert(
        'Image Selection Failed',
        imageError instanceof Error
          ? imageError.message
          : 'Unable to select the image.',
      );
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      let finalImageUrl = imageUrl.trim();

      if (selectedImageUri) {
        setIsUploadingImage(true);

        try {
          finalImageUrl =
            await uploadMarketingImage(
              selectedImageUri,
            );
        } finally {
          setIsUploadingImage(false);
        }
      }

      const numericPrice = Number(price);
      const numericQuantity = Number(quantity);

      const numericCostPrice =
        costPrice.trim()
          ? Number(costPrice)
          : null;

      if (isEditing && productId) {
        const updated =
          await updateMarketplaceProduct(
            productId,
            {
              name: name.trim(),
              description: description.trim(),
              price: numericPrice,
              brand: brand.trim(),
              category: category.trim(),
              sku: sku.trim(),
              costPrice: numericCostPrice,
              quantity: numericQuantity,
              imageUrl:
                finalImageUrl || null,
              isActive,
            },
          );

        setProduct(updated);

        Alert.alert(
          'Product Updated',
          'The product has been updated successfully.',
          [
            {
              text: 'OK',
              onPress: () =>
                navigation.goBack(),
            },
          ],
        );

        return;
      }

      await createMarketplaceProduct({
        name: name.trim(),
        description: description.trim(),
        price: numericPrice,
        brand: brand.trim(),
        category: category.trim(),
        sku: sku.trim(),
        costPrice: numericCostPrice,
        quantity: numericQuantity,
        imageUrl:
          finalImageUrl || null,
        isActive,
      });

      Alert.alert(
        'Product Created',
        'The product has been added successfully.',
        [
          {
            text: 'OK',
            onPress: () =>
              navigation.goBack(),
          },
        ],
      );
    } catch (saveError) {
      console.error(
        'SAVE PRODUCT ERROR:',
        saveError,
      );

      const message =
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save the product.';

      setError(message);

      Alert.alert(
        'Unable to Save Product',
        message,
      );
    } finally {
      setIsSaving(false);
      setIsUploadingImage(false);
    }
  };

  const displayImage =
    selectedImageUri || imageUrl || null;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />

        <Text style={styles.loadingText}>
          Loading product...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={COLORS.text}
          />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {isEditing
              ? 'Edit Product'
              : 'Add Product'}
          </Text>

          <Text style={styles.headerSubtitle}>
            {isEditing
              ? 'Update marketplace product'
              : 'Add a new marketplace product'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle"
              size={20}
              color={COLORS.danger}
            />

            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        )}

        {/* IMAGE */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Product Image
          </Text>

          <View style={styles.imagePreview}>
            {displayImage ? (
              <Image
                source={{
                  uri: displayImage,
                }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            ) : (
              <View
                style={
                  styles.imagePlaceholder
                }
              >
                <Ionicons
                  name="image-outline"
                  size={48}
                  color={COLORS.muted}
                />

                <Text
                  style={
                    styles.placeholderText
                  }
                >
                  No product image selected
                </Text>
              </View>
            )}
          </View>

          <Pressable
            onPress={handleChooseImage}
            disabled={
              isSaving ||
              isUploadingImage
            }
            style={[
              styles.imageButton,
              (isSaving ||
                isUploadingImage) &&
                styles.disabledButton,
            ]}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={21}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.imageButtonText
              }
            >
              {selectedImageUri
                ? 'Choose Different Image'
                : imageUrl
                  ? 'Replace Product Image'
                  : 'Choose Product Image'}
            </Text>
          </Pressable>

          {selectedImageUri && (
            <Text style={styles.selectedImageText}>
              New image selected. It will be uploaded
              when you save the product.
            </Text>
          )}

          {isUploadingImage && (
            <View
              style={
                styles.uploadingContainer
              }
            >
              <ActivityIndicator
                size="small"
                color={COLORS.primary}
              />

              <Text
                style={
                  styles.uploadingText
                }
              >
                Uploading product image...
              </Text>
            </View>
          )}
        </View>

        {/* BASIC INFORMATION */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Basic Information
          </Text>

          <Field
            label="Product Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. 550W Solar Panel"
          />

          <Field
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the product..."
            multiline
          />

          <Field
            label="Brand"
            value={brand}
            onChangeText={setBrand}
            placeholder="e.g. Canadian Solar"
          />

          <Field
            label="Category"
            value={category}
            onChangeText={setCategory}
            placeholder="e.g. Solar Panels"
          />

          <Field
            label="SKU"
            value={sku}
            onChangeText={setSku}
            placeholder="e.g. SOL-550-001"
            autoCapitalize="characters"
          />
        </View>

        {/* PRICING */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Pricing & Stock
          </Text>

          <Field
            label="Selling Price"
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />

          <Field
            label="Cost Price"
            value={costPrice}
            onChangeText={setCostPrice}
            placeholder="Optional"
            keyboardType="decimal-pad"
          />

          <Field
            label="Stock Quantity"
            value={quantity}
            onChangeText={setQuantity}
            placeholder="0"
            keyboardType="number-pad"
          />
        </View>

        {/* STATUS */}

        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>
                Product Active
              </Text>

              <Text style={styles.statusDescription}>
                Active products are visible in the
                customer marketplace.
              </Text>
            </View>

            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{
                false: '#D1D5DB',
                true: '#99F6E4',
              }}
              thumbColor={
                isActive
                  ? COLORS.primary
                  : '#6B7280'
              }
            />
          </View>
        </View>

        {/* ACTIONS */}

        <View style={styles.actions}>
          <Pressable
            onPress={() =>
              navigation.goBack()
            }
            disabled={isSaving}
            style={[
              styles.cancelButton,
              isSaving &&
                styles.disabledButton,
            ]}
          >
            <Text
              style={
                styles.cancelButtonText
              }
            >
              Cancel
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSave}
            disabled={
              isSaving ||
              isUploadingImage
            }
            style={[
              styles.saveButton,
              (isSaving ||
                isUploadingImage) &&
                styles.disabledButton,
            ]}
          >
            {isSaving ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <Ionicons
                name="checkmark-circle-outline"
                size={21}
                color="#FFFFFF"
              />
            )}

            <Text style={styles.saveButtonText}>
              {isSaving
                ? 'Saving...'
                : isEditing
                  ? 'Update Product'
                  : 'Create Product'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={
          COLORS.muted
        }
        style={[
          styles.input,
          multiline &&
            styles.multilineInput,
        ]}
        multiline={multiline}
        textAlignVertical={
          multiline
            ? 'top'
            : 'center'
        }
        keyboardType={keyboardType}
        autoCapitalize={
          autoCapitalize
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.background,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.muted,
  },

  header: {
    minHeight: 78,
    backgroundColor:
      COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 12,
  },

  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.background,
  },

  headerTitleContainer: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.text,
  },

  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.muted,
  },

  scrollContent: {
    padding: 18,
    paddingBottom: 50,
  },

  card: {
    backgroundColor:
      COLORS.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 18,
  },

  imagePreview: {
    width: '100%',
    height: 210,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor:
      COLORS.background,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  previewImage: {
    width: '100%',
    height: '100%',
  },

  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  placeholderText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
  },

  imageButton: {
    marginTop: 14,
    height: 50,
    borderRadius: 12,
    backgroundColor:
      COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  imageButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  selectedImageText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.primaryDark,
  },

  uploadingContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  uploadingText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },

  field: {
    marginBottom: 16,
  },

  label: {
    marginBottom: 7,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },

  input: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },

  multilineInput: {
    minHeight: 120,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },

  statusTextContainer: {
    flex: 1,
  },

  statusTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },

  statusDescription: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.muted,
  },

  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },

  cancelButton: {
    flex: 1,
    height: 54,
    borderRadius: 13,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },

  saveButton: {
    flex: 1.5,
    height: 54,
    borderRadius: 13,
    backgroundColor:
      COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  disabledButton: {
    opacity: 0.55,
  },

  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 13,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },

  errorText: {
    flex: 1,
    color: COLORS.danger,
    fontSize: 14,
    lineHeight: 20,
  },
});