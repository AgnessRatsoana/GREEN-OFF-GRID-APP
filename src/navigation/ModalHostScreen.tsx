import { StyleSheet, Text, View } from 'react-native';

import { appTheme } from '../theme';
import { useAppTheme } from '../hooks/useAppTheme';

export function ModalHostScreen() {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Modal Route Placeholder</Text>
      <Text style={[styles.caption, { color: theme.colors.textSecondary }]}>Ready for future modal screens.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: appTheme.spacing.lg,
    backgroundColor: appTheme.colors.background,
  },
  title: {
    color: appTheme.colors.textPrimary,
    ...appTheme.typography.heading,
  },
  caption: {
    marginTop: appTheme.spacing.xs,
    color: appTheme.colors.textSecondary,
    ...appTheme.typography.caption,
  },
});
