
import React, { useEffect, useState } from 'react';

import { Ionicons } from '@expo/vector-icons';

import {
  useNavigation,
  useRoute,
} from '@react-navigation/native';

import type { RouteProp } from '@react-navigation/native';

import type {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ROUTES } from '../../../constants/routes';

import type {
  RootStackParamList,
} from '../../../navigation/types';

import {
  createMarketplaceProduct,
  fetchMarketplaceProductById,
  updateMarketplaceProduct,
} from '../../../services/marketplace/marketplace';

import {
  pickMarketingImage,
  uploadMarketingImage,
} from '../../../services/marketing/media';

type NavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

type AddProductRouteProp = RouteProp<
  RootStackParamList,
  typeof ROUTES.ADD_PRODUCT
>;

export function AddProductScreen() {
  const navigation =
    useNavigation<NavigationProp>();

  const route =
    useRoute<AddProductRouteProp>();

  const productId =
    route.params?.productId;

  const isEditMode =
    Boolean(productId);

  /* ============================================================
     FORM STATE
  ============================================================ */

  const [name, setName] =
    useState('');

  const [category, setCategory] =
    useState('');

  const [price, setPrice] =
    useState('');

  const [costPrice, setCostPrice] =
    useState('');

  const [description, setDescription] =
    useState('');

  const [brand, setBrand] =
    useState('');

  const [sku, setSku] =
    useState('');

  const [quantity, setQuantity] =
    useState('');

  /*
   * Existing image URL from Supabase.
   */
  const [imageUrl, setImageUrl] =
    useState<string | null>(null);

  /*
   * Newly selected local image.
   */
  const [selectedImageUri, setSelectedImageUri] =
    useState<string | null>(null);

  const [isActive, setIsActive] =
    useState(true);

  const [loadingProduct, setLoadingProduct] =
    useState(isEditMode);

  const [saving, setSaving] =
    useState(false);

  const [isUploadingImage, setIsUploadingImage] =
    useState(false);

  const [error, setError] =
    useState('');

  /* ============================================================
     LOAD EXISTING PRODUCT
  ============================================================ */

  useEffect(() => {
    let mounted = true;

    const loadProduct = async () => {
      if (!productId) {
        setLoadingProduct(false);
        return;
      }

      try {
        setLoadingProduct(true);
        setError('');

        console.log(
          '========================================',
        );

        console.log(
          'EDIT PRODUCT SCREEN',
        );

        console.log(
          'Product ID:',
          productId,
        );

        const product =
          await fetchMarketplaceProductById(
            productId,
          );

        if (!mounted) {
          return;
        }

        if (!product) {
          throw new Error(
            'The selected product could not be found.',
          );
        }

        console.log(
          'Existing product loaded:',
          product,
        );

        setName(
          product.name ?? '',
        );

        setCategory(
          product.category ?? '',
        );

        setPrice(
          product.price !== null &&
          product.price !== undefined
            ? String(product.price)
            : '',
        );

        setCostPrice(
          product.costPrice !== null &&
          product.costPrice !== undefined
            ? String(product.costPrice)
            : '',
        );

        setDescription(
          product.description ?? '',
        );

        setBrand(
          product.brand ?? '',
        );

        setSku(
          product.sku ?? '',
        );

        setQuantity(
          product.quantity !== null &&
          product.quantity !== undefined
            ? String(product.quantity)
            : '',
        );

        setImageUrl(
          product.imageUrl ?? null,
        );

        setSelectedImageUri(null);

        setIsActive(
          product.isActive ?? true,
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Unable to load the selected product.';

        console.error(
          'LOAD PRODUCT ERROR:',
          err,
        );

        if (mounted) {
          setError(message);

          Alert.alert(
            'Unable to Load Product',
            message,
          );
        }
      } finally {
        if (mounted) {
          setLoadingProduct(false);
        }
      }
    };

    void loadProduct();

    return () => {
      mounted = false;
    };
  }, [productId]);

  /* ============================================================
     IMAGE PICKER
  ============================================================ */

  const handleChooseImage = async () => {
    if (
      saving ||
      isUploadingImage
    ) {
      return;
    }

    try {
      setError('');

      const uri =
        await pickMarketingImage();

      if (!uri) {
        return;
      }

      console.log(
        'IMAGE SELECTED:',
        uri,
      );

      setSelectedImageUri(uri);
    } catch (pickerError) {
      console.error(
        'IMAGE PICKER ERROR:',
        pickerError,
      );

      const message =
        pickerError instanceof Error
          ? pickerError.message
          : 'Unable to select the product image.';

      setError(message);

      Alert.alert(
        'Image Selection Failed',
        message,
      );
    }
  };

  /* ============================================================
     BACK
  ============================================================ */

  const handleBack = () => {
    if (saving) {
      return;
    }

    navigation.goBack();
  };

  /* ============================================================
     VALIDATION
  ============================================================ */

  const validateForm = () => {
    if (!name.trim()) {
      return 'Product name is required.';
    }

    if (!category.trim()) {
      return 'Category is required.';
    }

    if (!brand.trim()) {
      return 'Brand is required.';
    }

    if (!sku.trim()) {
      return 'SKU is required.';
    }

    if (!price.trim()) {
      return 'Product price is required.';
    }

    if (!description.trim()) {
      return 'Product description is required.';
    }

    if (!quantity.trim()) {
      return 'Quantity is required.';
    }

    const numericPrice =
      Number(price);

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      return 'Please enter a valid product price.';
    }

    const numericQuantity =
      Number(quantity);

    if (
      !Number.isFinite(numericQuantity) ||
      !Number.isInteger(numericQuantity) ||
      numericQuantity < 0
    ) {
      return (
        'Quantity must be a whole number greater than or equal to 0.'
      );
    }

    if (costPrice.trim()) {
      const numericCostPrice =
        Number(costPrice);

      if (
        !Number.isFinite(numericCostPrice) ||
        numericCostPrice < 0
      ) {
        return 'Please enter a valid cost price.';
      }
    }

    return null;
  };

  /* ============================================================
     SAVE PRODUCT
  ============================================================ */

  const handleSaveProduct = async () => {
    if (saving) {
      return;
    }

    setError('');

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);

      Alert.alert(
        'Check Product Details',
        validationError,
      );

      return;
    }

    try {
      setSaving(true);

      let finalImageUrl =
        imageUrl;

      /*
       * If the user selected a new local image,
       * upload it before creating/updating the product.
       */
      if (selectedImageUri) {
        try {
          setIsUploadingImage(true);

          console.log(
            '========================================',
          );

          console.log(
            'UPLOADING PRODUCT IMAGE',
          );

          console.log(
            'Local image:',
            selectedImageUri,
          );

          const uploadedImageUrl =
            await uploadMarketingImage(
              selectedImageUri,
            );

          finalImageUrl =
            uploadedImageUrl;

          console.log(
            'PRODUCT IMAGE UPLOADED:',
            uploadedImageUrl,
          );

          console.log(
            '========================================',
          );
        } finally {
          setIsUploadingImage(false);
        }
      }

      const numericPrice =
        Number(price);

      const numericQuantity =
        Number(quantity);

      const numericCostPrice =
        costPrice.trim()
          ? Number(costPrice)
          : null;

      const productData = {
        name: name.trim(),
        description:
          description.trim(),
        price: numericPrice,
        costPrice:
          numericCostPrice,
        brand: brand.trim(),
        category: category.trim(),
        sku: sku.trim(),
        quantity:
          numericQuantity,
        imageUrl:
          finalImageUrl || null,
        isActive,
      };

      console.log(
        '========================================',
      );

      console.log(
        isEditMode
          ? 'UPDATING PRODUCT'
          : 'CREATING PRODUCT',
      );

      console.log(
        'Product ID:',
        productId ?? 'NEW',
      );

      console.log(
        'Product data:',
        productData,
      );

      console.log(
        '========================================',
      );

      /* ========================================================
         UPDATE
      ======================================================== */

      if (
        isEditMode &&
        productId
      ) {
        const updatedProduct =
          await updateMarketplaceProduct(
            productId,
            productData,
          );

        console.log(
          'PRODUCT UPDATED SUCCESSFULLY:',
          updatedProduct,
        );

        /*
         * Immediately return to Products.
         *
         * The Products screen will reload when it
         * receives focus.
         */
        navigation.goBack();

        return;
      }

      /* ========================================================
         CREATE
      ======================================================== */

      const createdProduct =
        await createMarketplaceProduct(
          productData,
        );

      console.log(
        'PRODUCT CREATED SUCCESSFULLY:',
        createdProduct,
      );

      /*
       * Immediately leave the form.
       *
       * MarketingProductsScreen will reload
       * automatically when it becomes focused.
       */
      navigation.goBack();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while saving the product.';

      console.error(
        '========================================',
      );

      console.error(
        isEditMode
          ? 'UPDATE PRODUCT ERROR'
          : 'CREATE PRODUCT ERROR',
      );

      console.error(
        message,
      );

      console.error(
        err,
      );

      console.error(
        '========================================',
      );

      setError(message);

      Alert.alert(
        isEditMode
          ? 'Unable to Update Product'
          : 'Unable to Create Product',
        message,
      );
    } finally {
      setSaving(false);
      setIsUploadingImage(false);
    }
  };

  /* ============================================================
     IMAGE PREVIEW
  ============================================================ */

  const previewImage =
    selectedImageUri ||
    imageUrl;

  /* ============================================================
     LOADING
  ============================================================ */

  if (loadingProduct) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={
            COLORS.background
          }
        />

        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color={COLORS.teal}
          />

          <Text
            style={
              styles.loadingTitle
            }
          >
            Loading Product
          </Text>

          <Text
            style={
              styles.loadingSubtitle
            }
          >
            Retrieving the existing
            product information...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={
          COLORS.background
        }
      />

      <KeyboardAvoidingView
        style={
          styles.keyboardContainer
        }
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={
            styles.contentContainer
          }
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
        >

          {/* ==================================================
              HEADER
          ================================================== */}

          <View
            style={styles.header}
          >
            <Pressable
              style={({
                pressed,
              }) => [
                styles.backButton,
                pressed &&
                  styles.pressed,
              ]}
              onPress={handleBack}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons
                name="arrow-back"
                size={21}
                color={COLORS.text}
              />
            </Pressable>

            <View
              style={
                styles.headerText
              }
            >
              <Text
                style={styles.eyebrow}
              >
                MARKETING
              </Text>

              <Text
                style={styles.title}
              >
                {isEditMode
                  ? 'Edit Product'
                  : 'Add Product'}
              </Text>

              <Text
                style={styles.subtitle}
              >
                {isEditMode
                  ? 'Update the existing Green Off-Grid catalogue product.'
                  : 'Create a product for the Green Off-Grid catalogue.'}
              </Text>
            </View>
          </View>

          {/* ==================================================
              ERROR
          ================================================== */}

          {error ? (
            <View
              style={
                styles.errorCard
              }
            >
              <Ionicons
                name="alert-circle-outline"
                size={22}
                color={
                  COLORS.danger
                }
              />

              <View
                style={
                  styles.errorContent
                }
              >
                <Text
                  style={
                    styles.errorTitle
                  }
                >
                  Something went wrong
                </Text>

                <Text
                  style={
                    styles.errorText
                  }
                >
                  {error}
                </Text>
              </View>
            </View>
          ) : null}

          {/* ==================================================
              PRODUCT INFORMATION
          ================================================== */}

          <View
            style={styles.sectionHeader}
          >
            <Text
              style={styles.sectionTitle}
            >
              Product Information
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Enter the information
              customers will see in the
              catalogue.
            </Text>
          </View>

          <View
            style={styles.formCard}
          >

            <FormField
              label="Product Name"
              placeholder="Enter product name"
              value={name}
              onChangeText={setName}
              required
              autoCapitalize="words"
            />

            <FormField
              label="Category"
              placeholder="e.g. Solar Equipment"
              value={category}
              onChangeText={setCategory}
              required
            />

            <FormField
              label="Brand"
              placeholder="e.g. Green Off-Grid"
              value={brand}
              onChangeText={setBrand}
              required
              autoCapitalize="words"
            />

            <FormField
              label="SKU"
              placeholder="e.g. SOLAR-001"
              value={sku}
              onChangeText={setSku}
              required
              autoCapitalize="characters"
            />

            <FormField
              label="Price"
              placeholder="Enter product price"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              prefix="R"
              required
            />

            <FormField
              label="Cost Price"
              placeholder="Enter product cost price"
              value={costPrice}
              onChangeText={setCostPrice}
              keyboardType="decimal-pad"
              prefix="R"
            />

            <FormField
              label="Quantity"
              placeholder="Enter available quantity"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="number-pad"
              required
            />

            <View
              style={styles.field}
            >
              <Text
                style={styles.label}
              >
                Description

                <Text
                  style={
                    styles.required
                  }
                >
                  {' '}*
                </Text>
              </Text>

              <TextInput
                placeholder="Describe the product, its features and benefits."
                placeholderTextColor={
                  COLORS.muted
                }
                style={[
                  styles.input,
                  styles.descriptionInput,
                ]}
                value={description}
                onChangeText={
                  setDescription
                }
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                autoCapitalize="sentences"
              />
            </View>

          </View>

          {/* ==================================================
              PRODUCT IMAGE
          ================================================== */}

          <View
            style={styles.sectionHeader}
          >
            <Text
              style={styles.sectionTitle}
            >
              Product Image
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Choose an image directly from
              your computer or device media
              library.
            </Text>
          </View>

          <View
            style={
              styles.imageSection
            }
          >

            {previewImage ? (
              <View
                style={
                  styles.imagePreviewContainer
                }
              >
                <Image
                  source={{
                    uri: previewImage,
                  }}
                  style={
                    styles.imagePreview
                  }
                  resizeMode="cover"
                />

                {selectedImageUri ? (
                  <View
                    style={
                      styles.newImageBadge
                    }
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={
                        COLORS.white
                      }
                    />

                    <Text
                      style={
                        styles.newImageBadgeText
                      }
                    >
                      New image selected
                    </Text>
                  </View>
                ) : (
                  <View
                    style={
                      styles.currentImageBadge
                    }
                  >
                    <Ionicons
                      name="image-outline"
                      size={16}
                      color={
                        COLORS.tealDark
                      }
                    />

                    <Text
                      style={
                        styles.currentImageBadgeText
                      }
                    >
                      Current product image
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View
                style={
                  styles.imagePlaceholder
                }
              >
                <View
                  style={
                    styles.imagePlaceholderIcon
                  }
                >
                  <Ionicons
                    name="image-outline"
                    size={34}
                    color={
                      COLORS.teal
                    }
                  />
                </View>

                <Text
                  style={
                    styles.imagePlaceholderTitle
                  }
                >
                  No image selected
                </Text>

                <Text
                  style={
                    styles.imagePlaceholderText
                  }
                >
                  Choose a product image
                  from your computer or
                  device media library.
                </Text>
              </View>
            )}

            <Pressable
              style={({
                pressed,
              }) => [
                styles.imagePickerButton,
                pressed &&
                  styles.pressed,
                (saving ||
                  isUploadingImage) &&
                  styles.disabledButton,
              ]}
              onPress={
                handleChooseImage
              }
              disabled={
                saving ||
                isUploadingImage
              }
              accessibilityRole="button"
            >
              {isUploadingImage ? (
                <ActivityIndicator
                  size="small"
                  color={
                    COLORS.white
                  }
                />
              ) : (
                <Ionicons
                  name="cloud-upload-outline"
                  size={20}
                  color={
                    COLORS.white
                  }
                />
              )}

              <Text
                style={
                  styles.imagePickerButtonText
                }
              >
                {selectedImageUri
                  ? 'Choose Different Image'
                  : previewImage
                    ? 'Replace Image'
                    : 'Choose Image'}
              </Text>
            </Pressable>

            <Text
              style={
                styles.imageHint
              }
            >
              JPG, JPEG, PNG, WEBP, GIF or
              HEIC images are supported.
            </Text>

          </View>

          {/* ==================================================
              AVAILABILITY
          ================================================== */}

          <View
            style={styles.sectionHeader}
          >
            <Text
              style={styles.sectionTitle}
            >
              Availability
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Control whether customers
              can currently see this
              product.
            </Text>
          </View>

          <View
            style={
              styles.availabilityCard
            }
          >

            <View
              style={
                styles.availabilityIcon
              }
            >
              <Ionicons
                name={
                  isActive
                    ? 'eye-outline'
                    : 'eye-off-outline'
                }
                size={21}
                color={
                  COLORS.teal
                }
              />
            </View>

            <View
              style={
                styles.availabilityContent
              }
            >
              <Text
                style={
                  styles.availabilityTitle
                }
              >
                Product Status
              </Text>

              <Text
                style={
                  styles.availabilityDescription
                }
              >
                {isActive
                  ? 'This product will be visible in the marketplace.'
                  : 'This product will be hidden from the marketplace.'}
              </Text>
            </View>

            <Switch
              value={isActive}
              onValueChange={
                setIsActive
              }
              disabled={saving}
              trackColor={{
                false: '#D1D5DB',
                true: '#8EDDDD',
              }}
              thumbColor={
                isActive
                  ? COLORS.teal
                  : '#F4F4F5'
              }
            />

          </View>

          {/* ==================================================
              ACTIONS
          ================================================== */}

          <View
            style={
              styles.bottomActions
            }
          >

            <Pressable
              style={({
                pressed,
              }) => [
                styles.cancelButton,
                pressed &&
                  styles.pressed,
              ]}
              onPress={handleBack}
              disabled={saving}
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
              style={({
                pressed,
              }) => [
                styles.saveButton,
                pressed &&
                  styles.pressed,
                saving &&
                  styles.saveButtonDisabled,
              ]}
              onPress={
                handleSaveProduct
              }
              disabled={saving}
            >

              {saving ? (
                <ActivityIndicator
                  size="small"
                  color={
                    COLORS.white
                  }
                />
              ) : (
                <Ionicons
                  name={
                    isEditMode
                      ? 'save-outline'
                      : 'checkmark'
                  }
                  size={20}
                  color={
                    COLORS.white
                  }
                />
              )}

              <Text
                style={
                  styles.saveButtonText
                }
              >
                {saving
                  ? isUploadingImage
                    ? 'Uploading Image...'
                    : isEditMode
                      ? 'Updating...'
                      : 'Creating...'
                  : isEditMode
                    ? 'Update Product'
                    : 'Save Product'}
              </Text>

            </Pressable>

          </View>

          <Text
            style={
              styles.footerText
            }
          >
            Green Off-Grid Marketing
            Workspace
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ==============================================================
   FORM FIELD
============================================================== */

interface FormFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  required?: boolean;
  keyboardType?:
    | 'default'
    | 'decimal-pad'
    | 'number-pad';
  prefix?: string;
  autoCapitalize?:
    | 'none'
    | 'sentences'
    | 'words'
    | 'characters';
}

function FormField({
  label,
  placeholder,
  value,
  onChangeText,
  required = false,
  keyboardType = 'default',
  prefix,
  autoCapitalize = 'sentences',
}: FormFieldProps) {
  return (
    <View
      style={styles.field}
    >
      <Text
        style={styles.label}
      >
        {label}

        {required && (
          <Text
            style={
              styles.required
            }
          >
            {' '}*
          </Text>
        )}
      </Text>

      <View
        style={
          styles.inputWrapper
        }
      >

        {prefix && (
          <Text
            style={
              styles.inputPrefix
            }
          >
            {prefix}
          </Text>
        )}

        <TextInput
          placeholder={placeholder}
          placeholderTextColor={
            COLORS.muted
          }
          value={value}
          onChangeText={
            onChangeText
          }
          style={[
            styles.input,
            prefix &&
              styles.inputWithPrefix,
          ]}
          keyboardType={
            keyboardType
          }
          autoCapitalize={
            autoCapitalize
          }
          autoCorrect={
            keyboardType ===
            'default'
          }
        />

      </View>
    </View>
  );
}

/* ==============================================================
   COLORS
============================================================== */

const COLORS = {
  background: '#F7FAFA',
  surface: '#FFFFFF',
  border: '#E2EBEB',

  teal: '#24B8B8',
  tealDark: '#0D6464',
  tealLight: '#EEF9F9',

  text: '#163838',
  secondaryText: '#557070',
  muted: '#8A9B9B',

  white: '#FFFFFF',

  danger: '#C94A4A',
  success: '#27835C',
};

/* ==============================================================
   STYLES
============================================================== */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  keyboardContainer: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  /* ------------------------------------------------------------
     LOADING
  ------------------------------------------------------------ */

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  loadingTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '800',
    color:
      COLORS.text,
  },

  loadingSubtitle: {
    marginTop: 6,
    fontSize: 13,
    textAlign: 'center',
    color:
      COLORS.secondaryText,
  },

  /* ------------------------------------------------------------
     HEADER
  ------------------------------------------------------------ */

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 28,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.surface,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    marginRight: 13,
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    color:
      COLORS.tealDark,
    marginBottom: 4,
  },

  title: {
    fontSize: 29,
    fontWeight: '800',
    color:
      COLORS.text,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color:
      COLORS.secondaryText,
  },

  /* ------------------------------------------------------------
     ERROR
  ------------------------------------------------------------ */

  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 15,
    marginBottom: 22,
    borderRadius: 15,
    backgroundColor:
      '#FEF2F2',
    borderWidth: 1,
    borderColor:
      '#FECACA',
  },

  errorContent: {
    flex: 1,
    marginLeft: 10,
  },

  errorTitle: {
    fontSize: 14,
    fontWeight: '800',
    color:
      '#991B1B',
  },

  errorText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color:
      '#B91C1C',
  },

  /* ------------------------------------------------------------
     SECTIONS
  ------------------------------------------------------------ */

  sectionHeader: {
    marginBottom: 13,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color:
      COLORS.text,
  },

  sectionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color:
      COLORS.secondaryText,
  },

  /* ------------------------------------------------------------
     FORM
  ------------------------------------------------------------ */

  formCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor:
      COLORS.surface,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    marginBottom: 28,
  },

  field: {
    marginBottom: 18,
  },

  label: {
    marginBottom: 7,
    fontSize: 13,
    fontWeight: '700',
    color:
      COLORS.text,
  },

  required: {
    color:
      COLORS.danger,
  },

  inputWrapper: {
    position: 'relative',
    justifyContent:
      'center',
  },

  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 13,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      '#FBFDFD',
    fontSize: 14,
    color:
      COLORS.text,
  },

  inputWithPrefix: {
    paddingLeft: 34,
  },

  inputPrefix: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
    fontSize: 14,
    fontWeight: '700',
    color:
      COLORS.tealDark,
  },

  descriptionInput: {
    minHeight: 125,
    paddingTop: 13,
  },

  /* ------------------------------------------------------------
     IMAGE
  ------------------------------------------------------------ */

  imageSection: {
    padding: 18,
    borderRadius: 18,
    backgroundColor:
      COLORS.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor:
      COLORS.teal,
    marginBottom: 28,
  },

  imagePreviewContainer: {
    width: '100%',
    height: 210,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor:
      COLORS.tealLight,
    position: 'relative',
  },

  imagePreview: {
    width: '100%',
    height: '100%',
  },

  newImageBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor:
      'rgba(13,100,100,0.92)',
  },

  newImageBadgeText: {
    marginLeft: 5,
    fontSize: 11,
    fontWeight: '800',
    color:
      COLORS.white,
  },

  currentImageBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor:
      'rgba(255,255,255,0.94)',
  },

  currentImageBadgeText: {
    marginLeft: 5,
    fontSize: 11,
    fontWeight: '800',
    color:
      COLORS.tealDark,
  },

  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 190,
    paddingHorizontal: 25,
    marginBottom: 14,
    borderRadius: 15,
    backgroundColor:
      COLORS.tealLight,
  },

  imagePlaceholderIcon: {
    width: 65,
    height: 65,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.surface,
    marginBottom: 12,
  },

  imagePlaceholderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color:
      COLORS.text,
  },

  imagePlaceholderText: {
    marginTop: 6,
    maxWidth: 280,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color:
      COLORS.secondaryText,
  },

  imagePickerButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 13,
    backgroundColor:
      COLORS.teal,
  },

  imagePickerButtonText: {
    marginLeft: 7,
    fontSize: 13,
    fontWeight: '800',
    color:
      COLORS.white,
  },

  imageHint: {
    marginTop: 9,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    color:
      COLORS.muted,
  },

  disabledButton: {
    opacity: 0.65,
  },

  /* ------------------------------------------------------------
     AVAILABILITY
  ------------------------------------------------------------ */

  availabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 16,
    backgroundColor:
      COLORS.surface,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    marginBottom: 28,
  },

  availabilityIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.tealLight,
  },

  availabilityContent: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  availabilityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color:
      COLORS.text,
  },

  availabilityDescription: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    color:
      COLORS.secondaryText,
  },

  /* ------------------------------------------------------------
     ACTIONS
  ------------------------------------------------------------ */

  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  cancelButton: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor:
      COLORS.surface,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    marginRight: 9,
  },

  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color:
      COLORS.secondaryText,
  },

  saveButton: {
    flex: 1.35,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor:
      COLORS.teal,
    marginLeft: 9,
  },

  saveButtonDisabled: {
    opacity: 0.7,
  },

  saveButtonText: {
    marginLeft: 7,
    fontSize: 14,
    fontWeight: '800',
    color:
      COLORS.white,
  },

  pressed: {
    opacity: 0.72,
  },

  /* ------------------------------------------------------------
     FOOTER
  ------------------------------------------------------------ */

  footerText: {
    textAlign: 'center',
    fontSize: 10,
    color:
      COLORS.muted,
    marginTop: 4,
  },
});

