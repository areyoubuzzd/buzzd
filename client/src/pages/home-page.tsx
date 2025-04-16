import React, { useState, useEffect, useMemo } from "react";
import Header from "@/components/layout/header";
import LocationBar from "@/components/layout/location-bar";
import FilterBar from "@/components/layout/filter-bar";
import SavingsCalculator from "@/components/savings/savings-calculator";
import Navigation from "@/components/layout/navigation";
import CollectionRow from "@/components/collections/collection-row";
import DealsList from "@/components/deals/deals-list";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FiMapPin, FiEdit2, FiFilter } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";

// Updated FilterType to match the new filter-bar component
type FilterType = 'active' | 'one-for-one' | 'high-savings' | 'beer' | 'wine' | 'whisky';

// Define Deal and Collection types
type Deal = {
  id: number;
  establishmentId: number;
  alcohol_category: string;
  alcohol_subcategory: string;
  drink_name: string;
  regular_price: number;
  happy_hour_price: number;
  is_one_for_one: boolean;
  is_house_pour: boolean;
  valid_days: string;
  hh_start_time: string;
  hh_end_time: string;
  collections?: string;
  description?: string;
};

type Collection = {
  name: string;
  deals: Deal[];
  description?: string;
};

export default function HomePage() {
  // Use this for WhatsApp button so it's directly embedded in this file
  const handleWhatsAppClick = () => {
    const whatsappUrl = "https://wa.me/6587654321?text=Hello%2C%20I'd%20like%20to%20suggest%20a%20restaurant%20or%20deal%20to%20be%20added%20to%20the%20app.";
    window.open(whatsappUrl, "_blank");
  };
  // Initialize with a default location - Singapore
  const [location, setLocation] = useState<{ lat: number; lng: number }>({ lat: 1.3521, lng: 103.8198 });
  const [activeFilter, setActiveFilter] = useState<FilterType>('active');
  const [totalDealsFound, setTotalDealsFound] = useState<number>(30); // Total deals from API
  const [userPostalCode, setUserPostalCode] = useState<string>(""); // Added postal code state
  const [userRoadName, setUserRoadName] = useState<string>(""); // Added road name state

  // Fetch all deals for collections
  const { data: dealsData } = useQuery<Deal[]>({
    queryKey: ['/api/deals/collections/all'],
    staleTime: 60000, // 1 minute
    retry: 2
  });
  
  // Helper function to check if deal is active right now (based on day and time)
  const isDealActiveNow = (deal: Deal): boolean => {
    const now = new Date();
    const currentDay = now.toLocaleString('en-US', { weekday: 'long', timeZone: 'Asia/Singapore' });
    const currentTime = now.toLocaleString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false, 
      timeZone: 'Asia/Singapore' 
    });
    
    // Check if today is in the valid days
    const validDays = deal.valid_days.split(',').map(day => day.trim().toLowerCase());
    if (!validDays.includes(currentDay.toLowerCase())) {
      return false;
    }
    
    // Check if current time is within happy hour
    const [startHour, startMinute] = deal.hh_start_time.split(':').map(Number);
    const [endHour, endMinute] = deal.hh_end_time.split(':').map(Number);
    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    
    const startTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    
    return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
  };
  
  // Helper function to calculate distance between two coordinates (in km)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance;
  };
  
  // Create collections from deals data
  const collections = useMemo<Collection[]>(() => {
    if (!dealsData) return [];
    
    const allDeals = dealsData;
    
    // First get all unique collection tags from the deals
    const uniqueCollections = new Set<string>();
    allDeals.forEach(deal => {
      if (deal.collections) {
        deal.collections.split(',').map((c: string) => c.trim()).forEach((tag: string) => {
          if (tag) uniqueCollections.add(tag);
        });
      }
    });
    
    // Then create a collection for each unique tag
    const collectionList: Collection[] = [];
    
    // Add predefined collections first
    collectionList.push({
      name: "Beers Under $10",
      description: "Great beer deals under $10",
      deals: allDeals.filter(deal => 
        deal.alcohol_category === "Beer" && 
        deal.happy_hour_price < 10
      )
    });
    
    collectionList.push({
      name: "1-for-1 Deals",
      description: "Buy one get one free!",
      deals: allDeals.filter(deal => deal.is_one_for_one === true)
    });
    
    collectionList.push({
      name: "House Pour Wine",
      description: "Wine deals at happy hour prices",
      deals: allDeals.filter(deal => 
        deal.alcohol_category === "Wine" && 
        deal.is_house_pour === true
      )
    });
    
    collectionList.push({
      name: "Premium Spirits",
      description: "Top-shelf liquor deals",
      deals: allDeals.filter(deal => 
        deal.alcohol_category === "Spirits" && 
        deal.is_house_pour === false
      )
    });
    
    // Then create collections from tags
    uniqueCollections.forEach(tag => {
      // Skip if it's already a predefined collection
      if (collectionList.some(c => c.name === tag)) return;
      
      collectionList.push({
        name: tag,
        deals: allDeals.filter(deal => 
          deal.collections && 
          deal.collections.split(',').map(c => c.trim()).includes(tag)
        )
      });
    });
    
    // Get only collections with at least one deal
    const filteredCollections = collectionList.filter(collection => collection.deals.length > 0);
    
    // Sort the collections based on the specified criteria
    return filteredCollections.sort((a, b) => {
      // 1. First, prioritize collections with active deals right now
      const aHasActiveDeals = a.deals.some(deal => isDealActiveNow(deal));
      const bHasActiveDeals = b.deals.some(deal => isDealActiveNow(deal));
      
      if (aHasActiveDeals && !bHasActiveDeals) return -1;
      if (!aHasActiveDeals && bHasActiveDeals) return 1;
      
      // 2. Then, prioritize collections with deals closer to the user
      // Find minimum distance to any deal in collection A
      const aMinDistance = Math.min(
        ...a.deals.map(deal => {
          // In real app, we'd have coordinates for each establishment
          // For now, using random coordinates for demonstration
          const dealLat = 1.3521 + (Math.random() * 0.04 - 0.02);
          const dealLng = 103.8198 + (Math.random() * 0.04 - 0.02);
          return calculateDistance(location.lat, location.lng, dealLat, dealLng);
        })
      );
      
      // Find minimum distance to any deal in collection B
      const bMinDistance = Math.min(
        ...b.deals.map(deal => {
          // In real app, we'd have coordinates for each establishment
          // For now, using random coordinates for demonstration
          const dealLat = 1.3521 + (Math.random() * 0.04 - 0.02);
          const dealLng = 103.8198 + (Math.random() * 0.04 - 0.02);
          return calculateDistance(location.lat, location.lng, dealLat, dealLng);
        })
      );
      
      // If there's a significant difference in distance, prioritize closer ones
      const distanceDiff = aMinDistance - bMinDistance;
      if (Math.abs(distanceDiff) > 0.2) { // More than 200m difference
        return distanceDiff > 0 ? 1 : -1;
      }
      
      // 3. If distances are similar, sort by price
      const aMinPrice = Math.min(...a.deals.map(deal => deal.happy_hour_price));
      const bMinPrice = Math.min(...b.deals.map(deal => deal.happy_hour_price));
      
      return aMinPrice - bMinPrice;
    });
  }, [dealsData, location]);

  useEffect(() => {
    // Store the current page in sessionStorage for proper back navigation
    sessionStorage.setItem('lastVisitedPage', '/');
    console.log('Set lastVisitedPage to / in sessionStorage');
    
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
      
      {/* Inline location display as text with edit icon */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center text-sm text-gray-600 cursor-pointer pl-6 relative"
              onClick={() => {
                // Create a prompt for entering a new location
                const newLocation = prompt("Enter a new location:", userRoadName || "");
                if (newLocation && newLocation.trim()) {
                  // Update the location name immediately
                  setUserRoadName(newLocation.trim());
                  
                  // Dispatch event to update location name
                  window.dispatchEvent(new CustomEvent('postalCodeUpdated', { 
                    detail: { roadName: newLocation.trim() } 
                  }));
                  
                  // Generate random coordinates for the new location
                  const newLat = 1.3521 + (Math.random() * 0.04 - 0.02);
                  const newLng = 103.8198 + (Math.random() * 0.04 - 0.02);
                  
                  // Update location and trigger a UI refresh
                  handleLocationChange({ lat: newLat, lng: newLng });
                  
                  // Force a refresh of the deals - important for immediate visual feedback
                  console.log("Location changed to:", newLocation.trim());
                  
                  // Show a confirmation message
                  alert(`Location updated to: ${newLocation.trim()}`);
                  
                  // Force a page refresh to reflect new deals based on location
                  window.location.reload();
                }
              }}
            >
              <FiMapPin className="absolute left-0 top-1/2 transform -translate-y-1/2 h-4 w-4" />
              <span className="mr-1">{userRoadName || "Singapore"}</span>
              <FiEdit2 className="h-3 w-3 text-blue-500 inline-block" />
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="border border-gray-200 hover:bg-gray-100 rounded-lg p-2"
              style={{ background: "#f8f7f5" }}
              onClick={handleOpenFilters}
            >
              <FiFilter className="h-4 w-4 text-[#191632]" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Collections display */}
      {collections.length > 0 && (
        <div className="bg-gray-50 py-2">
          <div className="container mx-auto px-4">
            {collections.map((collection, index) => (
              <CollectionRow
                key={`${collection.name}-${index}`}
                title={collection.name}
                description={collection.description}
                deals={collection.deals}
                userLocation={location}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Regular deals list */}
      <DealsList 
        location={location} 
        activeFilter={activeFilter}
      />
      
      {/* Inline WhatsApp Contact */}
      <div 
        className="fixed bottom-20 left-0 right-0 z-50 bg-white py-3 border-t border-gray-200 shadow-sm" 
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Missing a bar or deal?
            </span>
            <button
              onClick={handleWhatsAppClick}
              className="bg-[#25D366] hover:bg-[#1da851] text-white rounded-lg px-3 py-1 flex items-center"
            >
              <FaWhatsapp className="h-4 w-4 mr-1" />
              <span className="text-sm">Suggest</span>
            </button>
          </div>
        </div>
      </div>
      
      <Navigation />
    </div>
  );
}