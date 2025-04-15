import { useState, useEffect } from "react";
import { FiMapPin, FiSearch, FiX } from "react-icons/fi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FiFilter, FiChevronsRight } from "react-icons/fi";
import { FaBeer, FaWineGlassAlt, FaGlassWhiskey, FaUsers } from "react-icons/fa";
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
import { Badge } from "@/components/ui/badge";

interface LocationBarProps {
  onLocationChange: (location: { lat: number; lng: number }) => void;
  onOpenFilters: () => void;
}

// Sample search suggestions
const SEARCH_SUGGESTIONS = [
  { type: 'location', label: 'Tanjong Pagar', value: 'tanjong-pagar', icon: <FiMapPin className="h-4 w-4" /> },
  { type: 'location', label: 'Raffles Place', value: 'raffles-place', icon: <FiMapPin className="h-4 w-4" /> },
  { type: 'location', label: 'Clarke Quay', value: 'clarke-quay', icon: <FiMapPin className="h-4 w-4" /> },
  { type: 'location', label: 'Orchard Road', value: 'orchard-road', icon: <FiMapPin className="h-4 w-4" /> },
  { type: 'alcohol', label: 'Beer', value: 'beer', icon: <FaBeer className="h-4 w-4" /> },
  { type: 'alcohol', label: 'Gin', value: 'gin', icon: <FiChevronsRight className="h-4 w-4" /> },
  { type: 'alcohol', label: 'Whisky', value: 'whisky', icon: <FaGlassWhiskey className="h-4 w-4" /> },
  { type: 'alcohol', label: 'Wine', value: 'wine', icon: <FaWineGlassAlt className="h-4 w-4" /> },
  { type: 'deal_type', label: '1-for-1', value: 'one-for-one', icon: <FaUsers className="h-4 w-4" /> },
  { type: 'deal_type', label: 'Big Savings', value: 'high-savings', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
      <path d="M12 18V6"></path>
    </svg>
  ) },
  { type: 'brand', label: 'Sapporo', value: 'sapporo', icon: <FaBeer className="h-4 w-4" /> },
  { type: 'brand', label: 'Hendricks', value: 'hendricks', icon: <FiChevronsRight className="h-4 w-4" /> },
  { type: 'brand', label: 'Roku Gin', value: 'roku-gin', icon: <FiChevronsRight className="h-4 w-4" /> },
  { type: 'brand', label: 'Monkey Shoulder', value: 'whisky', icon: <FaGlassWhiskey className="h-4 w-4" /> },
];

