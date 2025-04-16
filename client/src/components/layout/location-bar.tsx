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
      
      // Create a mapping of known locations in Singapore
      const knownLocations = [
        { lat: 1.3171, lng: 103.8354, postalCode: "049483", roadName: "Raffles Place" },
        { lat: 1.3050, lng: 103.8330, postalCode: "018989", roadName: "Marina Bay" },
        { lat: 1.2949, lng: 103.8587, postalCode: "437437", roadName: "East Coast Park" },
        { lat: 1.3273, lng: 103.7747, postalCode: "117439", roadName: "Holland Village" },
        { lat: 1.3065, lng: 103.7690, postalCode: "159957", roadName: "Clementi" },
        { lat: 1.3109, lng: 103.7961, postalCode: "138634", roadName: "Bukit Timah" },
        { lat: 1.4043, lng: 103.7930, postalCode: "730001", roadName: "Woodlands" },
        { lat: 1.3294, lng: 103.8021, postalCode: "258503", roadName: "Bukit Timah" },
        { lat: 1.3644, lng: 103.8368, postalCode: "556739", roadName: "Ang Mo Kio" },
        { lat: 1.3525, lng: 103.9447, postalCode: "518457", roadName: "Tampines" },
        { lat: 1.3764, lng: 103.9489, postalCode: "538788", roadName: "Pasir Ris" },
        { lat: 1.3099, lng: 103.7758, postalCode: "139944", roadName: "Clementi" },
        { lat: 1.3383, lng: 103.8486, postalCode: "238835", roadName: "Orchard Road" },
        { lat: 1.3204, lng: 103.8430, postalCode: "307683", roadName: "Novena" },
        { lat: 1.3122, lng: 103.8891, postalCode: "398742", roadName: "Katong" }
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
      
      console.log("Setting current location to:", closestLocation.roadName);
      
      // Pass this information up to parent component
      if (typeof window !== 'undefined') {
        // Let home page know about the postal code and road name
        window.dispatchEvent(new CustomEvent('postalCodeUpdated', { 
          detail: { postalCode: closestLocation.postalCode, roadName: closestLocation.roadName } 
        }));
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      
      // Default location on error
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('postalCodeUpdated', { 
          detail: { postalCode: "049483", roadName: "Singapore" } 
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