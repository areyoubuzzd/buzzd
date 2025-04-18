import React, { useState } from 'react';
import { FiMapPin, FiFilter } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { LocationAutocomplete } from './location-autocomplete';
import { useLocation } from '@/contexts/location-context';

interface LocationHeaderProps {
  onOpenFilters?: () => void;
}

export function LocationHeader({ onOpenFilters }: LocationHeaderProps) {
  const { 
    location, 
    userRoadName, 
    updateLocation, 
    isUsingDefaultLocation,
    setUserRoadName, 
    setIsUsingDefaultLocation 
  } = useLocation();
  
  const [isLocationSelectOpen, setIsLocationSelectOpen] = useState<boolean>(false);

  // Handle filter button click
  const handleOpenFilters = () => {
    if (onOpenFilters) {
      onOpenFilters();
    } else {
      console.log("Open detailed filters");
    }
  };

  return (
    <div className="bg-[#d6cfc7] px-4 py-3 border-b border-gray-200">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          {isLocationSelectOpen ? (
            <LocationAutocomplete
              defaultValue=""
              placeholder="Search for a location..."
              onLocationSelect={(selectedLocation) => {
                // Use the coordinates from the selected location
                const newLat = selectedLocation.latitude;
                const newLng = selectedLocation.longitude;
                
                console.log("Selected location:", selectedLocation);
                
                // Update location name and coordinates in context - no timeout
                if (selectedLocation.name === "My Location") {
                  // If My Location selected, update with flag
                  console.log("Updating to My Location");
                  updateLocation(
                    { lat: newLat, lng: newLng }, 
                    "My Location"
                  );
                } else {
                  // Pass the actual location name for display
                  console.log(`Updating to location: ${selectedLocation.name}`);
                  updateLocation(
                    { lat: newLat, lng: newLng }, 
                    selectedLocation.name
                  );
                }
                
                // Close the location selector
                setIsLocationSelectOpen(false);
              }}
            />
          ) : (
            <div 
              className="flex items-center text-sm text-gray-700 cursor-pointer"
              onClick={() => {
                setIsLocationSelectOpen(true);
              }}
            >
              <FiMapPin className="mr-1 h-4 w-4 text-gray-500" />
              <span className="font-medium">{userRoadName}</span>
            </div>
          )}
          {/* Filter button */}
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            className="border border-gray-300 hover:bg-gray-100 rounded-lg p-2 shrink-0"
            style={{ background: "#c9c2ba" }}
            onClick={handleOpenFilters}
          >
            <FiFilter className="h-4 w-4 text-[#191632]" />
          </Button>
        </div>
      </div>
    </div>
  );
}