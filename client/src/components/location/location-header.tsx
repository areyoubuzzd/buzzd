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
    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
      <div className="container mx-auto">
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            {isLocationSelectOpen ? (
              <LocationAutocomplete
                defaultValue=""
                placeholder="Search for a location..."
                onLocationSelect={(selectedLocation) => {
                  // Use the coordinates from the selected location
                  const newLat = selectedLocation.latitude;
                  const newLng = selectedLocation.longitude;
                  
                  // Always display "My Location" regardless of what's selected
                  setUserRoadName("My Location");
                  setIsUsingDefaultLocation(true);
                  
                  // Update location in the context
                  setTimeout(() => {
                    updateLocation({ lat: newLat, lng: newLng });
                  }, 300);
                  
                  // Close the location selector
                  setIsLocationSelectOpen(false);
                }}
              />
            ) : (
              <div 
                className="flex items-center text-sm text-gray-600 cursor-pointer"
                onClick={() => {
                  setIsLocationSelectOpen(true);
                }}
              >
                <FiMapPin className="mr-1 h-4 w-4 text-gray-400" />
                <span className="font-medium">{userRoadName}</span>
              </div>
            )}
            {/* Filter button */}
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="border border-gray-200 hover:bg-gray-100 rounded-lg p-2 shrink-0"
              style={{ background: "#f8f7f5" }}
              onClick={handleOpenFilters}
            >
              <FiFilter className="h-4 w-4 text-[#191632]" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}