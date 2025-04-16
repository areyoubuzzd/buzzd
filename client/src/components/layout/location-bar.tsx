import { useState, useEffect } from "react";
import { FiMapPin, FiSearch } from "react-icons/fi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FiFilter } from "react-icons/fi";

interface LocationBarProps {
  onLocationChange: (location: { lat: number; lng: number }) => void;
  onOpenFilters: () => void;
}

export default function LocationBar({ onLocationChange, onOpenFilters }: LocationBarProps) {
  const [searchInput, setSearchInput] = useState<string>("");
  const [currentLocation, setCurrentLocation] = useState<string>("");
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [placeholderText, setPlaceholderText] = useState<string>("Enter any area, road or location");
  
  // Rotate placeholder text to show different options
  useEffect(() => {
    const placeholders = ["Tanjong Pagar", "Orchard Road", "Holland Village", "Bukit Timah", "Raffles Place", "any location name"];
    let index = 0;
    
    const intervalId = setInterval(() => {
      setPlaceholderText(placeholders[index]);
      index = (index + 1) % placeholders.length;
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    // Try to get user's location on component mount
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Reverse geocode to get location name
          reverseGeocode(latitude, longitude);
          // Update parent component with coordinates
          onLocationChange({ lat: latitude, lng: longitude });
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setCurrentLocation("Location unavailable");
          setIsLocating(false);
          
          // Default to Singapore coordinates
          onLocationChange({ lat: 1.3521, lng: 103.8198 });
        }
      );
    } else {
      setCurrentLocation("Geolocation not supported");
      setIsLocating(false);
      
      // Default to Singapore coordinates
      onLocationChange({ lat: 1.3521, lng: 103.8198 });
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      // This is a placeholder for actual reverse geocoding
      // In a real app, you'd use Google Maps Geocoding API or similar
      
      // Use different sample locations based on coordinates to simulate real geocoding
      // This makes the demo feel more realistic
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
      setCurrentLocation(roadName);
      
      // Pass this information up to parent component
      if (typeof window !== 'undefined') {
        // Let home page know about the postal code and road name
        window.dispatchEvent(new CustomEvent('postalCodeUpdated', { 
          detail: { postalCode, roadName } 
        }));
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      setCurrentLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Process free text location search
    if (searchInput) {
      console.log(`Searching for location: ${searchInput}`);
      
      // Treat any input as a location search
      setCurrentLocation(searchInput);
      
      // Dispatch event to update the location displayed in the home page
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('postalCodeUpdated', { 
          detail: { roadName: searchInput } 
        }));
      }
      
      // For a real app, we would geocode this text to get coordinates
      // For now, use Singapore coordinates with slight variation
      onLocationChange({ 
        lat: 1.3521 + (Math.random() * 0.02 - 0.01),
        lng: 103.8198 + (Math.random() * 0.02 - 0.01)
      });
    }
    
    setSearchInput("");
  };

  return (
    <div className="bg-[#f8f7f5] shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <form onSubmit={handleSearchSubmit} className="w-full">
                <Input
                  type="text"
                  className="w-full py-2 pl-10 pr-20 text-sm bg-[#f8f7f5] border-gray-200 placeholder:text-gray-400"
                  placeholder={`Search ${placeholderText}...`}
                  style={{ color: "#444" }}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchSubmit(e);
                    }
                  }}
                />
              </form>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {isLocating ? (
                  <div className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    <span className="ml-1 text-xs text-primary">Locating...</span>
                  </div>
                ) : (
                  <>
                    <span className="location-dot w-2 h-2 bg-success rounded-full"></span>
                    <span className="ml-1 text-xs text-success">Live</span>
                  </>
                )}
              </div>
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="ml-3 border border-gray-200 hover:bg-gray-100 rounded-lg p-2"
              style={{ background: "#f8f7f5" }}
              onClick={onOpenFilters}
            >
              <FiFilter className="h-5 w-5 text-[#191632]" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}