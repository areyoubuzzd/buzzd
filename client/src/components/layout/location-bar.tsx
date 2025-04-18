import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FiFilter } from "react-icons/fi";

interface LocationBarProps {
  onLocationChange: (location: { lat: number; lng: number }) => void;
  onOpenFilters: () => void;
}

export default function LocationBar({ onLocationChange, onOpenFilters }: LocationBarProps) {
  useEffect(() => {
    // Try to get user's location on component mount
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    console.log("Attempting to get user location...");
    if (navigator.geolocation) {
      // Request high-accuracy position
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log("Successfully got user location:", latitude, longitude);
          // Reverse geocode to get location name
          reverseGeocode(latitude, longitude);
          // Update parent component with coordinates
          onLocationChange({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error("Error getting location:", error.code, error.message);
          
          // Default to Singapore coordinates
          onLocationChange({ lat: 1.3521, lng: 103.8198 });
          
          // Simulate a default location name
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('postalCodeUpdated', { 
              detail: { postalCode: "049483", roadName: "Singapore" } 
            }));
          }
        },
        options
      );
    } else {
      console.warn("Geolocation API not supported in this browser");
      // Default to Singapore coordinates
      onLocationChange({ lat: 1.3521, lng: 103.8198 });
      
      // Simulate a default location name
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('postalCodeUpdated', { 
          detail: { postalCode: "049483", roadName: "Singapore" } 
        }));
      }
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      // This is a placeholder for actual reverse geocoding
      // In a real app, we'd use Google Maps Geocoding API 
      // For now, use our hardcoded location database based on coordinates
      
      // Create a mapping of known locations in Singapore with more accurate coordinates
      const knownLocations = [
        { lat: 1.2842, lng: 103.8522, postalCode: "049483", roadName: "Raffles Place" },
        { lat: 1.2834, lng: 103.8607, postalCode: "018989", roadName: "Marina Bay" },
        { lat: 1.2949, lng: 103.8587, postalCode: "437437", roadName: "East Coast Park" },
        { lat: 1.3118, lng: 103.7965, postalCode: "117439", roadName: "Holland Village" },
        { lat: 1.3162, lng: 103.7649, postalCode: "159957", roadName: "Clementi" },
        { lat: 1.3109, lng: 103.7961, postalCode: "138634", roadName: "Bukit Timah" },
        { lat: 1.4367, lng: 103.7867, postalCode: "730001", roadName: "Woodlands" },
        { lat: 1.3691, lng: 103.8454, postalCode: "556739", roadName: "Ang Mo Kio" },
        { lat: 1.3547, lng: 103.9464, postalCode: "518457", roadName: "Tampines" },
        { lat: 1.3721, lng: 103.9495, postalCode: "538788", roadName: "Pasir Ris" },
        { lat: 1.3041, lng: 103.8320, postalCode: "238835", roadName: "Orchard Road" },
        { lat: 1.3204, lng: 103.8430, postalCode: "307683", roadName: "Novena" },
        { lat: 1.3042, lng: 103.8997, postalCode: "398742", roadName: "Katong" },
        { lat: 1.2815, lng: 103.8451, postalCode: "058416", roadName: "Chinatown" },
        { lat: 1.3009, lng: 103.8560, postalCode: "188024", roadName: "Bugis" },
        { lat: 1.2764, lng: 103.8454, postalCode: "078881", roadName: "Tanjong Pagar" },
        { lat: 1.2906, lng: 103.8458, postalCode: "179024", roadName: "Clarke Quay" },
        { lat: 1.2918, lng: 103.8384, postalCode: "238880", roadName: "Robertson Quay" }
      ];
      
      // Find the closest location from our known locations
      let closestLocation = knownLocations[0];
      let minDistance = Number.MAX_VALUE;
      
      knownLocations.forEach(location => {
        const distance = calculateDistance(latitude, longitude, location.lat, location.lng);
        if (distance < minDistance) {
          minDistance = distance;
          closestLocation = location;
        }
      });
      
      // Check if the closest location is actually close enough
      // If it's more than 5km away, we might be in an unrecognized area
      let locationName = closestLocation.roadName;
      
      if (minDistance > 5) {
        // Too far from any known location
        locationName = "Your Location";
        console.log("Location is outside of known areas. Distance to nearest landmark:", minDistance);
      } else {
        console.log(`Setting current location to: ${locationName} (${minDistance.toFixed(2)}km away)`);
      }
      
      // Pass this information up to parent component
      if (typeof window !== 'undefined') {
        // Let home page know about the postal code and road name
        window.dispatchEvent(new CustomEvent('postalCodeUpdated', { 
          detail: { 
            postalCode: closestLocation.postalCode, 
            roadName: locationName,
            detectedLocation: true // Flag indicating we detected this automatically
          } 
        }));
        
        // Cache the user's location for future reference
        try {
          localStorage.setItem('lastKnownLocation', JSON.stringify({
            lat: latitude,
            lng: longitude,
            name: locationName,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn("Could not cache location in localStorage", e);
        }
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      
      // Default location on error
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('postalCodeUpdated', { 
          detail: { postalCode: "018989", roadName: "Your Location" } 
        }));
      }
    }
  };
  
  // Helper function to calculate distance between two geographic points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  };
  
  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };

  // We're not rendering any visible component here since we moved the functionality
  // to the location section and filter button
  return null;
}