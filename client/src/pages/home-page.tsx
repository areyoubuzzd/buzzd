import { useState, useEffect } from "react";
import Header from "@/components/layout/header";
import LocationBar from "@/components/layout/location-bar";
import FilterBar from "@/components/layout/filter-bar";
import MapPreview from "@/components/map/map-preview";
import DealsList from "@/components/deals/deals-list";
import SavingsCalculator from "@/components/savings/savings-calculator";
import Navigation from "@/components/layout/navigation";

type FilterType = 'all' | 'drinks' | 'food' | 'active' | 'upcoming' | 'weekend';

export default function HomePage() {
  // Initialize with a default location to prevent null issues
  const [location, setLocation] = useState<{ lat: number; lng: number }>({ lat: 43.651070, lng: -79.347015 });
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  useEffect(() => {
    // Try to get user's location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          // We already have a default location set in state
        }
      );
    }
  }, []);

  const handleLocationChange = (newLocation: { lat: number; lng: number }) => {
    setLocation(newLocation);
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const handleOpenFilters = () => {
    // This would open a more detailed filters panel in a real app
    console.log("Open detailed filters");
  };

  const handleExpandMap = () => {
    setIsMapExpanded(!isMapExpanded);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <LocationBar 
        onLocationChange={handleLocationChange} 
        onOpenFilters={handleOpenFilters} 
      />
      
      <FilterBar onFilterChange={handleFilterChange} />
      
      <MapPreview 
        deals={[]} // This would be populated with actual deals
        userLocation={location}
        radiusKm={1}
        onExpandClick={handleExpandMap}
      />
      
      <DealsList 
        location={location} 
        activeFilter={activeFilter}
      />
      
      <SavingsCalculator />
      
      <Navigation />
    </div>
  );
}
