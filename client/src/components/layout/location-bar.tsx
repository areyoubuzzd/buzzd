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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Reverse geocode to get location name
          reverseGeocode(latitude, longitude);
          // Update parent component with coordinates
          onLocationChange({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error("Error getting location:", error);
          
          // Default to Singapore coordinates
          onLocationChange({ lat: 1.3521, lng: 103.8198 });
          
          // Simulate a default location name
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('postalCodeUpdated', { 
              detail: { postalCode: "049483", roadName: "Singapore" } 
            }));
          }
        }
      );
    } else {
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
      // In a real app, you'd use Google Maps Geocoding API or similar
      
      // Use different sample locations based on coordinates to simulate real geocoding
      let postalCode, roadName;
      
      // Use slight variations to determine different locations
      if (latitude > 1.36) {
        postalCode = "238835";
        roadName = "Orchard Road";
      } else if (latitude < 1.34) {
        postalCode = "049483";
        roadName = "Raffles Place";
      } else if (longitude > 103.85) {
        postalCode = "018989";
        roadName = "Marina Bay";
      } else if (longitude < 103.80) {
        postalCode = "117439";
        roadName = "Holland Village";
      } else {
        postalCode = "138634";
        roadName = "Bukit Timah Road";
      }
      
      console.log("Setting current location to:", roadName);
      
      // Pass this information up to parent component
      if (typeof window !== 'undefined') {
        // Let home page know about the postal code and road name
        window.dispatchEvent(new CustomEvent('postalCodeUpdated', { 
          detail: { postalCode, roadName } 
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

  // We're not rendering any visible component here since we moved the functionality
  // to the location section and filter button
  return null;
}