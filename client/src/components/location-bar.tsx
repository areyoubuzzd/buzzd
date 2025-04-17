import React, { useState, useEffect } from 'react';
import { FiSearch, FiMapPin, FiFilter } from 'react-icons/fi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface LocationBarProps {
  onLocationChange: (newLocation: { lat: number; lng: number }) => void;
  onOpenFilters: () => void;
}

export default function LocationBar({ onLocationChange, onOpenFilters }: LocationBarProps) {
  const [postalCode, setPostalCode] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [roadName, setRoadName] = useState('Singapore');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Try to get a more accurate location description using reverse geocoding
  useEffect(() => {
    if (location) {
      // This would normally call a geocoding API to get a readable address
      // For now, just emitting an event that other components can listen for
      const mockRoadName = "Happy Hour Central";
      setRoadName(mockRoadName);
      
      // Fire an event to inform other components about the postal code and road name
      window.dispatchEvent(new CustomEvent('postalCodeUpdated', { 
        detail: { postalCode: '', roadName: mockRoadName }
      }));
    }
  }, [location]);

  // Get current location
  const handleGetCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(newLocation);
          onLocationChange(newLocation);
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Default to Singapore coordinates
          const defaultLocation = { lat: 1.3521, lng: 103.8198 };
          setLocation(defaultLocation);
          onLocationChange(defaultLocation);
          setIsGettingLocation(false);
        },
        { timeout: 10000 }
      );
    } else {
      // Geolocation is not supported
      alert("Geolocation is not supported by your browser");
      setIsGettingLocation(false);
    }
  };

  return (
    <div className="bg-[#f8f7f5] p-3 border-b border-gray-200">
      <div className="container mx-auto">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex items-center gap-1 border-gray-300 bg-white"
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation}
          >
            <FiMapPin className="h-4 w-4 text-red-500" />
            <span className="text-xs truncate max-w-[100px] md:max-w-[200px]">
              {isGettingLocation ? 'Getting location...' : roadName}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}