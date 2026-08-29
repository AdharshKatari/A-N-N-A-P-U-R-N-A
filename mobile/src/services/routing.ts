/**
 * OSRM Routing Service
 * Uses Open Source Routing Machine (OSRM) public API for route calculation.
 * API: https://router.project-osrm.org
 *
 * Decodes Google-encoded polyline format to [lat, lng] coordinate arrays.
 */

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  /** Array of [lat, lng] coordinates along the route */
  coordinates: RoutePoint[];
  /** Total distance in meters */
  distanceMeters: number;
  /** Total duration in seconds */
  durationSeconds: number;
  /** Human-readable distance (e.g., "8.2 km") */
  distanceText: string;
  /** Human-readable duration (e.g., "12 min") */
  durationText: string;
}

/**
 * Decode a Google-encoded polyline string to coordinate pairs.
 * @param encoded - The encoded polyline string
 * @param precision - Coordinate precision (5 for OSRM, 6 for Google)
 * @returns Array of [latitude, longitude] pairs
 */
function decodePolyline(encoded: string, precision: number = 5): [number, number][] {
  const factor = Math.pow(10, precision);
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    // Decode latitude
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    // Decode longitude
    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coordinates.push([lat / factor, lng / factor]);
  }

  return coordinates;
}

/**
 * Format distance in meters to a human-readable string
 */
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format duration in seconds to a human-readable string
 */
function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) {
    return `${mins} min`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

/**
 * Get a driving route between two points using OSRM
 * @param origin - Starting point {latitude, longitude}
 * @param destination - Ending point {latitude, longitude}
 * @returns Route result with decoded coordinates, distance, and duration
 */
export async function getDrivingRoute(
  origin: RoutePoint,
  destination: RoutePoint,
): Promise<RouteResult | null> {
  const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;

  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=polyline&steps=false`,
      {
        headers: {
          'User-Agent': 'AnnapurnaFarmApp/1.0 (https://github.com/annapurna)',
        },
      },
    );

    if (!response.ok) {
      console.warn('OSRM routing failed:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      console.warn('No route found');
      return null;
    }

    const route = data.routes[0];
    const decodedCoords = decodePolyline(route.geometry, 5);

    return {
      coordinates: decodedCoords.map(([lat, lng]) => ({ latitude: lat, longitude: lng })),
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      distanceText: formatDistance(route.distance),
      durationText: formatDuration(route.duration),
    };
  } catch (error) {
    console.warn('OSRM routing error:', error);
    return null;
  }
}

/**
 * Get a walking route between two points using OSRM
 * @param origin - Starting point {latitude, longitude}
 * @param destination - Ending point {latitude, longitude}
 * @returns Route result with decoded coordinates, distance, and duration
 */
export async function getWalkingRoute(
  origin: RoutePoint,
  destination: RoutePoint,
): Promise<RouteResult | null> {
  const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;

  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/foot/${coords}?overview=full&geometries=polyline&steps=false`,
      {
        headers: {
          'User-Agent': 'AnnapurnaFarmApp/1.0 (https://github.com/annapurna)',
        },
      },
    );

    if (!response.ok) {
      console.warn('OSRM walking route failed:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      console.warn('No walking route found');
      return null;
    }

    const route = data.routes[0];
    const decodedCoords = decodePolyline(route.geometry, 5);

    return {
      coordinates: decodedCoords.map(([lat, lng]) => ({ latitude: lat, longitude: lng })),
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      distanceText: formatDistance(route.distance),
      durationText: formatDuration(route.duration),
    };
  } catch (error) {
    console.warn('OSRM walking route error:', error);
    return null;
  }
}
