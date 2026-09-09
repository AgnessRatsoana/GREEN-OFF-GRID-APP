import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { fetchCarouselItems, subscribeToCarouselItems, type CarouselItem } from '../../services/marketing/carousel';
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
}

const CARD_HORIZONTAL_PADDING = appTheme.spacing.md;
const CARD_BORDER_RADIUS = 24;
const AUTO_ROTATE_INTERVAL_MS = 5000;

const fallbackSlides: FallbackSlide[] = [
  { id: 'slide-1', imageSource: require('../../assets/images/franchise-outlet-4.jpeg'), subtitle: 'Got a FRANCHISE ?', mainTitle: "We've got your back", pointOne: 'Get a franchise of your desire and become one of us', pointTwo: 'With you every step of the franchise journey', primaryButtonText: 'Full-time service', secondaryButtonText: 'Schedule consultation' },
  { id: 'slide-2', imageSource: require('../../assets/images/panellCorousel.jpg'), subtitle: 'Accessories Spotlight', mainTitle: 'Power every install with quality gear', pointOne: 'Charge controllers, breakers and cables ready for your next job', pointTwo: 'Stock trusted components for reliable off-grid performance', primaryButtonText: 'Shop accessories', secondaryButtonText: 'View top sellers' },
  { id: 'slide-3', imageSource: require('../../assets/images/sollarCorousel.jpg'), subtitle: 'Accessory Deals', mainTitle: 'From chargers to clamps, build smarter', pointOne: 'Save on daily essentials without compromising performance', pointTwo: 'Everything you need for clean, tidy and safe installations', primaryButtonText: 'Browse new arrivals', secondaryButtonText: 'Compare accessories' },
];

function RemoteMedia({ item }: { item: CarouselItem }) {
  const player = useVideoPlayer(item.type === 'video' ? item.uri : '', (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
    videoPlayer.play();
  });

  if (item.type === 'video') {
    return <VideoView player={player} style={styles.backgroundImage} contentFit="cover" nativeControls={false} />;
  }

  return <Image source={{ uri: item.uri }} style={styles.backgroundImage} contentFit="cover" />;
}

export function FranchiseCarousel() {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [remoteSlides, setRemoteSlides] = useState<CarouselItem[]>([]);
  const { width } = useWindowDimensions();
  const cardWidth = useMemo(() => width - CARD_HORIZONTAL_PADDING * 2, [width]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const slides = await fetchCarouselItems();
        if (mounted) {
          setRemoteSlides(slides);
          setActiveIndex(0);
        }
      } catch {
        // The local fallback keeps the dashboard usable before the SQL migration is run.
      }
    };
    load();
    const unsubscribe = subscribeToCarouselItems(load);
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const slides = remoteSlides.length > 0 ? remoteSlides : fallbackSlides;

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const intervalId = setInterval(() => {
      setActiveIndex((previousIndex) => {
        const nextIndex = (previousIndex + 1) % slides.length;
        scrollRef.current?.scrollTo({ x: nextIndex * cardWidth, animated: true });
        return nextIndex;
      });
    }, AUTO_ROTATE_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [cardWidth, slides.length]);

  const goToSlide = (index: number) => {
    setActiveIndex(index);
    scrollRef.current?.scrollTo({ x: index * cardWidth, animated: true });
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / cardWidth))}
      >
        {slides.map((slide) => {
          const remoteSlide = remoteSlides.length > 0 ? slide as CarouselItem : null;
          const content = remoteSlide ?? slide as FallbackSlide;
          return (
            <View key={content.id} style={[styles.card, { width: cardWidth }]}>
              {remoteSlide ? <RemoteMedia item={remoteSlide} /> : <Image source={(content as FallbackSlide).imageSource} style={styles.backgroundImage} contentFit="cover" />}
              <LinearGradient colors={['#24b8b8A6', '#24b8b87A', '#24b8b83D', '#24b8b800']} locations={[0, 0.32, 0.56, 0.78]} start={{ x: 0, y: 0.22 }} end={{ x: 1, y: 0.04 }} style={styles.gradientOverlay} />
              <View style={styles.contentArea}>
                <Text style={styles.subTitle}>{content.subtitle}</Text>
                <Text style={styles.mainTitle}>{content.mainTitle}</Text>
                <View style={styles.iconRow}><Ionicons name="flash" size={18} color="#FFFFFF" /><Text style={styles.iconRowText}>{content.pointOne}</Text></View>
                <View style={styles.iconRowSecondary}><Ionicons name="flash" size={18} color="#FFFFFF" /><Text style={styles.iconRowText}>{content.pointTwo}</Text></View>
                <View style={styles.buttonStack}>
                  <Pressable style={styles.primaryButton}><Text style={styles.primaryButtonText}>{content.primaryButtonText}</Text></Pressable>
                  <Pressable style={styles.secondaryButton}><Ionicons name="calendar-outline" size={16} color="#FFFFFF" /><Text style={styles.secondaryButtonText}>{content.secondaryButtonText}</Text></Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.dotsRow}>{slides.map((slide, index) => <Pressable key={slide.id} onPress={() => goToSlide(index)} style={[styles.dot, index === activeIndex && styles.activeDot]} />)}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  card: { height: 286, borderRadius: CARD_BORDER_RADIUS, overflow: 'hidden', marginRight: appTheme.spacing.md },
  backgroundImage: { ...StyleSheet.absoluteFillObject },
  gradientOverlay: { ...StyleSheet.absoluteFillObject },
  contentArea: { flex: 1, paddingHorizontal: appTheme.spacing.lg, paddingVertical: appTheme.spacing.md, justifyContent: 'flex-start' },
  subTitle: { color: '#FFFFFF', fontSize: 24, lineHeight: 28, fontWeight: '400', opacity: 0.95 },
  mainTitle: { marginTop: appTheme.spacing.xs, color: '#FFFFFF', fontSize: 30, lineHeight: 34, fontWeight: '800', maxWidth: '82%' },
  iconRow: { marginTop: appTheme.spacing.sm, flexDirection: 'row', alignItems: 'center', columnGap: appTheme.spacing.xs, maxWidth: '90%' },
  iconRowSecondary: { marginTop: appTheme.spacing.xxs, flexDirection: 'row', alignItems: 'center', columnGap: appTheme.spacing.xs, maxWidth: '90%' },
  iconRowText: { flex: 1, color: '#FFFFFF', fontSize: 12, lineHeight: 17, fontWeight: '500' },
  buttonStack: { marginTop: appTheme.spacing.sm, flexDirection: 'row', columnGap: appTheme.spacing.xs, maxWidth: '96%' },
  primaryButton: { flex: 1, borderRadius: 999, backgroundColor: '#FFFFFF', paddingVertical: 9, paddingHorizontal: appTheme.spacing.sm, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#1F7F7F', fontSize: 12, lineHeight: 16, fontWeight: '700' },
  secondaryButton: { flex: 1.15, borderRadius: 999, borderWidth: 1, borderColor: '#FFFFFF', backgroundColor: 'rgba(255, 255, 255, 0.08)', paddingVertical: 9, paddingHorizontal: appTheme.spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', columnGap: appTheme.spacing.xs },
  secondaryButtonText: { color: '#FFFFFF', fontSize: 12, lineHeight: 16, fontWeight: '600' },
  dotsRow: { marginTop: appTheme.spacing.sm, flexDirection: 'row', justifyContent: 'center', columnGap: appTheme.spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#B8C2C2' },
  activeDot: { width: 20, backgroundColor: appTheme.colors.primaryAccent },
});