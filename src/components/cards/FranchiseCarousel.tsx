import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  fetchCarouselItems,
  subscribeToCarouselItems,
  type CarouselItem,
} from '../../services/marketing/carousel';
import { appTheme } from '../../theme';

interface FallbackSlide {
  id: string;
  imageSource: number;
  subtitle: string;
  mainTitle: string;
  pointOne: string;
  pointTwo: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  showGradient: boolean;

  /**
   * Stored internally in milliseconds.
   * 5000 = 5 seconds.
   */
  imageDuration: number;
}

type CarouselSlide = CarouselItem | FallbackSlide;

const CARD_HORIZONTAL_PADDING =
  appTheme.spacing.md;

const CARD_BORDER_RADIUS = 24;

/**
 * All carousel durations are stored internally
 * in milliseconds.
 *
 * 5000 = 5 seconds
 */
const DEFAULT_IMAGE_DURATION_MS = 5000;

const GRADIENT_COLORS = [
  '#24b8b8A6',
  '#24b8b87A',
  '#24b8b83D',
  '#24b8b800',
] as const;

const fallbackSlides: FallbackSlide[] = [
  {
    id: 'slide-1',
    imageSource: require('../../assets/images/franchise-outlet-4.jpeg'),
    subtitle: 'Got a FRANCHISE?',
    mainTitle: "We've got your back",
    pointOne:
      'Get a franchise of your desire and become one of us',
    pointTwo:
      'With you every step of the franchise journey',
    primaryButtonText: 'Full-time service',
    secondaryButtonText: 'Schedule consultation',
    showGradient: true,
    imageDuration:
      DEFAULT_IMAGE_DURATION_MS,
  },

  {
    id: 'slide-2',
    imageSource: require('../../assets/images/panellCorousel.jpg'),
    subtitle: 'Accessories Spotlight',
    mainTitle:
      'Power every install with quality gear',
    pointOne:
      'Charge controllers, breakers and cables ready for your next job',
    pointTwo:
      'Stock trusted components for reliable off-grid performance',
    primaryButtonText: 'Shop accessories',
    secondaryButtonText: 'View top sellers',
    showGradient: true,
    imageDuration:
      DEFAULT_IMAGE_DURATION_MS,
  },

  {
    id: 'slide-3',
    imageSource: require('../../assets/images/sollarCorousel.jpg'),
    subtitle: 'Accessory Deals',
    mainTitle:
      'From chargers to clamps, build smarter',
    pointOne:
      'Save on daily essentials without compromising performance',
    pointTwo:
      'Everything you need for clean, tidy and safe installations',
    primaryButtonText: 'Browse new arrivals',
    secondaryButtonText: 'Compare accessories',
    showGradient: true,
    imageDuration:
      DEFAULT_IMAGE_DURATION_MS,
  },
];

function RemoteMedia({
  item,
  isActive,
  onVideoEnd,
}: {
  item: CarouselItem;
  isActive: boolean;
  onVideoEnd: () => void;
}) {
  const player = useVideoPlayer(
    item.type === 'video' ? item.uri : '',
    (videoPlayer) => {
      videoPlayer.loop = false;
      videoPlayer.muted = true;
    },
  );

  /*
   * Videos are controlled entirely by the active
   * carousel slide.
   *
   * When the slide becomes active:
   *   → play the video
   *
   * When the slide becomes inactive:
   *   → pause the video
   */
  useEffect(() => {
  if (item.type !== 'video') return;

  if (isActive) {
    // Always restart the video from the beginning
    player.currentTime = 0;

    // Make sure the video does not loop
    player.loop = false;

    // Start playback
    player.play();
  } else {
    // Pause inactive videos
    player.pause();
  }
}, [isActive, item.type, player]);

  /*
   * Only an active video is allowed to advance
   * the carousel.
   *
   * This means the video must actually reach its
   * natural end before the carousel moves on.
   */
  const handleVideoEnd = useCallback(() => {
    if (isActive) {
      onVideoEnd();
    }
  }, [
    isActive,
    onVideoEnd,
  ]);

  useEffect(() => {
  if (item.type !== 'video') return;

  let hasEnded = false;

  const subscription = player.addListener('playToEnd', () => {
    if (!isActive || hasEnded) {
      return;
    }

    hasEnded = true;

    onVideoEnd();
  });

  return () => {
    subscription.remove();
  };
}, [item.type, player, isActive, onVideoEnd]);

  if (item.type === 'video') {
    return (
      <VideoView
        player={player}
        style={styles.backgroundMedia}
        contentFit="cover"
        nativeControls={false}
      />
    );
  }

  return (
    <Image
      source={{ uri: item.uri }}
      style={styles.backgroundMedia}
      contentFit="cover"
    />
  );
}

