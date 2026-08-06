import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppNavigation } from './src/navigation';
import { appTheme } from './src/theme';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="dark" />
      <AppNavigation />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
});
