/**
 * Location utilities for the Buzzd app
 * Handles location detection, distance calculations, and postal code geocoding
 */

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Calculate the Haversine distance between two points
 * @param lat1 Latitude of first point in decimal degrees
 * @param lon1 Longitude of first point in decimal degrees
 * @param lat2 Latitude of second point in decimal degrees
 * @param lon2 Longitude of second point in decimal degrees
 * @returns Distance in kilometers, rounded to 2 decimal places
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Convert latitude and longitude from degrees to radians
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = EARTH_RADIUS_KM * c; // Distance in km
  
  return parseFloat(distance.toFixed(2));
}

// Cache for storing postal code -> coordinates mapping
interface PostalCodeCache {
  [postalCode: string]: {
    lat: number;
    lng: number;
    timestamp: number;
  }
}

// Get current user location using browser's Geolocation API
export function getCurrentLocation(): Promise<{lat: number, lng: number}> {
  return new Promise((resolve, reject) => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }
    
    // Try to get location from cache first (localStorage)
    const cachedLocation = localStorage.getItem('userLocation');
    if (cachedLocation) {
      try {
        const location = JSON.parse(cachedLocation);
        // Check if the cache is recent (less than 30 minutes old)
        const cacheTime = localStorage.getItem('userLocationTimestamp');
        if (cacheTime && (Date.now() - parseInt(cacheTime)) < 30 * 60 * 1000) {
          console.log('Using cached location:', location);
          resolve(location);
          return;
        }
      } catch (e) {
        console.error('Error parsing cached location:', e);
        // Continue to get fresh location if cache is invalid
      }
    }
    
    // Get fresh location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        // Cache the location
        localStorage.setItem('userLocation', JSON.stringify(location));
        localStorage.setItem('userLocationTimestamp', Date.now().toString());
        
        resolve(location);
      },
      (error) => {
        console.error("Error getting location:", error.message);
        // Fall back to a default location for Singapore (use Marina Bay as center point)
        const defaultLocation = { lat: 1.2804, lng: 103.8509 };
        console.log('Using default location (Marina Bay):', defaultLocation);
        
        reject(error);
      },
      {
        enableHighAccuracy: true,  // Get the best accuracy possible
        timeout: 10000,           // Wait up to 10 seconds
        maximumAge: 5 * 60 * 1000  // Accept a cached position if it's no older than 5 minutes
      }
    );
  });
}

// Get coordinates from postal code (with caching)
export async function getCoordinatesFromPostalCode(postalCode: string): Promise<{lat: number, lng: number}> {
  // Check localStorage cache first
  const cacheString = localStorage.getItem('postalCodeCache');
  let cache: PostalCodeCache = {};
  
  if (cacheString) {
    try {
      cache = JSON.parse(cacheString);
      
      // If we have a cached result that's less than 30 days old, use it
      if (cache[postalCode] && 
          (Date.now() - cache[postalCode].timestamp) < 30 * 24 * 60 * 60 * 1000) {
        console.log('Using cached coordinates for postal code:', postalCode);
        return {
          lat: cache[postalCode].lat,
          lng: cache[postalCode].lng
        };
      }
    } catch (e) {
      console.error('Error parsing postal code cache:', e);
      // Continue to make API request if cache is invalid
    }
  }
  
  try {
    // Make API request to our backend (which will use Google's Geocoding API)
    const response = await fetch(`/api/geocode?postalCode=${postalCode}`);
    
    if (!response.ok) {
      throw new Error(`Geocoding request failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Update cache
    cache[postalCode] = {
      lat: data.lat,
      lng: data.lng,
      timestamp: Date.now()
    };
    
    localStorage.setItem('postalCodeCache', JSON.stringify(cache));
    
    return {
      lat: data.lat,
      lng: data.lng
    };
  } catch (error) {
    console.error('Error geocoding postal code:', error);
    throw error;
  }
}

// Function to test the distance calculation
export function testDistanceCalculation() {
  // Distance between Marina Bay Sands and Changi Airport
  const mbs = { lat: 1.2834, lng: 103.8607 };
  const changi = { lat: 1.3644, lng: 103.9915 };
  
  const distance = calculateDistance(mbs.lat, mbs.lng, changi.lat, changi.lng);
  console.log(`Distance between Marina Bay Sands and Changi Airport: ${distance} km`);
  
  // Distance should be approximately 16-17 km
  return distance;
}

// Create a bounding box for efficient pre-filtering
export function createBoundingBox(lat: number, lng: number, radiusKm: number) {
  // Convert radius from km to degrees (approximate)
  const latDelta = radiusKm / 111.0; // 1 degree latitude is roughly 111km
  const lngDelta = radiusKm / (111.0 * Math.cos(lat * Math.PI / 180.0)); // Adjust for longitude
  
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta
  };
}