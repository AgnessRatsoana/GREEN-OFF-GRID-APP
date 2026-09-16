import React from 'react';

import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { WebView } from 'react-native-webview';

interface AddressMapPreviewProps {
  query: string;
  style?: StyleProp<ViewStyle>;
}

export function AddressMapPreview({
  query,
  style,
}: AddressMapPreviewProps) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return (
      <View style={[styles.frame, style]}>
        <View style={styles.centerContent}>
          <Text style={styles.statusText}>
            Enter an address to view the location.
          </Text>
        </View>
      </View>
    );
  }

  const encodedQuery =
    encodeURIComponent(trimmedQuery);

  const googleMapsUrl =
    `https://www.google.com/maps?q=${encodedQuery}&output=embed`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <style>
          html,
          body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #eef6f6;
          }

          iframe {
            width: 100%;
            height: 100%;
            border: 0;
            display: block;
          }
        </style>
      </head>

      <body>
        <iframe
          src="${googleMapsUrl}"
          loading="lazy"
          allowfullscreen
          referrerpolicy="no-referrer-when-downgrade">
        </iframe>
      </body>
    </html>
  `;

  return (
    <View style={[styles.frame, style]}>
      <WebView
        source={{ html }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        allowsFullscreenVideo
        setSupportMultipleWindows={false}
        style={styles.webView}
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

  webView: {
    flex: 1,
    backgroundColor: '#eef6f6',
  },

  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  statusText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#5f6b6b',
  },
});