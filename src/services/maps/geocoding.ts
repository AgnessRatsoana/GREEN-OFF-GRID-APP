import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
  displayName: string;
}

export async function geocodeAddress(
  address: string,
): Promise<Coordinates | null> {
  const trimmedAddress = address.trim();

  if (!trimmedAddress) {
    return null;
  }

  try {
    // Android requires foreground location permission
    // before geocoding can be used.
    if (process.env.EXPO_OS === 'android') {
      const permission =
        await Location.getForegroundPermissionsAsync();

      if (permission.status !== Location.PermissionStatus.GRANTED) {
        const requested =
          await Location.requestForegroundPermissionsAsync();

        if (requested.status !== Location.PermissionStatus.GRANTED) {
          throw new Error(
            'Location permission is required to find this address.',
          );
        }
      }
    }

    const results = await Location.geocodeAsync(trimmedAddress);

    if (!results.length) {
      return null;
    }

    const result = results[0];

    console.log('GEOCODE RESULT:', {
  latitude: result.latitude,
  longitude: result.longitude,
  address: trimmedAddress,
});

    return {
      latitude: result.latitude,
      longitude: result.longitude,
      displayName: trimmedAddress,
    };
  } catch (error) {
    console.error('Address geocoding failed:', error);
    throw error;
  }
}