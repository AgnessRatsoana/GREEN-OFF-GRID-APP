import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../../navigation/types';
import { appTheme } from '../../theme';

export function MessagesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#24b8b8" />
        </Pressable>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.iconDecor}>
          <Ionicons name="chatbubble-ellipses-outline" size={22} color="#24b8b8" />
        </View>
      </View>

      <View style={styles.contentWrap}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Chatboard support can be plugged in right after profile flow.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: appTheme.spacing.md,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(36,184,184,0.18)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(36,184,184,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: appTheme.spacing.sm,
  },
  headerTitle: {
    flex: 1,
    color: '#1a3f3f',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  iconDecor: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(36,184,184,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrap: {
    flex: 1,
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
