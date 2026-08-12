import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { appTheme } from '../../theme';

type NavKey = 'home' | 'saved' | 'notifications' | 'packages';

const navItems: Array<{ key: NavKey; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'home', icon: 'home-outline' },
  { key: 'saved', icon: 'heart-outline' },
  { key: 'notifications', icon: 'notifications-outline' },
  { key: 'packages', icon: 'storefront-outline' },
];

interface FloatingBottomNavProps {
  activeKey?: NavKey;
  onTabPress?: (key: NavKey) => void;
}

export function FloatingBottomNav({ activeKey = 'home', onTabPress }: FloatingBottomNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrapper,
        {
          bottom: insets.bottom + appTheme.spacing.sm,
        },
      ]}
    >
      <View style={styles.container}>
        {navItems.map((item) => {
          const isActive = item.key === activeKey;

          return (
            <Pressable
              key={item.key}
              style={[
                styles.iconButton,
                isActive ? styles.activeIconButton : styles.inactiveIconButton,
              ]}
              onPress={() => onTabPress?.(item.key)}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={appTheme.colors.background}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: appTheme.spacing.sm,
    borderRadius: 999,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
    backgroundColor: 'rgba(36, 184, 184, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(36, 184, 184, 0.28)',
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconButton: {
    backgroundColor: '#24b8b8',
  },
  inactiveIconButton: {
    backgroundColor: '#8fd7d7',
  },
});
