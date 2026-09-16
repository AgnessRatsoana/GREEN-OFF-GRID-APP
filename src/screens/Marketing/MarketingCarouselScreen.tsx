import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

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
  {
    id: 'built-in-1',
    title: "We've got your back",
    image: require('../../assets/images/franchise-outlet-4.jpeg'),
  },
  {
    id: 'built-in-2',
    title:
      'Power every install with quality gear',
    image: require('../../assets/images/panellCorousel.jpg'),
  },
  {
    id: 'built-in-3',
    title:
      'From chargers to clamps, build smarter',
    image: require('../../assets/images/sollarCorousel.jpg'),
  },
];

const GRADIENT_COLORS = [
  '#24b8b8A6',
  '#24b8b87A',
  '#24b8b83D',
  '#24b8b800',
] as const;

/*
 * The admin enters duration in seconds.
 *
 * The database stores duration in milliseconds.
 *
 * 5 seconds = 5000 ms
 */
const DEFAULT_IMAGE_DURATION_SECONDS = 5;
const DEFAULT_IMAGE_DURATION_MS = 5000;

function CarouselPreviewMedia({
  type,
  uri,
}: {
  type: CarouselMediaType;
  uri: string;
}) {
  const player = useVideoPlayer(
    type === 'video' ? uri : '',
    (videoPlayer) => {
      videoPlayer.loop = false;
      videoPlayer.muted = true;
      videoPlayer.play();
    },
  );

  if (type === 'video') {
    return (
      <VideoView
        player={player}
        style={styles.previewMedia}
        contentFit="cover"
        nativeControls={false}
      />
    );
  }

  return (
    <Image
      source={{ uri }}
      style={styles.previewMedia}
      resizeMode="cover"
    />
  );
}

