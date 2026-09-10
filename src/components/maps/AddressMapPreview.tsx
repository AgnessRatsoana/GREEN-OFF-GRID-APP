import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import MapView, {
  Marker,
  PROVIDER_GOOGLE,
} from 'react-native-maps';

import {
  geocodeAddress,
  type Coordinates,
} from '../../services/maps/geocoding';

interface AddressMapPreviewProps {
  query: string;
  style?: StyleProp<ViewStyle>;
}

function buildWebEmbedUrl(query: string): string {
  return `https://maps.google.com/maps?output=embed&q=${encodeURIComponent(
    query,
  )}`;
}

export function AddressMapPreview({
  query,
  style,
}: AddressMapPreviewProps) {
  const [coordinates, setCoordinates] =
    useState<Coordinates | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    let cancelled = false;

    async function loadCoordinates() {
      const trimmedQuery = query.trim();

      if (!trimmedQuery) {
        setCoordinates(null);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await geocodeAddress(trimmedQuery);

        if (cancelled) {
          return;
        }

        if (!result) {
          setCoordinates(null);
          setError('We could not find this address.');
          return;
        }

        setCoordinates(result);
      } catch (geocodingError) {
        if (cancelled) {
          return;
        }

        console.error(
          'Address geocoding failed:',
          geocodingError,
        );

        setCoordinates(null);
        setError(
          'Unable to load the map for this address.',
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadCoordinates();

    return () => {
      cancelled = true;
    };
  }, [query]);

  /*
   * WEB
   *
   * Keep the existing Google Maps iframe because
   * your web version is already working.
   */
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.frame, style]}>
        {React.createElement('iframe', {
          key: query,
          src: buildWebEmbedUrl(query),
          style: {
            border: 0,
            width: '100%',
            height: '100%',
            borderRadius: 14,
            display: 'block',
          },
          allowFullScreen: true,
          referrerPolicy: 'no-referrer-when-downgrade',
          title: 'Location map',
        })}
      </View>
    );
  }

  /*
   * ANDROID + IOS
   *
   * Use the native react-native-maps component.
   */
  return (
    <View style={[styles.frame, style]}>
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="small" />

          <Text style={styles.statusText}>
            Loading location...
          </Text>
        </View>
      ) : coordinates ? (
        <MapView
  provider={PROVIDER_GOOGLE}
  style={styles.map}
  region={{
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  }}
  showsUserLocation={false}
  showsMyLocationButton={false}
  loadingEnabled
>
  <Marker
    coordinate={{
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    }}
    title="Selected location"
    description={coordinates.displayName}
  />
</MapView>
      ) : (
        <View style={styles.centerContent}>
          <Text style={styles.statusText}>
            {error ??
              'Enter an address to view the location.'}
          </Text>
        </View>
      )}
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

  map: {
    flex: 1,
  },

  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },

  statusText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#5f6b6b',
  },
});