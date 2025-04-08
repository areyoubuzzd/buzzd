/**
 * Calculate the distance between two geographic coordinates using the Haversine formula
 * @param lat1 Latitude of the first point
 * @param lon1 Longitude of the first point
 * @param lat2 Latitude of the second point
 * @param lon2 Longitude of the second point
 * @returns Distance in kilometers
 */
export function formatDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Earth's radius in kilometers
  const R = 6371;
  
  // Convert degrees to radians
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  
  return distance;
}

/**
 * Convert degrees to radians
 * @param deg Degrees
 * @returns Radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Format a distance to a human-readable string
 * @param distance Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistanceString(distance: number): string {
  if (distance < 1) {
    // If less than 1 km, show in meters
    return `${Math.round(distance * 1000)}m`;
  } else {
    // Otherwise show in kilometers with one decimal place
    return `${distance.toFixed(1)}km`;
  }
}

/**
 * Calculate approximate walking time based on distance
 * @param distance Distance in kilometers
 * @returns Walking time in minutes
 */
export function calculateWalkingTime(distance: number): number {
  // Average walking speed is about 5 km/h, which is about 12 minutes per kilometer
  return Math.round(distance * 12);
}
