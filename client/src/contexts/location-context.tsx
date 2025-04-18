import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { queryClient } from '@/lib/queryClient';

// Define location types and interfaces
export interface LocationCoordinates {
  lat: number;
  lng: number;
}

interface LocationContextType {
  location: LocationCoordinates;
  userRoadName: string;
  isUsingDefaultLocation: boolean;
  updateLocation: (newLocation: LocationCoordinates) => void;
  setUserRoadName: (name: string) => void;
  setIsUsingDefaultLocation: (isDefault: boolean) => void;
}

const defaultContext: LocationContextType = {
  location: { lat: 1.3521, lng: 103.8198 }, // Singapore default
  userRoadName: "My Location",
  isUsingDefaultLocation: true,
  updateLocation: () => {},
  setUserRoadName: () => {},
  setIsUsingDefaultLocation: () => {},
};

// Create the context
export const LocationContext = createContext<LocationContextType>(defaultContext);

// Create a provider component
interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [location, setLocation] = useState<LocationCoordinates>(defaultContext.location);
  const [userRoadName, setUserRoadName] = useState<string>(defaultContext.userRoadName);
  const [isUsingDefaultLocation, setIsUsingDefaultLocation] = useState<boolean>(defaultContext.isUsingDefaultLocation);

  // Initialize location from localStorage or geolocation on mount
  useEffect(() => {
    // ALWAYS initialize with "My Location" as the display name
    setUserRoadName("My Location");
    setIsUsingDefaultLocation(true);
    
    // Check if we have a cached location in localStorage
    const cachedLocationStr = localStorage.getItem('lastKnownLocation');
    let cachedLocation = null;
    
    if (cachedLocationStr) {
      try {
        cachedLocation = JSON.parse(cachedLocationStr);
        // Check if cache is recent (less than 24 hours old)
        if (cachedLocation && cachedLocation.timestamp && 
            Date.now() - cachedLocation.timestamp < 24 * 60 * 60 * 1000) {
          console.log('Using cached location coordinates, but keeping "My Location" display');
          
          // Only update coordinates, but keep displaying "My Location"
          setLocation({
            lat: cachedLocation.lat,
            lng: cachedLocation.lng
          });
        }
      } catch (e) {
        console.error('Error parsing cached location:', e);
      }
    }
    
    // Try to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          // Only update if significantly different from cached location
          // to avoid unnecessary API calls
          if (!cachedLocation || 
              Math.abs(cachedLocation.lat - newLocation.lat) > 0.01 ||
              Math.abs(cachedLocation.lng - newLocation.lng) > 0.01) {
            
            console.log('Updating with fresh geolocation data:', newLocation);
            setLocation(newLocation);
            
            // Store in local storage for future use
            const locationToCache = {
              ...newLocation,
              name: userRoadName,
              timestamp: Date.now()
            };
            localStorage.setItem('lastKnownLocation', JSON.stringify(locationToCache));
          } else {
            console.log('Current location is close to cached location, no update needed');
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          // Use default or cached location if available
        }
      );
    }
  }, []);

  // Function to update location
  const updateLocation = (newLocation: LocationCoordinates) => {
    console.log('Updating global location context to:', newLocation);
    setLocation(newLocation);
    
    // Invalidate any location-dependent queries
    queryClient.invalidateQueries({ 
      queryKey: ['/api/deals/collections/all', { lat: newLocation.lat, lng: newLocation.lng }]
    });
    
    // Update local storage
    const locationToCache = {
      ...newLocation,
      name: userRoadName,
      timestamp: Date.now()
    };
    localStorage.setItem('lastKnownLocation', JSON.stringify(locationToCache));
  };

  // Provide context values
  const contextValue: LocationContextType = {
    location,
    userRoadName,
    isUsingDefaultLocation,
    updateLocation,
    setUserRoadName,
    setIsUsingDefaultLocation,
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
};

// Create a hook for easier consumption
export const useLocation = () => useContext(LocationContext);