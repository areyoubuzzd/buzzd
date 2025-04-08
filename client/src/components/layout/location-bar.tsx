import { useState, useEffect } from "react";
import { FiMapPin } from "react-icons/fi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FiFilter } from "react-icons/fi";

interface LocationBarProps {
  onLocationChange: (location: { lat: number; lng: number }) => void;
  onOpenFilters: () => void;
}

export default function LocationBar({ onLocationChange, onOpenFilters }: LocationBarProps) {
  const [locationInput, setLocationInput] = useState<string>("");
  const [currentLocation, setCurrentLocation] = useState<string>("");
  const [isLocating, setIsLocating] = useState<boolean>(false);

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
        }
      );
    } else {
      setCurrentLocation("Geolocation not supported");
      setIsLocating(false);
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      // This is a placeholder for actual reverse geocoding
      // In a real app, you'd use Google Maps Geocoding API or similar
      setCurrentLocation("Current Location");
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      setCurrentLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    }
  };

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd use geocoding to convert address to coordinates
    // For now, just update the current location display
    setCurrentLocation(locationInput);
    setLocationInput("");
  };

  return (
    <div className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <form onSubmit={handleLocationSubmit} className="flex items-center justify-between">
          <div className="flex items-center flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiMapPin className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              className="w-full py-2 pl-10 pr-20 text-sm"
              placeholder="Your location or postal code"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
            />
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
            className="ml-3 bg-gray-200 hover:bg-gray-300 rounded-lg p-2"
            onClick={onOpenFilters}
          >
            <FiFilter className="h-5 w-5 text-gray-700" />
          </Button>
        </form>
      </div>
    </div>
  );
}
