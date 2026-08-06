import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { appTheme } from '../../theme';

interface SlideItem {
  id: string;
  imageSource: number;
}

const CARD_HORIZONTAL_PADDING = appTheme.spacing.md;
const CARD_BORDER_RADIUS = 24;
const AUTO_ROTATE_INTERVAL_MS = 5000;

const slides: SlideItem[] = [
  {
    id: 'slide-1',
    imageSource: require('../../assets/images/customer-with-solarPanel.jpeg'),
  },
  {
    id: 'slide-2',
    imageSource: require('../../assets/images/customer-with-solarPanel.jpeg'),
  },
];

export function FranchiseCarousel() {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { width } = useWindowDimensions();

  const cardWidth = useMemo(() => {
    return width - CARD_HORIZONTAL_PADDING * 2;
  }, [width]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveIndex((previousIndex) => {
        const nextIndex = (previousIndex + 1) % slides.length;

        scrollRef.current?.scrollTo({
          x: nextIndex * cardWidth,
          animated: true,
        });

        return nextIndex;
      });
    }, AUTO_ROTATE_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [cardWidth]);

  const goToSlide = (index: number) => {
    setActiveIndex(index);
    scrollRef.current?.scrollTo({
      x: index * cardWidth,
      animated: true,
    });
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const nextIndex = Math.round(
            event.nativeEvent.contentOffset.x / cardWidth,
          );
          setActiveIndex(nextIndex);
        }}
      >
        {slides.map((slide) => {
          return (
            <View
              key={slide.id}
              style={[
                styles.card,
                {
                  width: cardWidth,
                },
              ]}
            >
              <Image
                source={slide.imageSource}
                style={styles.backgroundImage}
                contentFit="cover"
              />

              <LinearGradient
                colors={['#24b8b8F0', '#24b8b8C8', '#24b8b869', '#24b8b800']}
                locations={[0, 0.36, 0.6, 0.76]}
                start={{ x: 0, y: 0.22 }}
                end={{ x: 1, y: 0.04 }}
                style={styles.gradientOverlay}
              />

              <View style={styles.contentArea}>
                <Text style={styles.subTitle}>Got a FRANCHISE ?</Text>
                <Text style={styles.mainTitle}>We've got your back</Text>

                <View style={styles.iconRow}>
                  <Ionicons
                    name="flash"
                    size={18}
                    color={appTheme.colors.background}
                  />
                  <Text style={styles.iconRowText}>
                    Get a franchise of your desire and become one of us
                  </Text>
                </View>

                <View style={styles.iconRowSecondary}>
                  <Ionicons
                    name="flash"
                    size={18}
                    color={appTheme.colors.background}
                  />
                  <Text style={styles.iconRowText}>
                    With you every step of the franchise journey
                  </Text>
                </View>

                <View style={styles.buttonStack}>
                  <Pressable style={styles.primaryButton}>
                    <Text style={styles.primaryButtonText}>Full-time service</Text>
                  </Pressable>

                  <Pressable style={styles.secondaryButton}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={appTheme.colors.background}
                    />
                    <Text style={styles.secondaryButtonText}>
                      Schedule consultation
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.dotsRow}>
        {slides.map((slide, index) => {
          const isActive = index === activeIndex;

          return (
            <Pressable
              key={slide.id}
              onPress={() => {
                goToSlide(index);
              }}
              style={[styles.dot, isActive ? styles.activeDot : undefined]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  card: {
    height: 286,
    borderRadius: CARD_BORDER_RADIUS,
    overflow: 'hidden',
    marginRight: appTheme.spacing.md,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: appTheme.spacing.lg,
    paddingVertical: appTheme.spacing.md,
    justifyContent: 'flex-start',
  },
  subTitle: {
    marginTop: 0,
    color: appTheme.colors.background,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '400',
    opacity: 0.95,
  },
  mainTitle: {
    marginTop: appTheme.spacing.xs,
    color: appTheme.colors.background,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    maxWidth: '82%',
  },
  iconRow: {
    marginTop: appTheme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: appTheme.spacing.xs,
    maxWidth: '90%',
  },
  iconRowSecondary: {
    marginTop: appTheme.spacing.xxs,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: appTheme.spacing.xs,
    maxWidth: '90%',
  },
  iconRowText: {
    flex: 1,
    color: appTheme.colors.background,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  buttonStack: {
    marginTop: appTheme.spacing.sm,
    flexDirection: 'row',
    columnGap: appTheme.spacing.xs,
    maxWidth: '96%',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: appTheme.colors.background,
    paddingVertical: 9,
    paddingHorizontal: appTheme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#1F7F7F',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1.15,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: appTheme.colors.background,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 9,
    paddingHorizontal: appTheme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: appTheme.spacing.xs,
  },
  secondaryButtonText: {
    color: appTheme.colors.background,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  dotsRow: {
    marginTop: appTheme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    columnGap: appTheme.spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B8C2C2',
  },
  activeDot: {
    width: 20,
    backgroundColor: appTheme.colors.primaryAccent,
  },
});
