import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import MapView, {
  Marker,
} from 'react-native-maps';

import {
  geocodeAddress,
  type Coordinates,
} from '../../services/maps/geocoding';

interface AddressMapPreviewProps {
  query: string;
  style?: StyleProp<ViewStyle>;
}

export function AddressMapPreview({
  query,
  style,
}: AddressMapPreviewProps) {
  const [coordinates, setCoordinates] =
    useState<Coordinates | null>(null);

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setCoordinates(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const timeout = setTimeout(() => {
      async function loadCoordinates() {
        setIsLoading(true);
        setError(null);

        try {
          const result =
            await geocodeAddress(trimmedQuery);

          if (cancelled) {
            return;
          }

          if (!result) {
            setCoordinates(null);
            setError(
              'We could not find this address.',
            );
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
    }, 1200);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  return (
    <View style={[styles.frame, style]}>
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="small" />

          <Text style={styles.statusText}>
            Loading Apple Maps...
          </Text>
        </View>
      ) : coordinates ? (
        <MapView
          style={styles.map}
          initialRegion={{
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
            title="Delivery location"
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