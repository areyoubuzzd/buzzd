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
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input when mounted
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Close dropdown when clicking outside
  useClickOutside(containerRef, () => setIsOpen(false));

  // Fetch locations based on search term
  const { data: locationsData = { locations: [] }, isLoading } = useQuery({
    queryKey: ['locations', debouncedSearchTerm],
    queryFn: async () => {
      try {
        if (!debouncedSearchTerm) {
          // If no search term, always fetch all locations
          const response = await fetch('/api/locations/all');
          if (!response.ok) {
            // If all locations endpoint fails, fall back to popular
            const popularResponse = await fetch('/api/locations/popular');
            if (!popularResponse.ok) throw new Error('Failed to fetch locations');
            
            const data = await popularResponse.json();
            console.log('Popular locations response:', data);
            
            if (Array.isArray(data)) {
              return { locations: data };
            } else if (data && data.locations && Array.isArray(data.locations)) {
              return data;
            } else {
              console.error('Unexpected popular locations response format:', data);
              return { locations: [] };
            }
          }
          
          const data = await response.json();
          console.log('All locations response:', data);
          
          if (Array.isArray(data)) {
            return { locations: data };
          } else if (data && data.locations && Array.isArray(data.locations)) {
            return data;
          } else {
            console.error('Unexpected all locations response format:', data);
            return { locations: [] };
          }
        } else if (debouncedSearchTerm.length >= 1) {
          // Lower the minimum length to 1 character for search
          let url = `/api/locations/search?q=${encodeURIComponent(debouncedSearchTerm)}`;
          const response = await fetch(url);
          
          if (!response.ok) {
            if (response.status === 400) {
              // If the search fails due to query length, try searching all locations client-side
              const allResponse = await fetch('/api/locations/all');
              if (!allResponse.ok) throw new Error('Failed to fetch all locations');
              
              const allData = await allResponse.json();
              const allLocations = Array.isArray(allData) ? allData : 
                                   allData && allData.locations ? allData.locations : [];
              
              // Filter locations client-side
              const searchTerm = debouncedSearchTerm.toLowerCase();
              const filteredLocations = allLocations.filter(location => 
                location.name.toLowerCase().includes(searchTerm) || 
                (location.alternateNames && location.alternateNames.toLowerCase().includes(searchTerm))
              );
              
              return { locations: filteredLocations };
            }
            
            throw new Error('Failed to fetch locations');
          }
          
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
        }
        
        // Default empty result
        return { locations: [] };
      } catch (error) {
        console.error('Error fetching locations:', error);
        return { locations: [] };
      }
    },
    enabled: true, // Always fetch locations when the component mounts
  });
  
  // Filter and sort locations based on search term
  const locations = useMemo(() => {
    const locArray = locationsData.locations || [];
    
    if (!debouncedSearchTerm) {
      return locArray;
    }
    
    // If there's a search term, filter and sort by relevance
    const term = debouncedSearchTerm.toLowerCase();
    return locArray
      .filter(loc => 
        loc.name.toLowerCase().includes(term) || 
        (loc.alternateNames && loc.alternateNames.toLowerCase().includes(term))
      )
      .sort((a, b) => {
        // Exact matches first
        const aNameMatch = a.name.toLowerCase() === term;
        const bNameMatch = b.name.toLowerCase() === term;
        
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        
        // Then starts with term
        const aStartsWith = a.name.toLowerCase().startsWith(term);
        const bStartsWith = b.name.toLowerCase().startsWith(term);
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        // Otherwise sort by name
        return a.name.localeCompare(b.name);
      });
  }, [locationsData, debouncedSearchTerm]);

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
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          className="block w-full pl-8 pr-8 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClick={() => setIsOpen(true)}
          autoFocus
        />
        {searchTerm && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={handleClear}
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-500" />
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
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                  <div className="text-sm font-medium text-gray-900">{location.name}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}