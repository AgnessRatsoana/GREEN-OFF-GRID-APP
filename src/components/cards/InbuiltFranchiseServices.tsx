import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { appTheme } from '../../theme';

type IconName = keyof typeof Ionicons.glyphMap;

interface ServiceItem {
  label: string;
  icon: IconName;
}

const serviceItems: ServiceItem[] = [
  { label: 'Starter Kits', icon: 'cube-outline' },
  { label: 'Solar Lighting', icon: 'bulb-outline' },
  { label: 'Solar Products', icon: 'sunny-outline' },
  { label: 'Home Solutions', icon: 'home-outline' },
  { label: 'Power & Batteries', icon: 'battery-charging-outline' },
  { label: 'Solar Accessories', icon: 'git-network-outline' },
  { label: 'Tools & Installation', icon: 'construct-outline' },
  { label: 'Business Opportunities', icon: 'rocket-outline' },
];

export function InbuiltFranchiseServices() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inbuilt Franchise Services</Text>

      <View style={styles.grid}>
        {serviceItems.map((item) => {
          return (
            <View
              key={item.label}
              style={styles.gridItem}
            >
              <Ionicons
                name={item.icon}
                size={24}
                color="#24b8b8"
              />
              <Text style={styles.itemText}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: appTheme.spacing.xl,
  },
  title: {
    color: appTheme.colors.textPrimary,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
  },
  grid: {
    marginTop: appTheme.spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: appTheme.spacing.lg,
    paddingHorizontal: 2,
  },
  itemText: {
    marginTop: appTheme.spacing.xs,
    color: '#111111',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