export default function LocationBar({ onLocationChange, onOpenFilters }: LocationBarProps) {
  const [searchInput, setSearchInput] = useState<string>("");
  const [currentLocation, setCurrentLocation] = useState<string>("");
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [placeholderText, setPlaceholderText] = useState<string>("Search by location or drink type");
  const [selectedFilters, setSelectedFilters] = useState<(typeof SEARCH_SUGGESTIONS[0])[]>([]);
  
  // Rotate placeholder text to show different options
  useEffect(() => {
    const placeholders = ["Beer", "Tanjong Pagar", "1-for-1 deals", "Whisky", "Orchard Road"];
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
      
      // Use hardcoded values for now - this would use Google Maps API in production
      const postalCode = "138634"; 
      const roadName = "Bukit Timah Road";
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
    setShowSuggestions(false);
    
    // In a real app, you'd process this search term
    // For now, just update the current location/search term
    if (searchInput) {
      console.log(`Searching for: ${searchInput}`);
      
      // If it looks like a location or postal code
      // First check if it's one of our predefined locations
      const locationSuggestion = SEARCH_SUGGESTIONS.find(
        suggestion => suggestion.type === 'location' && 
        suggestion.label.toLowerCase().includes(searchInput.toLowerCase())
      );
      
      if (locationSuggestion) {
        // Simulate location change from predefined location
        setCurrentLocation(locationSuggestion.label);
        
        // Dispatch event to update the location displayed in the home page
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('postalCodeUpdated', { 
            detail: { roadName: locationSuggestion.label } 
          }));
        }
        
        // Use Singapore coordinates with a slight offset for simulation
        // In a real app, you'd use geocoding here
        onLocationChange({ 
          lat: 1.3521 + (Math.random() * 0.02 - 0.01),
          lng: 103.8198 + (Math.random() * 0.02 - 0.01)
        });
      } else {
        // Treat as a custom location (could be postal code or any text)
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
    }
    
    setSearchInput("");
  };

  const handleSuggestionClick = (suggestion: typeof SEARCH_SUGGESTIONS[0]) => {
    setShowSuggestions(false);
    setSearchInput("");
    
    // Add to selected filters if not already there
    if (!selectedFilters.some(filter => filter.value === suggestion.value)) {
      setSelectedFilters([...selectedFilters, suggestion]);
    }
    
    if (suggestion.type === 'location') {
      setCurrentLocation(suggestion.label);
      
      // Dispatch event to update the location displayed in the home page
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('postalCodeUpdated', { 
          detail: { roadName: suggestion.label } 
        }));
      }
      
      // Use Singapore coordinates with a slight offset for simulation
      onLocationChange({ 
        lat: 1.3521 + (Math.random() * 0.02 - 0.01),
        lng: 103.8198 + (Math.random() * 0.02 - 0.01)
      });
    } else {
      // For alcohol/brand/deal type, we'd filter by this in a real app
      console.log(`Selected ${suggestion.type}: ${suggestion.label}`);
    }
  };
  
  const removeFilter = (filterValue: string) => {
    setSelectedFilters(selectedFilters.filter(filter => filter.value !== filterValue));
  };

  return (
    <div className="bg-[#f8f7f5] shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
              <PopoverTrigger asChild>
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
                      onFocus={() => setShowSuggestions(true)}
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
                            {suggestion.icon}
                            <span className="ml-2">{suggestion.label}</span>
                          </CommandItem>
                        ))
                      }
                    </CommandGroup>
                    <CommandGroup heading="Drink Types">
                      {SEARCH_SUGGESTIONS
                        .filter(s => s.type === 'alcohol')
                        .filter(s => !searchInput || s.label.toLowerCase().includes(searchInput.toLowerCase()))
                        .map(suggestion => (
                          <CommandItem 
                            key={suggestion.value}
                            onSelect={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion.icon}
                            <span className="ml-2">{suggestion.label}</span>
                          </CommandItem>
                        ))
                      }
                    </CommandGroup>
                    <CommandGroup heading="Deal Types">
                      {SEARCH_SUGGESTIONS
                        .filter(s => s.type === 'deal_type')
                        .filter(s => !searchInput || s.label.toLowerCase().includes(searchInput.toLowerCase()))
                        .map(suggestion => (
                          <CommandItem 
                            key={suggestion.value}
                            onSelect={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion.icon}
                            <span className="ml-2">{suggestion.label}</span>
                          </CommandItem>
                        ))
                      }
                    </CommandGroup>
                    <CommandGroup heading="Brands">
                      {SEARCH_SUGGESTIONS
                        .filter(s => s.type === 'brand')
                        .filter(s => !searchInput || s.label.toLowerCase().includes(searchInput.toLowerCase()))
                        .map(suggestion => (
                          <CommandItem 
                            key={suggestion.value}
                            onSelect={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion.icon}
                            <span className="ml-2">{suggestion.label}</span>
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
              className="ml-3 border border-gray-200 hover:bg-gray-100 rounded-lg p-2"
              style={{ background: "#f8f7f5" }}
              onClick={onOpenFilters}
            >
              <FiFilter className="h-5 w-5 text-[#191632]" />
            </Button>
          </div>
          
          {/* Selected filters */}
          {selectedFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {selectedFilters.map(filter => (
                <Badge 
                  key={filter.value} 
                  variant="secondary"
                  className="flex items-center gap-1 py-1 pl-2 pr-1 bg-[#f8f7f5] border border-gray-200"
                  style={{ color: "#191632" }}
                >
                  {filter.icon && <span className="mr-1 text-[#191632]">{filter.icon}</span>}
                  <span className="truncate max-w-[80px] sm:max-w-full text-[#191632]">{filter.label}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-5 w-5 p-0 ml-1 hover:bg-gray-200 rounded-full flex-shrink-0"
                    onClick={() => removeFilter(filter.value)}
                  >
                    <FiX className="h-3 w-3 text-[#191632]" />
                  </Button>
                </Badge>
              ))}
              
              {selectedFilters.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6 px-2 py-0 hover:bg-gray-100 text-[#191632]"
                  onClick={() => setSelectedFilters([])}
                >
                  Clear all
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