export function MarketingCarouselScreen() {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList>
    >();

  const role = useAuthStore(
    (state) => state.user?.role,
  );

  const [items, setItems] =
    useState<CarouselItem[]>([]);

  const [editingId, setEditingId] =
    useState<string | undefined>();

  const [deleteCandidate, setDeleteCandidate] =
    useState<CarouselItem | null>(null);

  const [mediaType, setMediaType] =
    useState<CarouselMediaType>('image');

  const [mediaUri, setMediaUri] =
    useState('');

  const [subtitle, setSubtitle] =
    useState('');

  const [mainTitle, setMainTitle] =
    useState('');

  const [pointOne, setPointOne] =
    useState('');

  const [pointTwo, setPointTwo] =
    useState('');

  const [primaryButtonText, setPrimaryButtonText] =
    useState('');

  const [
    secondaryButtonText,
    setSecondaryButtonText,
  ] = useState('');

  const [showGradient, setShowGradient] =
    useState(true);

  /*
   * IMPORTANT:
   *
   * This field is ALWAYS displayed to the
   * marketing user in seconds.
   *
   * Example:
   * "5" = 5 seconds
   */
  const [
    imageDuration,
    setImageDuration,
  ] = useState(
    String(
      DEFAULT_IMAGE_DURATION_SECONDS,
    ),
  );

  const [displayOrder, setDisplayOrder] =
    useState('');

  const [isActive, setIsActive] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [isUploading, setIsUploading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(
    async () => {
      try {
        const loadedItems =
          await fetchCarouselItems(
            true,
          );

        setItems(loadedItems);
        setError(null);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load carousel content.',
        );
      }
    },
    [],
  );

  useEffect(() => {
    if (
      role !== 'marketing' &&
      role !== 'admin'
    ) {
      navigation.goBack();
      return;
    }

    void load();

    const unsubscribe =
      subscribeToCarouselItems(load);

    return unsubscribe;
  }, [
    load,
    navigation,
    role,
  ]);

  const pickMedia = async (
    type: CarouselMediaType,
  ) => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission required',
        'Allow media access to choose carousel content.',
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync(
        {
          mediaTypes:
            type === 'image'
              ? ['images']
              : ['videos'],

          allowsEditing:
            type === 'image',

          aspect: [16, 9],

          quality: 0.85,

          videoMaxDuration: 60,
        },
      );

    if (
      result.canceled ||
      !result.assets[0]
    ) {
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      setMediaType(type);

      const uploadedUrl =
        await uploadCarouselMedia(
          result.assets[0].uri,
          type,
        );

      setMediaUri(uploadedUrl);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Unable to upload carousel media.',
      );
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

    setPrimaryButtonText('');
    setSecondaryButtonText('');

    setShowGradient(true);

    setImageDuration(
      String(
        DEFAULT_IMAGE_DURATION_SECONDS,
      ),
    );

    setDisplayOrder('');
    setIsActive(true);

    setError(null);
  };

  const save = async () => {
    if (!mediaUri.trim()) {
      Alert.alert(
        'Missing media',
        'Please upload an image or video before saving.',
      );
      return;
    }

    const parsedDuration =
      Number(imageDuration);

    /*
     * Only images need a manually configured
     * duration.
     *
     * Videos use their actual video length.
     */
    if (
      mediaType === 'image' &&
      (!Number.isFinite(
        parsedDuration,
      ) ||
        parsedDuration <= 0)
    ) {
      Alert.alert(
        'Invalid image duration',
        'Please enter a duration greater than 0 seconds.',
      );
      return;
    }

    const parsedOrder =
      displayOrder.trim() === ''
        ? -1
        : Number(displayOrder);

    if (
      displayOrder.trim() !== '' &&
      (!Number.isFinite(
        parsedOrder,
      ) ||
        parsedOrder < 0)
    ) {
      Alert.alert(
        'Invalid display order',
        'Please enter a number such as 0, 1, 2 or 3.',
      );
      return;
    }

    /*
     * Convert the administrator's seconds
     * into milliseconds for storage.
     *
     * Example:
     *
     * 5  -> 5000
     * 10 -> 10000
     */
    const durationMilliseconds =
      mediaType === 'image'
        ? Math.round(
          parsedDuration * 1000,
        )
        : DEFAULT_IMAGE_DURATION_MS;

    setIsSaving(true);
    setError(null);

    try {
      await saveCarouselItem({
        id: editingId,

        type: mediaType,

        uri: mediaUri.trim(),

        subtitle:
          subtitle.trim(),

        mainTitle:
          mainTitle.trim(),

        pointOne:
          pointOne.trim(),

        pointTwo:
          pointTwo.trim(),

        primaryButtonText:
          primaryButtonText.trim(),

        secondaryButtonText:
          secondaryButtonText.trim(),

        showGradient,

        imageDuration:
          durationMilliseconds,

        displayOrder:
          parsedOrder,

        isActive,
      });

      resetForm();

      await load();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save carousel content.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const edit = (
    item: CarouselItem,
  ) => {
    setEditingId(item.id);

    setMediaType(item.type);
    setMediaUri(item.uri);

    setSubtitle(item.subtitle);
    setMainTitle(item.mainTitle);
    setPointOne(item.pointOne);
    setPointTwo(item.pointTwo);

    setPrimaryButtonText(
      item.primaryButtonText,
    );

    setSecondaryButtonText(
      item.secondaryButtonText,
    );

    setShowGradient(
      item.showGradient,
    );

    /*
     * Database stores milliseconds.
     *
     * Convert back to seconds for the
     * marketing manager.
     *
     * 5000 -> 5
     */
    const storedDurationMs =
      Number(item.imageDuration);

    const durationSeconds =
      Number.isFinite(
        storedDurationMs,
      ) &&
        storedDurationMs > 0
        ? storedDurationMs / 1000
        : DEFAULT_IMAGE_DURATION_SECONDS;

    setImageDuration(
      String(
        Number.isInteger(
          durationSeconds,
        )
          ? durationSeconds
          : Number(
            durationSeconds.toFixed(
              2,
            ),
          ),
      ),
    );

    setDisplayOrder(
      String(item.displayOrder),
    );

    setIsActive(
      item.isActive,
    );

    setError(null);
  };

  const remove = (item: CarouselItem) => {
    console.log(
      '🗑️ OPENING DELETE CONFIRMATION',
      item.id,
      item.mainTitle,
    );

    setDeleteCandidate(item);
  };


  const confirmDelete = async () => {
    if (!deleteCandidate) {
      return;
    }

    const item = deleteCandidate;

    setDeleteCandidate(null);
    setError(null);

    try {
      console.log(
        '🗑️ DELETING CAROUSEL SLIDE',
        item.id,
      );

      await deleteCarouselItem(item.id);

      if (editingId === item.id) {
        resetForm();
      }

      setItems((currentItems) =>
        currentItems.filter(
          (currentItem) =>
            currentItem.id !== item.id,
        ),
      );

      await load();

      Alert.alert(
        'Deleted',
        'The carousel slide was deleted successfully.',
      );
    } catch (deleteError) {
      console.error(
        'Failed to delete carousel slide:',
        deleteError,
      );

      const message =
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete carousel content. Please try again.';

      setError(message);

      Alert.alert(
        'Delete failed',
        message,
      );
    }
  };


  const hasPreviewText =
    Boolean(
      subtitle.trim(),
    ) ||
    Boolean(
      mainTitle.trim(),
    ) ||
    Boolean(
      pointOne.trim(),
    ) ||
    Boolean(
      pointTwo.trim(),
    ) ||
    Boolean(
      primaryButtonText.trim(),
    ) ||
    Boolean(
      secondaryButtonText.trim(),
    );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          style={styles.headerButton}
          onPress={() =>
            navigation.goBack()
          }
        >
          <Ionicons
            name="arrow-back"
            size={21}
            color="#0F6464"
          />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text
            style={
              styles.eyebrow
            }
          >
            MARKETING STUDIO
          </Text>

          <Text
            style={
              styles.headerTitle
            }
          >
            Carousel manager
          </Text>
        </View>

        <Ionicons
          name="images-outline"
          size={24}
          color="#24B8B8"
        />
      </View>

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={
            styles.introCard
          }
        >
          <Text
            style={
              styles.introTitle
            }
          >
            Client carousel
          </Text>

          <Text
            style={
              styles.introText
            }
          >
            Manage the media, optional
            text, visibility, gradient,
            image duration and display
            order used by the client
            dashboard.
          </Text>
        </View>

        <View
          style={
            styles.formCard
          }
        >
          <View
            style={
              styles.sectionHeader
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              {editingId
                ? 'Edit carousel slide'
                : 'Create carousel slide'}
            </Text>

            {editingId ? (
              <Pressable
                onPress={
                  resetForm
                }
              >
                <Text
                  style={
                    styles.cancelText
                  }
                >
                  Cancel edit
                </Text>
              </Pressable>
            ) : null}
          </View>

          <View
            style={
              styles.mediaRow
            }
          >
            <Pressable
              style={[
                styles.mediaButton,
                mediaType ===
                'image' &&
                styles.mediaButtonActive,
              ]}
              onPress={() =>
                pickMedia(
                  'image',
                )
              }
            >
              <Ionicons
                name="image-outline"
                size={18}
                color={
                  mediaType ===
                    'image'
                    ? '#FFFFFF'
                    : '#0F6464'
                }
              />

              <Text
                style={[
                  styles.mediaButtonText,
                  mediaType ===
                  'image' &&
                  styles.mediaButtonTextActive,
                ]}
              >
                Upload image
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.mediaButton,
                mediaType ===
                'video' &&
                styles.mediaButtonActive,
              ]}
              onPress={() =>
                pickMedia(
                  'video',
                )
              }
            >
              <Ionicons
                name="videocam-outline"
                size={18}
                color={
                  mediaType ===
                    'video'
                    ? '#FFFFFF'
                    : '#0F6464'
                }
              />

              <Text
                style={[
                  styles.mediaButtonText,
                  mediaType ===
                  'video' &&
                  styles.mediaButtonTextActive,
                ]}
              >
                Upload video
              </Text>
            </Pressable>
          </View>

          {isUploading ? (
            <ActivityIndicator
              color="#24B8B8"
            />
          ) : null}

          {mediaUri ? (
            <View
              style={
                styles.mediaPreview
              }
            >
              <Ionicons
                name={
                  mediaType ===
                    'video'
                    ? 'videocam-outline'
                    : 'checkmark-circle-outline'
                }
                size={18}
                color="#0F6464"
              />

              <Text
                style={
                  styles.mediaPreviewText
                }
              >
                {mediaType ===
                  'video'
                  ? 'Video uploaded and ready'
                  : 'Image uploaded and ready'}
              </Text>
            </View>
          ) : null}

          <Text
            style={
              styles.fieldLabel
            }
          >
            Subtitle — optional
          </Text>

          <TextInput
            value={subtitle}
            onChangeText={
              setSubtitle
            }
            placeholder="Example: Got a FRANCHISE?"
            placeholderTextColor="#789292"
            style={styles.input}
          />

          <Text
            style={
              styles.fieldLabel
            }
          >
            Main title — optional
          </Text>

          <TextInput
            value={mainTitle}
            onChangeText={
              setMainTitle
            }
            placeholder="Example: We've got your back"
            placeholderTextColor="#789292"
            style={styles.input}
          />

          <Text
            style={
              styles.fieldLabel
            }
          >
            First bullet point — optional
          </Text>

          <TextInput
            value={pointOne}
            onChangeText={
              setPointOne
            }
            placeholder="Example: Reliable support for every franchise"
            placeholderTextColor="#789292"
            style={styles.input}
          />

          <Text
            style={
              styles.fieldLabel
            }
          >
            Second bullet point — optional
          </Text>

          <TextInput
            value={pointTwo}
            onChangeText={
              setPointTwo
            }
            placeholder="Example: Quality products for every installation"
            placeholderTextColor="#789292"
            style={styles.input}
          />

          <Text
            style={
              styles.fieldLabel
            }
          >
            Buttons — optional
          </Text>

          <View
            style={
              styles.splitRow
            }
          >
            <TextInput
              value={
                primaryButtonText
              }
              onChangeText={
                setPrimaryButtonText
              }
              placeholder="Primary button"
              placeholderTextColor="#789292"
              style={[
                styles.input,
                styles.splitInput,
              ]}
            />

            <TextInput
              value={
                secondaryButtonText
              }
              onChangeText={
                setSecondaryButtonText
              }
              placeholder="Secondary button"
              placeholderTextColor="#789292"
              style={[
                styles.input,
                styles.splitInput,
              ]}
            />
          </View>

          <View
            style={
              styles.settingsCard
            }
          >
            <View
              style={
                styles.settingRow
              }
            >
              <View
                style={
                  styles.settingCopy
                }
              >
                <Text
                  style={
                    styles.settingTitle
                  }
                >
                  Gradient overlay
                </Text>

                <Text
                  style={
                    styles.settingDescription
                  }
                >
                  Add a dark/turquoise
                  overlay behind the
                  text.
                </Text>
              </View>

              <Switch
                value={
                  showGradient
                }
                onValueChange={
                  setShowGradient
                }
                trackColor={{
                  false: '#CBD8D8',
                  true: '#8ADBD7',
                }}
                thumbColor={
                  showGradient
                    ? '#0F6464'
                    : '#FFFFFF'
                }
              />
            </View>

            <View
              style={
                styles.settingDivider
              }
            />

            <View
              style={
                styles.settingRow
              }
            >
              <View
                style={
                  styles.settingCopy
                }
              >
                <Text
                  style={
                    styles.settingTitle
                  }
                >
                  {mediaType ===
                    'video'
                    ? 'Video duration'
                    : 'Image duration'}
                </Text>

                <Text
                  style={
                    styles.settingDescription
                  }
                >
                  {mediaType ===
                    'video'
                    ? 'Videos play completely and advance automatically when they finish.'
                    : 'Images advance after this many seconds.'}
                </Text>
              </View>

              {mediaType ===
                'video' ? (
                <View
                  style={
                    styles.automaticDurationBadge
                  }
                >
                  <Ionicons
                    name="infinite-outline"
                    size={15}
                    color="#0F6464"
                  />

                  <Text
                    style={
                      styles.automaticDurationText
                    }
                  >
                    Automatic
                  </Text>
                </View>
              ) : (
                <View
                  style={
                    styles.durationField
                  }
                >
                  <TextInput
                    value={
                      imageDuration
                    }
                    onChangeText={
                      setImageDuration
                    }
                    keyboardType="decimal-pad"
                    placeholder="5"
                    placeholderTextColor="#789292"
                    style={
                      styles.durationInput
                    }
                  />

                  <Text
                    style={
                      styles.secondsLabel
                    }
                  >
                    sec
                  </Text>
                </View>
              )}
            </View>

            <View
              style={
                styles.settingDivider
              }
            />

            <View
              style={
                styles.settingRow
              }
            >
              <View
                style={
                  styles.settingCopy
                }
              >
                <Text
                  style={
                    styles.settingTitle
                  }
                >
                  Display order
                </Text>

                <Text
                  style={
                    styles.settingDescription
                  }
                >
                  Lower numbers appear
                  first. Leave empty to
                  automatically place a
                  new slide last.
                </Text>
              </View>

              <TextInput
                value={
                  displayOrder
                }
                onChangeText={
                  setDisplayOrder
                }
                keyboardType="number-pad"
                placeholder="Auto"
                placeholderTextColor="#789292"
                style={
                  styles.durationInput
                }
              />
            </View>

            <View
              style={
                styles.settingDivider
              }
            />

            <View
              style={
                styles.settingRow
              }
            >
              <View
                style={
                  styles.settingCopy
                }
              >
                <Text
                  style={
                    styles.settingTitle
                  }
                >
                  Visible to clients
                </Text>

                <Text
                  style={
                    styles.settingDescription
                  }
                >
                  Hidden slides remain
                  available in the
                  manager.
                </Text>
              </View>

              <Switch
                value={
                  isActive
                }
                onValueChange={
                  setIsActive
                }
                trackColor={{
                  false: '#CBD8D8',
                  true: '#8ADBD7',
                }}
                thumbColor={
                  isActive
                    ? '#0F6464'
                    : '#FFFFFF'
                }
              />
            </View>
          </View>

          {mediaUri ? (
            <View
              style={
                styles.previewCard
              }
            >
              <Text
                style={
                  styles.previewLabel
                }
              >
                LIVE PREVIEW
              </Text>

              <View
                style={
                  styles.previewSlide
                }
              >
                <CarouselPreviewMedia
                  type={
                    mediaType
                  }
                  uri={
                    mediaUri
                  }
                />

                {showGradient ? (
                  <LinearGradient
                    colors={
                      GRADIENT_COLORS
                    }
                    locations={[
                      0,
                      0.32,
                      0.56,
                      0.78,
                    ]}
                    start={{
                      x: 0,
                      y: 0.22,
                    }}
                    end={{
                      x: 1,
                      y: 0.04,
                    }}
                    style={
                      styles.previewOverlay
                    }
                  />
                ) : null}

                {hasPreviewText ? (
                  <View
                    style={
                      styles.previewContent
                    }
                  >
                    {subtitle.trim() ? (
                      <Text
                        style={
                          styles.previewSubtitle
                        }
                      >
                        {
                          subtitle
                        }
                      </Text>
                    ) : null}

                    {mainTitle.trim() ? (
                      <Text
                        style={
                          styles.previewTitle
                        }
                      >
                        {
                          mainTitle
                        }
                      </Text>
                    ) : null}

                    {pointOne.trim() ? (
                      <View
                        style={
                          styles.previewPointRow
                        }
                      >
                        <Ionicons
                          name="flash"
                          size={12}
                          color="#FFFFFF"
                        />

                        <Text
                          style={
                            styles.previewPoint
                          }
                        >
                          {
                            pointOne
                          }
                        </Text>
                      </View>
                    ) : null}

                    {pointTwo.trim() ? (
                      <View
                        style={
                          styles.previewPointRow
                        }
                      >
                        <Ionicons
                          name="flash"
                          size={12}
                          color="#FFFFFF"
                        />

                        <Text
                          style={
                            styles.previewPoint
                          }
                        >
                          {
                            pointTwo
                          }
                        </Text>
                      </View>
                    ) : null}

                    {primaryButtonText.trim() ||
                      secondaryButtonText.trim() ? (
                      <View
                        style={
                          styles.previewButtons
                        }
                      >
                        {primaryButtonText.trim() ? (
                          <Text
                            style={
                              styles.previewPrimary
                            }
                          >
                            {
                              primaryButtonText
                            }
                          </Text>
                        ) : null}

                        {secondaryButtonText.trim() ? (
                          <Text
                            style={
                              styles.previewSecondary
                            }
                          >
                            {
                              secondaryButtonText
                            }
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {error ? (
            <Text
              style={
                styles.error
              }
            >
              {error}
            </Text>
          ) : null}

          <Pressable
            style={
              styles.saveButton
            }
            onPress={save}
            disabled={
              isSaving ||
              isUploading
            }
          >
            {isSaving ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <>
                <Ionicons
                  name="cloud-upload-outline"
                  size={18}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  {editingId
                    ? 'Save changes'
                    : 'Publish carousel slide'}
                </Text>
              </>
            )}
          </Pressable>
        </View>

        <View
          style={
            styles.sectionHeader
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            All carousel slides
          </Text>

          <Text
            style={styles.count}
          >
            {items.length}
          </Text>
        </View>

        <Text
          style={
            styles.orderHint
          }
        >
          Client slides are displayed
          from the lowest order number
          to the highest.
        </Text>

        <Text
          style={
            styles.builtInHeading
          }
        >
          Built-in fallback slides
        </Text>

        <Text
          style={
            styles.fallbackDescription
          }
        >
          These are used only when no
          active database carousel
          slides are available.
        </Text>

        {builtInSlides.map(
          (item) => (
            <View
              key={item.id}
              style={
                styles.itemCard
              }
            >
              <View
                style={
                  styles.itemMedia
                }
              >
                <Image
                  source={
                    item.image
                  }
                  style={
                    styles.itemImage
                  }
                  resizeMode="cover"
                />
              </View>

              <View
                style={
                  styles.itemBody
                }
              >
                <Text
                  style={
                    styles.itemType
                  }
                >
                  BUILT-IN · FALLBACK
                </Text>

                <Text
                  style={
                    styles.itemTitle
                  }
                >
                  {item.title}
                </Text>

                <Text
                  style={
                    styles.itemMeta
                  }
                >
                  Used only when there
                  are no active database
                  slides.
                </Text>
              </View>
            </View>
          ),
        )}

        {items.length === 0 ? (
          <View
            style={
              styles.emptyCard
            }
          >
            <Ionicons
              name="images-outline"
              size={30}
              color="#8AA2A2"
            />

            <Text
              style={
                styles.emptyTitle
              }
            >
              No database slides yet
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Create your first slide
              above. The client will
              currently use the built-in
              fallback slides.
            </Text>
          </View>
        ) : null}

        {items.map(
          (item) => (
            <View
              key={item.id}
              style={
                styles.itemCard
              }
            >
              <View
                style={[
                  styles.itemMedia,
                  item.type ===
                  'video' &&
                  styles.videoMedia,
                ]}
              >
                {item.type ===
                  'image' ? (
                  <Image
                    source={{
                      uri: item.uri,
                    }}
                    style={
                      styles.itemImage
                    }
                    resizeMode="cover"
                  />
                ) : (
                  <>
                    <Ionicons
                      name="videocam"
                      size={23}
                      color="#24B8B8"
                    />

                    <Text
                      style={
                        styles.videoBadge
                      }
                    >
                      VIDEO
                    </Text>
                  </>
                )}
              </View>

              <View
                style={
                  styles.itemBody
                }
              >
                <Text
                  style={
                    styles.itemType
                  }
                >
                  {item.type.toUpperCase()} ·{' '}
                  {item.isActive
                    ? 'VISIBLE'
                    : 'HIDDEN'}
                </Text>

                <Text
                  style={
                    styles.itemTitle
                  }
                >
                  {item.mainTitle ||
                    'Untitled slide'}
                </Text>

                <Text
                  style={
                    styles.itemMeta
                  }
                >
                  Order{' '}
                  {
                    item.displayOrder
                  }{' '}
                  ·{' '}
                  {item.showGradient
                    ? 'Gradient on'
                    : 'Gradient off'}
                </Text>

                <Text
                  style={
                    styles.itemMeta
                  }
                >
                  {item.type ===
                    'image'
                    ? `${Math.max(
                      1,
                      Math.round(
                        Number(
                          item.imageDuration,
                        ) /
                        1000,
                      ),
                    )}s image duration`
                    : 'Plays completely · automatic advance'}
                </Text>

                <Text
                  style={
                    styles.itemDate
                  }
                >
                  Updated{' '}
                  {new Date(
                    item.updatedAt,
                  ).toLocaleString()}
                </Text>
              </View>

              <View
                style={
                  styles.itemActions
                }
              >
                <Pressable
                  onPress={() =>
                    edit(item)
                  }
                  hitSlop={8}
                >
                  <Ionicons
                    name="create-outline"
                    size={21}
                    color="#0F6464"
                  />
                </Pressable>




                {Platform.OS === 'web' ? (
                  <button
                    type="button"
                    aria-label={`Delete ${item.mainTitle || 'carousel slide'}`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();

                      console.log(
                        '🗑️ WEB DELETE CLICKED',
                        item.id,
                        item.mainTitle,
                      );

                      setDeleteCandidate(item);
                    }}
                    style={{
                      width: 42,
                      height: 42,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      borderRadius: 10,
                      backgroundColor: '#FFF1F1',
                      cursor: 'pointer',
                      padding: 0,
                      margin: 0,
                      flexShrink: 0,
                      position: 'relative',
                      zIndex: 1000,
                    }}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={21}
                      color="#C94A4A"
                    />
                  </button>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${item.mainTitle || 'carousel slide'}`}
                    onPress={() => {
                      setDeleteCandidate(item);
                    }}
                    hitSlop={8}
                    style={styles.deleteButton}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={21}
                      color="#C94A4A"
                    />
                  </Pressable>
                )}



              </View>
            </View>
          ),
        )}
      </ScrollView>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        visible={deleteCandidate !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteCandidate(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor:
              'rgba(0, 0, 0, 0.55)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: '#FFFFFF',
              borderRadius: 18,
              padding: 24,
            }}
          >
            <Text
              style={{
                fontSize: 21,
                fontWeight: '700',
                color: '#172033',
                marginBottom: 10,
              }}
            >
              Delete carousel slide?
            </Text>

            <Text
              style={{
                fontSize: 15,
                lineHeight: 22,
                color: '#5B6472',
                marginBottom: 24,
              }}
            >
              Are you sure you want to permanently delete{' '}
              <Text
                style={{
                  fontWeight: '700',
                }}
              >
                {deleteCandidate?.mainTitle ||
                  'this carousel slide'}
              </Text>
              ?
              {'\n\n'}
              This action cannot be undone.
            </Text>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: 12,
              }}
            >
              <Pressable
                onPress={() =>
                  setDeleteCandidate(null)
                }
                style={{
                  paddingVertical: 11,
                  paddingHorizontal: 18,
                  borderRadius: 10,
                  backgroundColor: '#EEF1F5',
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: '#374151',
                  }}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  void confirmDelete();
                }}
                style={{
                  paddingVertical: 11,
                  paddingHorizontal: 18,
                  borderRadius: 10,
                  backgroundColor: '#C94A4A',
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: '#FFFFFF',
                  }}
                >
                  Delete
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5FAFA',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: 17,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DDEAEA',
  },

  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF9F9',
  },

  headerCopy: {
    flex: 1,
    marginLeft: 12,
  },

  eyebrow: {
    color: '#0F6464',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },

  headerTitle: {
    color: '#163838',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 3,
  },

  content: {
    padding: 16,
    paddingBottom: 120,
    gap: 14,
  },

  introCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#0D6464',
  },

  introTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },

  introText: {
    color: '#D8F4F2',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },

  formCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDEAEA',
    gap: 11,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    color: '#163838',
    fontSize: 17,
    fontWeight: '800',
  },

  cancelText: {
    color: '#0F6464',
    fontSize: 12,
    fontWeight: '700',
  },

  count: {
    color: '#0F6464',
    fontSize: 13,
    fontWeight: '800',
  },

  mediaRow: {
    flexDirection: 'row',
    gap: 8,
  },

  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#EEF9F9',
    borderWidth: 1,
    borderColor: '#B9DCDC',
  },

  mediaButtonActive: {
    backgroundColor: '#24B8B8',
    borderColor: '#24B8B8',
  },

  mediaButtonText: {
    color: '#0F6464',
    fontSize: 12,
    fontWeight: '700',
  },

  mediaButtonTextActive: {
    color: '#FFFFFF',
  },

  mediaPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F0FAFA',
    borderWidth: 1,
    borderColor: '#C6E7E5',
  },

  mediaPreviewText: {
    color: '#0F6464',
    fontSize: 12,
    fontWeight: '700',
  },

  fieldLabel: {
    color: '#557070',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
    marginBottom: -4,
  },

  input: {
    borderWidth: 1,
    borderColor: '#C8DCDC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: '#163838',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
  },

  splitRow: {
    flexDirection: 'row',
    gap: 8,
  },

  splitInput: {
    flex: 1,
  },

  settingsCard: {
    borderRadius: 14,
    backgroundColor: '#F4FAFA',
    borderWidth: 1,
    borderColor: '#DDEAEA',
    paddingHorizontal: 13,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    gap: 12,
  },

  settingCopy: {
    flex: 1,
  },

  settingTitle: {
    color: '#163838',
    fontSize: 13,
    fontWeight: '800',
  },

  settingDescription: {
    color: '#789292',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3,
  },

  settingDivider: {
    height: 1,
    backgroundColor: '#DDEAEA',
  },

  durationField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  durationInput: {
    width: 62,
    borderWidth: 1,
    borderColor: '#C8DCDC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#163838',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },

  secondsLabel: {
    color: '#789292',
    fontSize: 11,
    fontWeight: '700',
  },

  automaticDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#E1F4F2',
    borderWidth: 1,
    borderColor: '#B9DCDC',
  },

  automaticDurationText: {
    color: '#0F6464',
    fontSize: 11,
    fontWeight: '800',
  },

  previewCard: {
    marginTop: 3,
    gap: 7,
  },

  previewLabel: {
    color: '#0F6464',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  previewSlide: {
    height: 230,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0D6464',
  },

  previewMedia: {
    ...StyleSheet.absoluteFill,
  },

  previewOverlay: {
    ...StyleSheet.absoluteFill,
  },

  previewContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: 'flex-end',
  },

  previewSubtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 3,
  },

  previewTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '800',
    maxWidth: '88%',
    marginBottom: 5,
  },

  previewPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: 4,
  },

  previewPoint: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 14,
  },

  previewButtons: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },

  previewPrimary: {
    color: '#1F7F7F',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 9,
    fontWeight: '700',
  },

  previewSecondary: {
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 9,
    fontWeight: '700',
  },

  error: {
    color: '#C94A4A',
    fontSize: 12,
    lineHeight: 17,
  },

  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#24B8B8',
    borderRadius: 12,
    paddingVertical: 12,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  orderHint: {
    color: '#789292',
    fontSize: 11,
    marginTop: -8,
  },

  builtInHeading: {
    color: '#557070',
    fontSize: 12,
    fontWeight: '800',
    marginTop: -4,
  },

  fallbackDescription: {
    color: '#789292',
    fontSize: 11,
    marginTop: -8,
  },

  itemCard: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 11,
  borderRadius: 16,
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#DDEAEA',
  gap: 11,
  position: 'relative',
  zIndex: 1,
},

  itemMedia: {
    width: 58,
    height: 58,
    borderRadius: 12,
    backgroundColor: '#EEF9F9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  videoMedia: {
    backgroundColor: '#E6F5F4',
  },

  itemImage: {
    width: '100%',
    height: '100%',
  },

  videoBadge: {
    color: '#0F6464',
    fontSize: 8,
    fontWeight: '800',
    marginTop: 3,
  },

  itemBody: {
    flex: 1,
  },

  itemType: {
    color: '#0F6464',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  itemTitle: {
    color: '#163838',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 3,
  },

  itemMeta: {
    color: '#557070',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3,
  },

  itemDate: {
    color: '#789292',
    fontSize: 10,
    marginTop: 4,
  },

  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    zIndex: 100,
    elevation: 20,
    position: 'relative',
  },

  deleteButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#FFF1F1',
    zIndex: 100,
    elevation: 20,
  },

  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDEAEA',
  },

  emptyTitle: {
    color: '#163838',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
  },

  emptyText: {
    color: '#789292',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 5,
    maxWidth: 300,
  },
});