export function FranchiseCarousel() {
  const scrollRef =
    useRef<ScrollView>(null);

  const imageTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

  const [activeIndex, setActiveIndex] =
    useState(0);

  const [remoteSlides, setRemoteSlides] =
    useState<CarouselItem[]>([]);

  const { width } =
    useWindowDimensions();

  const cardWidth = useMemo(
    () =>
      width -
      CARD_HORIZONTAL_PADDING * 2,
    [width],
  );

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const slides =
          await fetchCarouselItems();

        if (!mounted) {
          return;
        }

        setRemoteSlides(slides);
        setActiveIndex(0);

        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({
            x: 0,
            animated: false,
          });
        });
      } catch {
        /*
         * Built-in fallback slides keep the
         * dashboard usable if the database
         * is temporarily unavailable.
         */
      }
    };

    void load();

    const unsubscribe =
      subscribeToCarouselItems(load);

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  /*
   * If database slides exist, they completely
   * control the carousel.
   *
   * Built-in slides are only a fallback.
   */
  const slides: CarouselSlide[] =
    useMemo(
      () =>
        remoteSlides.length > 0
          ? remoteSlides
          : fallbackSlides,
      [remoteSlides],
    );

  /*
   * Keep activeIndex valid if the number of
   * slides changes.
   */
  useEffect(() => {
    if (activeIndex >= slides.length) {
      setActiveIndex(0);

      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          x: 0,
          animated: false,
        });
      });
    }
  }, [
    activeIndex,
    slides.length,
  ]);

  const goToSlide =
    useCallback(
      (index: number) => {
        if (slides.length === 0) {
          return;
        }

        const normalizedIndex =
          ((index % slides.length) +
            slides.length) %
          slides.length;

        setActiveIndex(
          normalizedIndex,
        );

        scrollRef.current?.scrollTo({
          x:
            normalizedIndex *
            cardWidth,
          animated: true,
        });
      },
      [
        cardWidth,
        slides.length,
      ],
    );

  const goToNextSlide =
    useCallback(() => {
      if (slides.length < 2) {
        return;
      }

      setActiveIndex(
        (currentIndex) => {
          const nextIndex =
            (currentIndex + 1) %
            slides.length;

          scrollRef.current?.scrollTo({
            x:
              nextIndex *
              cardWidth,
            animated: true,
          });

          return nextIndex;
        },
      );
    }, [
      cardWidth,
      slides.length,
    ]);

  const activeSlide =
    slides[activeIndex];

  /*
   * IMAGE TIMER
   *
   * Only images use this timer.
   *
   * Videos completely bypass this effect.
   * A video advances only through its
   * playToEnd event.
   */
  useEffect(() => {
    if (imageTimerRef.current) {
      clearTimeout(
        imageTimerRef.current,
      );

      imageTimerRef.current = null;
    }

    if (
      !activeSlide ||
      slides.length < 2
    ) {
      return undefined;
    }

    const isRemoteSlide =
      'uri' in activeSlide;

    const isVideo =
      isRemoteSlide &&
      activeSlide.type === 'video';

    /*
     * IMPORTANT:
     *
     * Never create an image timer for
     * a video.
     */
    if (isVideo) {
      return undefined;
    }

    /*
     * imageDuration is stored as milliseconds.
     *
     * Example:
     * 5000 = 5 seconds
     * 10000 = 10 seconds
     */
    const configuredDuration =
      'imageDuration' in activeSlide
        ? Number(
            activeSlide.imageDuration,
          )
        : DEFAULT_IMAGE_DURATION_MS;

    const durationMs =
      Number.isFinite(
        configuredDuration,
      ) &&
      configuredDuration > 0
        ? configuredDuration
        : DEFAULT_IMAGE_DURATION_MS;

    imageTimerRef.current =
      setTimeout(() => {
        goToNextSlide();
      }, durationMs);

    return () => {
      if (imageTimerRef.current) {
        clearTimeout(
          imageTimerRef.current,
        );

        imageTimerRef.current = null;
      }
    };
  }, [
    activeSlide,
    goToNextSlide,
    slides.length,
  ]);

  useEffect(() => {
    return () => {
      if (imageTimerRef.current) {
        clearTimeout(
          imageTimerRef.current,
        );
      }
    };
  }, []);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={
          false
        }
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const nextIndex =
            Math.round(
              event.nativeEvent
                .contentOffset.x /
                cardWidth,
            );

          if (
            nextIndex >= 0 &&
            nextIndex <
              slides.length
          ) {
            setActiveIndex(
              nextIndex,
            );
          }
        }}
      >
        {slides.map(
          (slide, index) => {
            const remoteSlide =
              'uri' in slide
                ? slide
                : null;

            const content =
              remoteSlide ??
              slide;

            const hasSubtitle =
              Boolean(
                content.subtitle?.trim(),
              );

            const hasMainTitle =
              Boolean(
                content.mainTitle?.trim(),
              );

            const hasPointOne =
              Boolean(
                content.pointOne?.trim(),
              );

            const hasPointTwo =
              Boolean(
                content.pointTwo?.trim(),
              );

            const hasPrimaryButton =
              Boolean(
                content.primaryButtonText?.trim(),
              );

            const hasSecondaryButton =
              Boolean(
                content.secondaryButtonText?.trim(),
              );

            const hasText =
              hasSubtitle ||
              hasMainTitle ||
              hasPointOne ||
              hasPointTwo ||
              hasPrimaryButton ||
              hasSecondaryButton;

            const showGradient =
              content.showGradient;

            return (
              <View
                key={content.id}
                style={[
                  styles.card,
                  {
                    width:
                      cardWidth,
                  },
                ]}
              >
                {remoteSlide ? (
                  <RemoteMedia
                    item={remoteSlide}
                    isActive={
                      index ===
                      activeIndex
                    }
                    onVideoEnd={
                      goToNextSlide
                    }
                  />
                ) : (
                  <Image
                    source={
                      (
                        content as FallbackSlide
                      ).imageSource
                    }
                    style={
                      styles.backgroundMedia
                    }
                    contentFit="cover"
                  />
                )}

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
                      styles.gradientOverlay
                    }
                  />
                ) : null}

                {hasText ? (
                  <View
                    style={
                      styles.contentArea
                    }
                  >
                    {hasSubtitle ? (
                      <Text
                        style={
                          styles.subTitle
                        }
                      >
                        {
                          content.subtitle
                        }
                      </Text>
                    ) : null}

                    {hasMainTitle ? (
                      <Text
                        style={
                          styles.mainTitle
                        }
                      >
                        {
                          content.mainTitle
                        }
                      </Text>
                    ) : null}

                    {hasPointOne ? (
                      <View
                        style={
                          styles.iconRow
                        }
                      >
                        <Ionicons
                          name="flash"
                          size={18}
                          color="#FFFFFF"
                        />

                        <Text
                          style={
                            styles.iconRowText
                          }
                        >
                          {
                            content.pointOne
                          }
                        </Text>
                      </View>
                    ) : null}

                    {hasPointTwo ? (
                      <View
                        style={
                          styles.iconRowSecondary
                        }
                      >
                        <Ionicons
                          name="flash"
                          size={18}
                          color="#FFFFFF"
                        />

                        <Text
                          style={
                            styles.iconRowText
                          }
                        >
                          {
                            content.pointTwo
                          }
                        </Text>
                      </View>
                    ) : null}

                    {hasPrimaryButton ||
                    hasSecondaryButton ? (
                      <View
                        style={
                          styles.buttonStack
                        }
                      >
                        {hasPrimaryButton ? (
                          <Pressable
                            style={
                              hasSecondaryButton
                                ? styles.primaryButton
                                : styles.singlePrimaryButton
                            }
                          >
                            <Text
                              style={
                                styles.primaryButtonText
                              }
                            >
                              {
                                content.primaryButtonText
                              }
                            </Text>
                          </Pressable>
                        ) : null}

                        {hasSecondaryButton ? (
                          <Pressable
                            style={
                              hasPrimaryButton
                                ? styles.secondaryButton
                                : styles.singleSecondaryButton
                            }
                          >
                            <Ionicons
                              name="calendar-outline"
                              size={16}
                              color="#FFFFFF"
                            />

                            <Text
                              style={
                                styles.secondaryButtonText
                              }
                            >
                              {
                                content.secondaryButtonText
                              }
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          },
        )}
      </ScrollView>

      {slides.length > 1 ? (
        <View style={styles.dotsRow}>
          {slides.map(
            (slide, index) => (
              <Pressable
                key={slide.id}
                onPress={() =>
                  goToSlide(index)
                }
                style={[
                  styles.dot,
                  index ===
                    activeIndex &&
                    styles.activeDot,
                ]}
              />
            ),
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },

  card: {
    height: 286,
    borderRadius:
      CARD_BORDER_RADIUS,
    overflow: 'hidden',
    marginRight:
      appTheme.spacing.md,
    backgroundColor: '#0D6464',
    position: 'relative',
  },

  backgroundMedia: {
    ...StyleSheet.absoluteFill,
  },

  gradientOverlay: {
    ...StyleSheet.absoluteFill,
  },

  contentArea: {
    flex: 1,
    paddingHorizontal:
      appTheme.spacing.lg,
    paddingBottom:
      appTheme.spacing.lg,
    justifyContent: 'flex-end',
  },

  subTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '400',
    opacity: 0.95,
    marginBottom: 3,
  },

  mainTitle: {
    color: '#FFFFFF',
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '800',
    maxWidth: '88%',
    marginBottom: 5,
  },

  iconRow: {
    marginTop:
      appTheme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap:
      appTheme.spacing.xs,
    maxWidth: '94%',
  },

  iconRowSecondary: {
    marginTop:
      appTheme.spacing.xxs,
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap:
      appTheme.spacing.xs,
    maxWidth: '94%',
  },

  iconRowText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },

  buttonStack: {
    marginTop:
      appTheme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap:
      appTheme.spacing.xs,
    maxWidth: '100%',
  },

  primaryButton: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    paddingHorizontal:
      appTheme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  singlePrimaryButton: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    paddingHorizontal:
      appTheme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonText: {
    color: '#1F7F7F',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textAlign: 'center',
  },

  secondaryButton: {
    flex: 1.15,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor:
      'rgba(255, 255, 255, 0.08)',
    paddingVertical: 9,
    paddingHorizontal:
      appTheme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap:
      appTheme.spacing.xs,
  },

  singleSecondaryButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor:
      'rgba(255, 255, 255, 0.08)',
    paddingVertical: 9,
    paddingHorizontal:
      appTheme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap:
      appTheme.spacing.xs,
  },

  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  dotsRow: {
    marginTop:
      appTheme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    columnGap:
      appTheme.spacing.xs,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B8C2C2',
  },

  activeDot: {
    width: 20,
    backgroundColor:
      appTheme.colors.primaryAccent,
  },
});