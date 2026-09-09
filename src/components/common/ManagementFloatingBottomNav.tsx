import { Ionicons } from '@expo/vector-icons';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import type { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';

type ManagementFloatingBottomNavProps = {
  currentRouteName?: string;
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>;
  role: 'admin' | 'marketing';
};

type ManagementDestination = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: keyof RootStackParamList;
};

const marketingDestinations: ManagementDestination[] = [
  { label: 'Overview', icon: 'grid-outline', route: ROUTES.MARKETING_DASHBOARD },
  { label: 'Catalogue', icon: 'cube-outline', route: ROUTES.MARKETING_PRODUCTS },
  { label: 'Chat', icon: 'chatbubbles-outline', route: ROUTES.MARKETING_ENQUIRIES },
  { label: 'Applications', icon: 'document-text-outline', route: ROUTES.MARKETING_APPLICATIONS },
];

const adminDestinations: ManagementDestination[] = [
  { label: 'Overview', icon: 'grid-outline', route: ROUTES.ADMIN_DASHBOARD },
  { label: 'Team', icon: 'people-outline', route: ROUTES.ADMIN_DASHBOARD },
  { label: 'Activity', icon: 'time-outline', route: ROUTES.ADMIN_DASHBOARD },
  { label: 'Marketing', icon: 'briefcase-outline', route: ROUTES.MARKETING_DASHBOARD },
];

export function ManagementFloatingBottomNav({
  currentRouteName,
  navigationRef,
  role,
}: ManagementFloatingBottomNavProps) {
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const destinations = role === 'admin' ? adminDestinations : marketingDestinations;

  if (!isAuthenticated || !currentRouteName) {
    return null;
  }

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + 10 }]}>
      <View style={styles.container}>
        {destinations.map((destination) => {
          const active = currentRouteName === destination.route;

          return (
            <Pressable
              key={`${role}-${destination.label}`}
              accessibilityRole="button"
              accessibilityLabel={destination.label}
              style={[styles.item, active && styles.activeItem]}
              onPress={() => {
                if (navigationRef.isReady()) {
                  navigationRef.navigate(destination.route as never);
                }
              }}
            >
              <Ionicons
                name={destination.icon}
                size={19}
                color={active ? '#FFFFFF' : '#8FB9B8'}
              />
              <Text style={[styles.label, active && styles.activeLabel]}>
                {destination.label}
              </Text>
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
    left: 10,
    right: 10,
    alignItems: 'center',
    zIndex: 45,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 7,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDEAEA',
    elevation: 8,
  },
  item: {
    minWidth: 72,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    paddingHorizontal: 8,
    gap: 2,
  },
  activeItem: {
    backgroundColor: '#24B8B8',
  },
  label: {
    color: '#557070',
    fontSize: 10,
    fontWeight: '700',
  },
  activeLabel: {
    color: '#FFFFFF',
  },
});