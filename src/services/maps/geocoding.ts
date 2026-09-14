import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
  displayName: string;
}

const geocodeCache = new Map<string, Coordinates | null>();

let lastGeocodeRequestAt = 0;

const MIN_REQUEST_INTERVAL = 1500;

function normalizeAddress(address: string): string {
  return address.trim().replace(/\s+/g, ' ').toLowerCase();
}

export async function geocodeAddress(
  address: string,
): Promise<Coordinates | null> {
  const trimmedAddress = address.trim();

  if (!trimmedAddress) {
    return null;
  }

  const cacheKey = normalizeAddress(trimmedAddress);

  const cachedResult = geocodeCache.get(cacheKey);

  if (cachedResult !== undefined) {
    return cachedResult;
  }

  try {
    if (process.env.EXPO_OS === 'android') {
      const permission =
        await Location.getForegroundPermissionsAsync();

      if (
        permission.status !==
        Location.PermissionStatus.GRANTED
      ) {
        const requested =
          await Location.requestForegroundPermissionsAsync();

        if (
          requested.status !==
          Location.PermissionStatus.GRANTED
        ) {
          throw new Error(
            'Location permission is required to find this address.',
          );
        }
      }
    }

    const now = Date.now();
    const elapsed = now - lastGeocodeRequestAt;

    if (elapsed < MIN_REQUEST_INTERVAL) {
      await new Promise<void>((resolve) => {
        setTimeout(
          resolve,
          MIN_REQUEST_INTERVAL - elapsed,
        );
      });
    }

    lastGeocodeRequestAt = Date.now();

    const results =
      await Location.geocodeAsync(trimmedAddress);

    if (!results.length) {
      geocodeCache.set(cacheKey, null);
      return null;
    }

    const result = results[0];

    const coordinates: Coordinates = {
      latitude: result.latitude,
      longitude: result.longitude,
      displayName: trimmedAddress,
    };

    geocodeCache.set(cacheKey, coordinates);

    console.log('GEOCODE RESULT:', {
      address: trimmedAddress,
      latitude: result.latitude,
      longitude: result.longitude,
    });

    return coordinates;
  } catch (error) {
    console.error(
      'Address geocoding failed:',
      error,
    );

    throw error;
  }
}