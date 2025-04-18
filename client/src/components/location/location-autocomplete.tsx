import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, MapPin, X } from 'lucide-react';
// Import hooks with relative paths based on actual directory structure
import { useDebounce } from '../../hooks/use-debounce';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useClickOutside } from '../../hooks/use-click-outside';

type SingaporeLocation = {
  id: number;
  name: string;
  postalCode?: string;
  area?: string;
  latitude: number;
  longitude: number;
  alternateNames?: string;
  isPopular: boolean;
};

interface LocationAutocompleteProps {
  onLocationSelect: (location: SingaporeLocation) => void;
  className?: string;
  placeholder?: string;
  defaultValue?: string;
}

export function LocationAutocomplete({
  onLocationSelect,
  className,
  placeholder = 'Search for a location...',
  defaultValue = '',
}: LocationAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useClickOutside(containerRef, () => setIsOpen(false));

  // Fetch locations based on search term
  const { data: locationsData = { locations: [] }, isLoading } = useQuery({
    queryKey: ['locations', debouncedSearchTerm],
    queryFn: async () => {
      try {
        if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
          // If no search term or too short, fetch popular locations instead
          const response = await fetch('/api/locations/popular');
          if (!response.ok) throw new Error('Failed to fetch popular locations');
          
          const data = await response.json();
          console.log('Popular locations response:', data);
          
          // Handle different response formats
          if (Array.isArray(data)) {
            return { locations: data };
          } else if (data && data.locations && Array.isArray(data.locations)) {
            return data;
          } else {
            console.error('Unexpected popular locations response format:', data);
            return { locations: [] };
          }
        }
        
        const response = await fetch(`/api/locations/search?q=${encodeURIComponent(debouncedSearchTerm)}`);
        if (!response.ok) throw new Error('Failed to fetch locations');
        
        const data = await response.json();
        console.log('Search locations response:', data);
        
        // Handle different response formats
        if (Array.isArray(data)) {
          return { locations: data };
        } else if (data && data.locations && Array.isArray(data.locations)) {
          return data;
        } else {
          console.error('Unexpected search locations response format:', data);
          return { locations: [] };
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
        return { locations: [] };
      }
    },
    enabled: isOpen,
  });
  
  // Extract the locations array from the response data
  const locations = useMemo(() => {
    return locationsData.locations || [];
  }, [locationsData]);

  // Open dropdown when typing
  useEffect(() => {
    if (debouncedSearchTerm) {
      setIsOpen(true);
    }
  }, [debouncedSearchTerm]);

  const handleLocationClick = (location: SingaporeLocation) => {
    onLocationSelect(location);
    setSearchTerm(location.name);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-md", className)}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClick={() => setIsOpen(true)}
        />
        {searchTerm && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={handleClear}
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-500" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 max-h-60 overflow-auto">
          {isLoading ? (
            <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
          ) : locations.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500">No locations found</div>
          ) : (
            locations.map((location: SingaporeLocation) => (
              <div
                key={location.id}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleLocationClick(location)}
              >
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{location.name}</div>
                    {location.area && (
                      <div className="text-xs text-gray-500">
                        {location.area}{location.postalCode && ` - ${location.postalCode}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}