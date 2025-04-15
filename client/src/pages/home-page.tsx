import { useState, useEffect } from "react";
import Header from "@/components/layout/header";
import LocationBar from "@/components/layout/location-bar";
import FilterBar from "@/components/layout/filter-bar";
import DealsList from "@/components/deals/deals-list";
import NewWhatsAppContact from "@/components/contact/new-whatsapp-contact";
import NewLocationButton from "@/components/layout/new-location-button";
import Navigation from "@/components/layout/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FiMapPin } from "react-icons/fi";

// Updated FilterType to match the new filter-bar component
type FilterType = 'active' | 'one-for-one' | 'high-savings' | 'beer' | 'wine' | 'whisky';

export default function HomePage() {
  // Initialize with a default location - Singapore
  const [location, setLocation] = useState<{ lat: number; lng: number }>({ lat: 1.3521, lng: 103.8198 });
  const [activeFilter, setActiveFilter] = useState<FilterType>('active');
  const [totalDealsFound, setTotalDealsFound] = useState<number>(30); // Total deals from API
  const [userPostalCode, setUserPostalCode] = useState<string>(""); // Added postal code state
  const [userRoadName, setUserRoadName] = useState<string>(""); // Added road name state

  useEffect(() => {
    // Try to get user's location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          
          // Try to get a postal code based on reverse geocoding will be handled by LocationBar
          // which will send us an event with the postal code
        },
        (error) => {
          console.error("Error getting location:", error);
          // We already have a default location (Singapore) set in state
        }
      );
    }
    
    // Listen for postal code and road name updates from LocationBar
    const handlePostalCodeUpdate = (event: CustomEvent) => {
      if (event.detail) {
        if (event.detail.postalCode) {
          setUserPostalCode(event.detail.postalCode);
        }
        if (event.detail.roadName) {
          setUserRoadName(event.detail.roadName);
        }
      }
    };
    
    // Add event listener
    window.addEventListener('postalCodeUpdated', handlePostalCodeUpdate as EventListener);
    
    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('postalCodeUpdated', handlePostalCodeUpdate as EventListener);
    };
  }, []);

  const handleLocationChange = (newLocation: { lat: number; lng: number }) => {
    setLocation(newLocation);
    
    // In a real app, we'd recalculate deals based on new location
    // For now, just simulate different number of deals
    setTotalDealsFound(Math.floor(Math.random() * 20) + 10);
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    
    // In a real app, we'd filter deals based on the new filter
    // For now, just simulate different number of deals
    setTotalDealsFound(Math.floor(Math.random() * 20) + 10);
  };

  const handleOpenFilters = () => {
    // This would open a more detailed filters panel in a real app
    console.log("Open detailed filters");
  };

  return (
    <div className="flex flex-col min-h-screen pb-36">
      <Header />
      
      <LocationBar 
        onLocationChange={handleLocationChange} 
        onOpenFilters={handleOpenFilters} 
      />
      
      <FilterBar activeFilter={activeFilter} onFilterChange={handleFilterChange} />
      
      {/* New location button component */}
      <NewLocationButton 
        location={userRoadName || "Bukit Timah Road"}
        totalDeals={totalDealsFound}
        onClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setTimeout(() => {
            const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
              searchInput.select();
            }
          }, 100);
        }}
      />
      
      <DealsList 
        location={location} 
        activeFilter={activeFilter}
      />
      
      <NewWhatsAppContact />
      
      <Navigation />
    </div>
  );
}
