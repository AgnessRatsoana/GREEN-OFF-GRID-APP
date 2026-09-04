import React from 'react';

import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

interface AddressMapPreviewProps {
  query: string;
  style?: StyleProp<ViewStyle>;
}

function buildEmbedUrl(query: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

/**
 * Embedded Google Map for a typed address. Uses the keyless Google Maps embed
 * URL: an iframe on web and a WebView on native.
 */
export function AddressMapPreview({ query, style }: AddressMapPreviewProps) {
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.frame, style]}>
        {React.createElement('iframe', {
          src: buildEmbedUrl(query),
          style: {
            border: 0,
            width: '100%',
            height: '100%',
            borderRadius: 14,
          },
          loading: 'lazy',
          referrerPolicy: 'no-referrer-when-downgrade',
          title: 'Delivery address map',
        })}
      </View>
    );
  }

  const { WebView } = require('react-native-webview') as typeof import('react-native-webview');

  return (
    <View style={[styles.frame, style]}>
      <WebView
        source={{ uri: buildEmbedUrl(query) }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.25)',
    backgroundColor: '#eef6f6',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
