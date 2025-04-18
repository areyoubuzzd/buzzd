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
  userPosition: LocationCoordinates; // Add a dedicated property for user's real GPS position
  updateLocation: (newLocation: LocationCoordinates, locationName?: string) => void;
  setUserRoadName: (name: string) => void;
  setIsUsingDefaultLocation: (isDefault: boolean) => void;
}

const defaultContext: LocationContextType = {
  location: { lat: 1.3521, lng: 103.8198 }, // Singapore default
  userRoadName: "My Location",
  isUsingDefaultLocation: true,
  userPosition: { lat: 1.3521, lng: 103.8198 }, // Default to Singapore but will be updated with real GPS
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
  const [userPosition, setUserPosition] = useState<LocationCoordinates>(defaultContext.userPosition);

  // Initialize location from localStorage or geolocation on mount
  useEffect(() => {
    console.log('LocationContext: Initializing...');
    
    // Check if we have a cached location in localStorage
    const cachedLocationStr = localStorage.getItem('lastKnownLocation');
    let cachedLocation = null;
    
    if (cachedLocationStr) {
      try {
        cachedLocation = JSON.parse(cachedLocationStr);
        console.log('LocationContext: Found cached location:', cachedLocation);
        
        // Check if cache is recent (less than 24 hours old)
        if (cachedLocation && cachedLocation.timestamp && 
            Date.now() - cachedLocation.timestamp < 24 * 60 * 60 * 1000) {
          
          // Update coordinates
          setLocation({
            lat: cachedLocation.lat,
            lng: cachedLocation.lng
          });
          
          // Set the name from cache - either "My Location" or a specific location
          if (cachedLocation.name) {
            console.log('LocationContext: Using cached location name:', cachedLocation.name);
            setUserRoadName(cachedLocation.name);
            setIsUsingDefaultLocation(
              cachedLocation.name === "My Location" || 
              cachedLocation.isDefaultLocation === true
            );
          } else {
            // Default to "My Location" if no name is found
            console.log('LocationContext: No name in cache, defaulting to "My Location"');
            setUserRoadName("My Location");
            setIsUsingDefaultLocation(true);
          }
        } else {
          // Cache is too old, default to "My Location"
          console.log('LocationContext: Cache is too old, defaulting to "My Location"');
          setUserRoadName("My Location");
          setIsUsingDefaultLocation(true);
        }
      } catch (e) {
        console.error('Error parsing cached location:', e);
        setUserRoadName("My Location");
        setIsUsingDefaultLocation(true);
      }
    } else {
      // No cache found, default to "My Location"
      console.log('LocationContext: No cache found, defaulting to "My Location"');
      setUserRoadName("My Location");
      setIsUsingDefaultLocation(true);
    }
    
    // Try to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          // Always update userPosition for accurate distance calculations
          console.log('LocationContext: Updating userPosition with real GPS:', newPosition);
          setUserPosition(newPosition);
          
          // Only update the selected location if we're using default location
          if (isUsingDefaultLocation && 
              (!cachedLocation || 
              Math.abs(cachedLocation.lat - newPosition.lat) > 0.01 ||
              Math.abs(cachedLocation.lng - newPosition.lng) > 0.01)) {
            
            console.log('LocationContext: Also updating selected location with GPS:', newPosition);
            setLocation(newPosition);
            
            // Store in local storage for future use
            const locationToCache = {
              ...newPosition,
              name: userRoadName,
              isDefaultLocation: isUsingDefaultLocation,
              timestamp: Date.now()
            };
            localStorage.setItem('lastKnownLocation', JSON.stringify(locationToCache));
          } else {
            console.log('LocationContext: Selected location unchanged (custom location or position close to cached)');
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
  const updateLocation = (newLocation: LocationCoordinates, locationName?: string) => {
    console.log('LocationContext: Updating selected location to:', newLocation);
    setLocation(newLocation);
    
    // Update location name if provided
    if (locationName) {
      console.log('LocationContext: Updating location name to:', locationName);
      setUserRoadName(locationName);
      setIsUsingDefaultLocation(locationName === "My Location");
      
      // If they selected "My Location", use their actual GPS position
      if (locationName === "My Location") {
        // Try to get fresh GPS position
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const freshPosition = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              console.log('LocationContext: Refreshing GPS position when My Location selected:', freshPosition);
              setUserPosition(freshPosition);
              setLocation(freshPosition); // Also update selected location
              
              // Invalidate queries with the new GPS location
              queryClient.invalidateQueries({ 
                queryKey: ['/api/deals/collections/all', { lat: freshPosition.lat, lng: freshPosition.lng }]
              });
              
              // Cache the GPS location
              const locationToCache = {
                ...freshPosition,
                name: "My Location",
                isDefaultLocation: true,
                timestamp: Date.now()
              };
              localStorage.setItem('lastKnownLocation', JSON.stringify(locationToCache));
            },
            (error) => {
              console.error("Error getting location during My Location selection:", error);
              // Continue with default logic below
              standardQueryInvalidation(newLocation);
            }
          );
          return; // Skip the standard query invalidation below
        }
      }
    }
    
    // Standard query invalidation for non-My Location selections
    standardQueryInvalidation(newLocation);
    
    // Helper function for standard query invalidation and caching
    function standardQueryInvalidation(location: LocationCoordinates) {
      // Invalidate any location-dependent queries
      queryClient.invalidateQueries({ 
        queryKey: ['/api/deals/collections/all', { lat: location.lat, lng: location.lng }]
      });
      
      // Update local storage with all necessary information
      const locationToCache = {
        ...location,
        name: locationName || userRoadName,
        isDefaultLocation: locationName === "My Location" || isUsingDefaultLocation,
        timestamp: Date.now()
      };
      console.log('LocationContext: Saving to localStorage:', locationToCache);
      localStorage.setItem('lastKnownLocation', JSON.stringify(locationToCache));
    }
  };

  // Provide context values
  const contextValue: LocationContextType = {
    location,
    userRoadName,
    isUsingDefaultLocation,
    userPosition,
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