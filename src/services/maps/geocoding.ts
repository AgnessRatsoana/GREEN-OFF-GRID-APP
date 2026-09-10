export interface Coordinates {
  latitude: number;
  longitude: number;
  displayName: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export async function geocodeAddress(
  address: string,
): Promise<Coordinates | null> {
  const trimmedAddress = address.trim();

  if (!trimmedAddress) {
    return null;
  }

  const params = new URLSearchParams({
    q: trimmedAddress,
    format: 'jsonv2',
    limit: '1',
    countrycodes: 'za',
  });

  const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'GreenOffGridMobileApp/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Geocoding failed with status ${response.status}`);
  }

  const results = (await response.json()) as NominatimResult[];

  if (!results.length) {
    return null;
  }

  const result = results[0];

  return {
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    displayName: result.display_name,
  };
}