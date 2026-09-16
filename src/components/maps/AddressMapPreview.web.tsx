import React from 'react';

import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

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

  const googleMapsUrl =
    `https://www.google.com/maps?q=${encodeURIComponent(
      trimmedQuery,
    )}&output=embed`;

  return (
    <View style={[styles.frame, style]}>
      <View style={styles.mapContainer}>
        <iframe
          title={`Google Maps location: ${trimmedQuery}`}
          src={googleMapsUrl}
          style={styles.iframe}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </View>
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

  mapContainer: {
    flex: 1,
    overflow: 'hidden',
  },

  iframe: {
    width: '100%',
    height: '100%',
    border: '0',
  } as any,

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