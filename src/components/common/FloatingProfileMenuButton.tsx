import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { appTheme } from '../../theme';

interface FloatingProfileMenuButtonProps {
  onPress: () => void;
  profileImageUri?: ImageSourcePropType | string | null;
}

const ICON_SIZE = 22;
const BUBBLE_SIZE = 44;
const SWAP_DISTANCE = 48;

export function FloatingProfileMenuButton({
  onPress,
  profileImageUri,
}: FloatingProfileMenuButtonProps) {
  const swapProgress = useSharedValue(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const nextValue = swapProgress.value === 0 ? 1 : 0;
      swapProgress.value = withTiming(nextValue, {
        duration: 550,
        easing: Easing.inOut(Easing.cubic),
      });
    }, 4000);

    return () => {
      clearInterval(intervalId);
    };
  }, [swapProgress]);

  const profileAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(swapProgress.value, [0, 1], [0, SWAP_DISTANCE]),
        },
      ],
    };
  });

  const menuAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(swapProgress.value, [0, 1], [0, -SWAP_DISTANCE]),
        },
      ],
    };
  });

  return (
    <Pressable
      onPress={onPress}
      style={styles.container}
    >
      <View style={styles.track}>
        <Animated.View style={[styles.profileHolder, profileAnimatedStyle]}>
          <View style={styles.bubble}>
            {profileImageUri ? (
              <Image
                source={profileImageUri}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <Ionicons
                name="person-outline"
                size={ICON_SIZE}
                color={appTheme.colors.textPrimary}
              />
            )}
          </View>
        </Animated.View>

        <Animated.View style={[styles.menuHolder, menuAnimatedStyle]}>
          <View style={styles.menuBubble}>
            <Ionicons
              name="menu"
              size={ICON_SIZE}
              color="#0f5e57"
            />
          </View>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    marginTop: appTheme.spacing.sm,
    borderRadius: 999,
    backgroundColor: 'rgba(31, 156, 145, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(31, 156, 145, 0.28)',
    paddingHorizontal: 8,
    paddingVertical: 8,
    ...appTheme.shadows.card,
  },
  track: {
    width: BUBBLE_SIZE + SWAP_DISTANCE,
    height: BUBBLE_SIZE,
    position: 'relative',
  },
  profileHolder: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  menuHolder: {
    position: 'absolute',
    left: SWAP_DISTANCE,
    top: 0,
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appTheme.colors.background,
  },
  menuBubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(31, 156, 145, 0.34)',
  },
  avatarImage: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
  },
});
