import { useState, useEffect } from "react";
import { FiMapPin, FiSearch } from "react-icons/fi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FiFilter } from "react-icons/fi";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface LocationBarProps {
  onLocationChange: (location: { lat: number; lng: number }) => void;
  onOpenFilters: () => void;
}

// Sample search suggestions
const SEARCH_SUGGESTIONS = [
  { type: 'location', label: 'Tanjong Pagar', value: 'tanjong-pagar' },
  { type: 'location', label: 'Raffles Place', value: 'raffles-place' },
  { type: 'location', label: 'Clarke Quay', value: 'clarke-quay' },
  { type: 'location', label: 'Orchard Road', value: 'orchard-road' },
  { type: 'alcohol', label: 'Beer', value: 'beer' },
  { type: 'alcohol', label: 'Gin', value: 'gin' },
  { type: 'alcohol', label: 'Whisky', value: 'whisky' },
  { type: 'alcohol', label: 'Wine', value: 'wine' },
  { type: 'brand', label: 'Sapporo', value: 'sapporo' },
  { type: 'brand', label: 'Hendricks', value: 'hendricks' },
  { type: 'brand', label: 'Roku Gin', value: 'roku-gin' },
  { type: 'brand', label: 'Monkey Shoulder', value: 'monkey-shoulder' },
];

export default function LocationBar({ onLocationChange, onOpenFilters }: LocationBarProps) {
  const [searchInput, setSearchInput] = useState<string>("");
  const [currentLocation, setCurrentLocation] = useState<string>("");
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [placeholderText, setPlaceholderText] = useState<string>("Search by location or drink type");
  
  // Rotate placeholder text to show different options
  useEffect(() => {
    const placeholders = ["Beer", "Tanjong Pagar", "Gin bottle", "Whisky", "Orchard Road"];
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
      setCurrentLocation("Singapore");
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      setCurrentLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    
    // In a real app, you'd process this search term
    // For now, just update the current location/search term
    if (searchInput) {
      console.log(`Searching for: ${searchInput}`);
      
      // If it looks like a location, try to set that
      const locationSuggestion = SEARCH_SUGGESTIONS.find(
        suggestion => suggestion.type === 'location' && 
        suggestion.label.toLowerCase().includes(searchInput.toLowerCase())
      );
      
      if (locationSuggestion) {
        // Simulate location change
        setCurrentLocation(locationSuggestion.label);
        
        // Use Singapore coordinates with a slight offset for simulation
        // In a real app, you'd use geocoding here
        onLocationChange({ 
          lat: 1.3521 + (Math.random() * 0.02 - 0.01),
          lng: 103.8198 + (Math.random() * 0.02 - 0.01)
        });
      }
    }
    
    setSearchInput("");
  };

  const handleSuggestionClick = (suggestion: typeof SEARCH_SUGGESTIONS[0]) => {
    setShowSuggestions(false);
    setSearchInput("");
    
    if (suggestion.type === 'location') {
      setCurrentLocation(suggestion.label);
      // Use Singapore coordinates with a slight offset for simulation
      onLocationChange({ 
        lat: 1.3521 + (Math.random() * 0.02 - 0.01),
        lng: 103.8198 + (Math.random() * 0.02 - 0.01)
      });
    } else {
      // For alcohol/brand, we'd filter by this in a real app
      console.log(`Selected ${suggestion.type}: ${suggestion.label}`);
    }
  };

  return (
    <div className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
            <PopoverTrigger asChild>
              <div className="flex items-center flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  className="w-full py-2 pl-10 pr-20 text-sm"
                  placeholder={`Search ${placeholderText}...`}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
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
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[350px]" align="start">
              <Command>
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup heading="Locations">
                    {SEARCH_SUGGESTIONS
                      .filter(s => s.type === 'location')
                      .filter(s => !searchInput || s.label.toLowerCase().includes(searchInput.toLowerCase()))
                      .map(suggestion => (
                        <CommandItem 
                          key={suggestion.value}
                          onSelect={() => handleSuggestionClick(suggestion)}
                        >
                          <FiMapPin className="mr-2 h-4 w-4" />
                          {suggestion.label}
                        </CommandItem>
                      ))
                    }
                  </CommandGroup>
                  <CommandGroup heading="Drinks">
                    {SEARCH_SUGGESTIONS
                      .filter(s => s.type === 'alcohol' || s.type === 'brand')
                      .filter(s => !searchInput || s.label.toLowerCase().includes(searchInput.toLowerCase()))
                      .map(suggestion => (
                        <CommandItem 
                          key={suggestion.value}
                          onSelect={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion.label}
                        </CommandItem>
                      ))
                    }
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            className="ml-3 bg-gray-200 hover:bg-gray-300 rounded-lg p-2"
            onClick={onOpenFilters}
          >
            <FiFilter className="h-5 w-5 text-gray-700" />
          </Button>
        </div>
      </div>
    </div>
  );
}
