import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { appTheme } from '../../theme';

/**
 * Extra bottom padding screens should use so content can scroll clear of the
 * floating nav. Roughly: 46px button + vertical padding + safe area + margin.
 */
export const FLOATING_NAV_CONTENT_INSET = 140;

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
  badgeCounts?: Partial<Record<NavKey, number>>;
}

export function FloatingBottomNav({ activeKey = 'home', onTabPress, badgeCounts }: FloatingBottomNavProps) {
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
              <View style={styles.iconWrap}>
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={appTheme.colors.background}
                />
                {(badgeCounts?.[item.key] ?? 0) > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {(badgeCounts?.[item.key] ?? 0) > 99 ? '99+' : badgeCounts?.[item.key]}
                    </Text>
                  </View>
                ) : null}
              </View>
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
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -12,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#e05252',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
