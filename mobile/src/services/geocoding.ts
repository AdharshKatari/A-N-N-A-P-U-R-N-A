/**
 * Nominatim Geocoding Service
 * Uses OpenStreetMap Nominatim API for address search and reverse geocoding.
 * API: https://nominatim.openstreetmap.org
 */

export interface GeocodingResult {
  id: string;
  displayName: string;
  latitude: number;
  longitude: number;
  type: string;
  importance: number;
  address?: {
    name?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

export interface ReverseGeocodingResult {
  displayName: string;
  address: GeocodingResult['address'];
}

/**
 * Search for a single address/place by query string and return the best match
 * @param query - Search query (e.g., "Mandi, Mumbai, India")
 * @returns Best geocoding result or null
 */
export async function geocodeAddress(query: string): Promise<GeocodingResult | null> {
  const results = await searchAddresses(query, 1);
  return results.length > 0 ? results[0] : null;
}

/**
 * Search for addresses/places by query string
 * @param query - Search query (e.g., "Mumbai, India" or "farm near Nashik")
 * @param limit - Maximum number of results (default: 5)
 * @param viewbox - Optional bounding box [west, south, east, north] to bias results
 * @returns Array of geocoding results
 */
export async function searchAddresses(
  query: string,
  limit: number = 5,
  viewbox?: [number, number, number, number],
): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 2) return [];

  const params = new URLSearchParams({
    q: query.trim(),
    format: 'json',
    limit: String(limit),
    addressdetails: '1',
    extratags: '0',
    namedetails: '0',
  });

  // Bias results toward India if no viewbox specified
  if (viewbox) {
    params.set('viewbox', viewbox.join(','));
    params.set('bounded', '0');
  } else {
    // Default viewbox: India bounding box
    params.set('viewbox', '68.0,6.0,97.5,37.0');
    params.set('bounded', '0');
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          'Accept': 'application/json',
          // Nominatim requires a valid User-Agent
          'User-Agent': 'AnnapurnaFarmApp/1.0 (https://github.com/annapurna)',
        },
      },
    );

    if (!response.ok) {
      console.warn('Nominatim search failed:', response.status);
      return [];
    }

    const data = await response.json();

    return data.map((item: any) => ({
      id: item.place_id?.toString() || item.osm_id?.toString() || '',
      displayName: item.display_name || '',
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      type: item.type || item.class || 'place',
      importance: item.importance || 0,
      address: item.address,
    }));
  } catch (error) {
    console.warn('Geocoding search error:', error);
    return [];
  }
}

/**
 * Reverse geocode: get address from coordinates
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Reverse geocoding result with address details
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodingResult | null> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: 'json',
    addressdetails: '1',
    zoom: '18',
  });

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AnnapurnaFarmApp/1.0 (https://github.com/annapurna)',
        },
      },
    );

    if (!response.ok) {
      console.warn('Nominatim reverse geocode failed:', response.status);
      return null;
    }

    const data = await response.json();

    return {
      displayName: data.display_name || '',
      address: data.address,
    };
  } catch (error) {
    console.warn('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Format a short address from a geocoding result
 * Shows the most relevant parts: name, city, state
 */
export function formatShortAddress(result: GeocodingResult): string {
  const addr = result.address;
  if (!addr) return result.displayName.split(',').slice(0, 3).join(',');

  const parts: string[] = [];
  if (addr.name) parts.push(addr.name);
  else if (addr.road) parts.push(addr.road);

  const city = addr.city || addr.town || addr.village || addr.suburb;
  if (city) parts.push(city);

  if (addr.state) parts.push(addr.state);

  return parts.length > 0 ? parts.join(', ') : result.displayName.split(',').slice(0, 3).join(',');
}
