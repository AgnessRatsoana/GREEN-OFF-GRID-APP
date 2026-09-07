import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { appTheme } from '../../theme';
import type { AppTheme } from '../../theme';
import { useAppTheme } from '../../hooks/useAppTheme';

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
  const theme = useAppTheme();
  const styles = createStyles(theme);

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
                color={theme.colors.primaryAccent}
              />
              <Text style={styles.itemText}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    marginTop: appTheme.spacing.xl,
  },
  title: {
    color: theme.colors.textPrimary,
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
    color: theme.colors.textPrimary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
