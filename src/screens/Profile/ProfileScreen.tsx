import { StyleSheet, Text, View } from 'react-native';

import { appTheme } from '../../theme';
import type { AppTheme } from '../../theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { FLOATING_NAV_CONTENT_INSET } from '../../components/common/FloatingBottomNav';

export function ProfileScreen() {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Your account profile panel will be expanded next.</Text>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: appTheme.spacing.md,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: appTheme.spacing.sm,
    color: theme.colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
});
