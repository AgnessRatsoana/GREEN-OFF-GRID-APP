import { StyleSheet, Text, View } from 'react-native';

import { appTheme } from '../theme';

export function ModalHostScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modal Route Placeholder</Text>
      <Text style={styles.caption}>Ready for future modal screens.</Text>
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
