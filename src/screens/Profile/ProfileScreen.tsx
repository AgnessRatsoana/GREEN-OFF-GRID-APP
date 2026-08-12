import { StyleSheet, Text, View } from 'react-native';

import { appTheme } from '../../theme';

export function ProfileScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Your account profile panel will be expanded next.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: appTheme.spacing.md,
  },
  title: {
    color: '#123f3f',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: appTheme.spacing.sm,
    color: '#5d7676',
    fontSize: 15,
    textAlign: 'center',
  },
});
