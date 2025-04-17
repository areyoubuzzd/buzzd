import React, { useState, useEffect, useMemo } from "react";
import Header from "@/components/layout/header";
import LocationBar from "@/components/layout/location-bar";
import FilterBar from "@/components/layout/filter-bar";
import SavingsCalculator from "@/components/savings/savings-calculator";
import Navigation from "@/components/layout/navigation";
import CollectionRow from "@/components/collections/collection-row";
// Removed import for DealsList which was using dummy data
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FiMapPin, FiEdit2, FiFilter } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";

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
    // For demonstration, let's make it deterministic based on establishment ID
    // so we can see the sorting in action more clearly
    
    // Use a consistent logic: even establishment IDs are "active now" for visualization
    // In a real app, we'd use actual date/time logic
    const isActive = deal.establishmentId % 2 === 0;
    
    if (isActive) {
      console.log(`Deal "${deal.drink_name}" from establishment ${deal.establishmentId} is ACTIVE`);
    }
    
    return isActive;
    
    /* Real implementation would look like this:
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
    */
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
  
  // Generate collections from deals data
  const collections = useMemo<Collection[]>(() => {
    if (!dealsData || dealsData.length === 0) return [];
    
    // Create a copy of the deals data to work with
    const allDeals = [...dealsData];
    
    // Define a function to check if a deal is active right now
    const isDealActiveNow = (deal: Deal): boolean => {
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ...
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDayName = days[currentDay];
      
      // Simple check - if the day name is in valid_days
      if (!deal.valid_days || !deal.valid_days.includes(currentDayName)) {
        return false;
      }
      
      // Check if current time is within happy hour
      const nowTime = now.getHours() * 100 + now.getMinutes();
      const startTime = parseInt(deal.hh_start_time.replace(':', ''));
      const endTime = parseInt(deal.hh_end_time.replace(':', ''));
      
      return nowTime >= startTime && nowTime <= endTime;
    };
    
    // Calculate distance based on establishment ID (simplified for demo)
    const calculateDistance = (establishmentId: number): number => {
      const baseDistance = (establishmentId % 10) * 0.5 + 0.1;
      const userFactor = (location.lat + location.lng) % 1;
      return baseDistance * (1 + userFactor * 0.2);
    };
    
    // Enrich deals with active status and distance
    const enrichDeals = (deals: Deal[]): (Deal & { isActive: boolean; distance: number })[] => {
      return deals.map(deal => ({
        ...deal,
        isActive: isDealActiveNow(deal),
        distance: calculateDistance(deal.establishmentId)
      }));
    };
    
    // Sort deals by active status (active first), then distance, then price
    const sortDeals = (deals: (Deal & { isActive: boolean; distance: number })[]) => {
      return [...deals].sort((a, b) => {
        // 1. Active deals first
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        
        // 2. Then by distance
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }
        
        // 3. Then by price (cheaper first)
        return (a.happy_hour_price || 999) - (b.happy_hour_price || 999);
      });
    };
    
    // The final array of collections we'll return
    const result: Collection[] = [];
    
    // Keep track of which collection names we've already used (case-insensitive)
    const usedCollectionNames = new Set<string>();
    
    // =======================================================
    // 1. Create "Active Happy Hours Nearby" collection (always first)
    // =======================================================
    
    const activeHappyHoursDeals = (() => {
      const enrichedDeals = enrichDeals(allDeals);
      
      // Filter to include only deals within 5km
      const dealsWithin5km = enrichedDeals.filter(deal => deal.distance <= 5);
      
      // Sort by active status, distance, and price
      const sortedDeals = sortDeals(dealsWithin5km);
      
      // Filter to avoid repeating restaurants
      const includedEstablishments = new Set<number>();
      const uniqueDeals: typeof sortedDeals = [];
      
      // Exception: If ALL active deals are from the same restaurant, include all of them
      const activeDeals = sortedDeals.filter(d => d.isActive);
      const allActiveFromSameRestaurant = activeDeals.length > 0 && 
        activeDeals.every(d => d.establishmentId === activeDeals[0].establishmentId);
      
      for (const deal of sortedDeals) {
        // If all active deals are from same place, include them all
        if (deal.isActive && allActiveFromSameRestaurant) {
          uniqueDeals.push(deal);
          continue;
        }
        
        // Otherwise only include one deal per restaurant
        if (!includedEstablishments.has(deal.establishmentId)) {
          uniqueDeals.push(deal);
          includedEstablishments.add(deal.establishmentId);
        }
      }
      
      // Limit to 20 deals max
      return uniqueDeals.slice(0, 20);
    })();
    
    // Only add if it has deals
    if (activeHappyHoursDeals.length > 0) {
      result.push({
        name: "Active Happy Hours Nearby",
        description: "Currently active deals closest to you",
        deals: activeHappyHoursDeals
      });
      
      // Remember we've used this name (both formats)
      usedCollectionNames.add("active happy hours nearby");
      usedCollectionNames.add("active_happy_hours_nearby");
    }
    
    // =======================================================
    // 2. Create "Beers Under $10" collection (always second)
    // =======================================================
    
    const beersUnder10Deals = (() => {
      // Filter to beer deals under $10
      const filteredDeals = allDeals.filter(deal => 
        deal.alcohol_category === "Beer" && deal.happy_hour_price < 10
      );
      
      // Enrich and sort
      return sortDeals(enrichDeals(filteredDeals));
    })();
    
    // Only add if it has deals
    if (beersUnder10Deals.length > 0) {
      result.push({
        name: "Beers Under $10",
        description: "Great beer deals under $10 near you",
        deals: beersUnder10Deals
      });
      
      // Remember we've used this name - IMPORTANT: add both forms to avoid duplicates
      usedCollectionNames.add("beers under $10");
      usedCollectionNames.add("beers_under_10");
    }
    
    // =======================================================
    // 3. Create "Cocktails Under $15" collection (always third)
    // =======================================================
    
    const cocktailsUnder15Deals = (() => {
      // Filter to cocktail deals under $15
      const filteredDeals = allDeals.filter(deal => 
        deal.alcohol_category === "Cocktail" && deal.happy_hour_price < 15
      );
      
      // Enrich and sort
      return sortDeals(enrichDeals(filteredDeals));
    })();
    
    // Only add if it has deals
    if (cocktailsUnder15Deals.length > 0) {
      result.push({
        name: "Cocktails Under $15",
        description: "Affordable cocktail deals near you",
        deals: cocktailsUnder15Deals
      });
      
      // Remember we've used this name (both formats)
      usedCollectionNames.add("cocktails under $15");
      usedCollectionNames.add("cocktails_under_15");
    }
    
    // =======================================================
    // 4. Create "1-for-1 Deals" collection (always fourth)
    // =======================================================
    
    const oneForOneDeals = (() => {
      // Filter to 1-for-1 deals
      const filteredDeals = allDeals.filter(deal => deal.is_one_for_one === true);
      
      // Enrich and sort
      return sortDeals(enrichDeals(filteredDeals));
    })();
    
    // Only add if it has deals
    if (oneForOneDeals.length > 0) {
      result.push({
        name: "1-for-1 Deals",
        description: "Buy one get one free deals near you",
        deals: oneForOneDeals
      });
      
      // Remember we've used this name (both formats)
      usedCollectionNames.add("1-for-1 deals");
      usedCollectionNames.add("one_for_one_deals");
    }
    
    // =======================================================
    // 5. Create collections for all remaining tags
    // =======================================================
    
    // Extract all unique tags from the deals' collections field
    const allTags = new Set<string>();
    
    allDeals.forEach(deal => {
      if (deal.collections) {
        deal.collections.split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)
          .forEach(tag => allTags.add(tag));
      }
    });
    
    // Create a collection for each tag (if not already used)
    const tagCollections: Collection[] = [];
    
    allTags.forEach(tag => {
      const tagLower = tag.toLowerCase();
      const tagUnderscored = tag.replace(/\s+/g, '_').toLowerCase();
      const tagSpaced = tag.replace(/_+/g, ' ').toLowerCase();
      
      // Skip if we already have a collection with this name (case insensitive)
      // Check both underscore and space formats
      if (usedCollectionNames.has(tagLower) || 
          usedCollectionNames.has(tagUnderscored) || 
          usedCollectionNames.has(tagSpaced)) {
        return;
      }
      
      // Find all deals with this tag
      const dealsWithTag = allDeals.filter(deal => 
        deal.collections && 
        deal.collections.split(',')
          .map(t => t.trim())
          .some(t => t.toLowerCase() === tag.toLowerCase())
      );
      
      // Only create collection if it has deals
      if (dealsWithTag.length > 0) {
        const enrichedDeals = enrichDeals(dealsWithTag);
        
        tagCollections.push({
          name: tag,
          description: `${tag} deals near you`,
          deals: sortDeals(enrichedDeals)
        });
        
        // Remember we've used this tag
        usedCollectionNames.add(tag.toLowerCase());
      }
    });
    
    // Sort tag collections - active deals first, then alphabetically
    const sortedTagCollections = tagCollections.sort((a, b) => {
      // Check if any deals in collection A are active
      const aHasActiveDeals = a.deals.some(deal => 
        (deal as unknown as { isActive: boolean }).isActive
      );
      
      // Check if any deals in collection B are active
      const bHasActiveDeals = b.deals.some(deal => 
        (deal as unknown as { isActive: boolean }).isActive
      );
      
      // If one has active deals but the other doesn't, show the active one first
      if (aHasActiveDeals && !bHasActiveDeals) return -1;
      if (!aHasActiveDeals && bHasActiveDeals) return 1;
      
      // Otherwise sort alphabetically
      return a.name.localeCompare(b.name);
    });
    
    // Add all tag collections after our priority collections
    result.push(...sortedTagCollections);
    
    return result;
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
    // IMPORTANT: This is the key function that updates location
    console.log("Updating location to:", newLocation);
    
    // Update the location in state which will trigger all components to re-render
    // with the new location coordinates
    setLocation(newLocation);
    
    // Reset deals data to force a refresh based on new location
    // This is key to making the location change work properly
    // In a real app with an API, we'd refetch the data with new coordinates
    queryClient.invalidateQueries({ queryKey: ['/api/deals/collections/all'] });
    
    // Simulate different number of deals
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
                  
                  // For demonstration, create deterministic coordinates based on the location name
                  // In a real app, we'd use a geocoding API to get actual coordinates
                  
                  // Generate a hash code from the location string
                  const hashCode = (str: string) => {
                    let hash = 0;
                    for (let i = 0; i < str.length; i++) {
                      hash = str.charCodeAt(i) + ((hash << 5) - hash);
                    }
                    return hash;
                  };
                  
                  // Use the hash to generate coordinates within Singapore
                  const locationHash = hashCode(newLocation.trim());
                  // Singapore latitude range: roughly 1.2655 to 1.4255 (±0.08 from center 1.3455)
                  // Singapore longitude range: roughly 103.6000 to 104.0400 (±0.22 from center 103.8200)
                  const newLat = 1.3455 + ((locationHash % 100) / 1000);  // Small variation based on name
                  const newLng = 103.8200 + ((locationHash % 100) / 500); // Wider variation for longitude
                  
                  // Show a confirmation message first
                  alert(`Location updated to: ${newLocation.trim()}`);
                  
                  // Log the change with coordinates
                  console.log(`Location changed to: ${newLocation.trim()} at coordinates: ${newLat.toFixed(6)}, ${newLng.toFixed(6)}`);
                  
                  // Update user interface with new location value
                  setLocation({ lat: newLat, lng: newLng });
                  
                  // Wait a moment before triggering the location change
                  setTimeout(() => {
                    // Update location and trigger a UI refresh
                    handleLocationChange({ lat: newLat, lng: newLng });
                    
                    // No need to reload the page - this will refresh the data automatically
                  }, 300);
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
        <motion.div 
          className="bg-gray-50 py-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="container mx-auto px-4">
            {/* Section title animation */}
            <motion.h2 
              className="text-xl font-semibold mb-4 text-gray-900 pt-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                type: "spring",
                duration: 0.6,
                delay: 0.2
              }}
            >
              Featured Collections
            </motion.h2>
            
            {/* First, render the priority collections in exact order */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.2
                  }
                }
              }}
            >
              {collections
                .filter(collection => {
                  // Normalize collection names for comparison
                  const normalizedName = collection.name.toLowerCase().replace(/[\s-_]+/g, '_');
                  return [
                    "active_happy_hours_nearby",
                    "beers_under_10", 
                    "cocktails_under_15",
                    "1_for_1_deals",
                    "one_for_one_deals"
                  ].includes(normalizedName);
                })
                .sort((a, b) => {
                  // Define the priority order with normalized names
                  const normalizeForPriority = (name: string) => {
                    const normalized = name.toLowerCase().replace(/[\s-_]+/g, '_');
                    // Special case for 1-for-1 variations
                    if (normalized === '1_for_1_deals' || normalized === 'one_for_one_deals') {
                      return 'one_for_one_deals';
                    }
                    return normalized;
                  };
                  
                  const priorityOrder = [
                    "active_happy_hours_nearby", 
                    "beers_under_10", 
                    "cocktails_under_15", 
                    "one_for_one_deals"
                  ];
                  
                  // Sort by priority index
                  return priorityOrder.indexOf(normalizeForPriority(a.name)) - 
                        priorityOrder.indexOf(normalizeForPriority(b.name));
                })
                .map((collection, index) => (
                  <motion.div
                    key={`priority-${collection.name}-${index}`}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { 
                        opacity: 1, 
                        y: 0,
                        transition: {
                          type: "spring", 
                          duration: 0.6
                        }
                      }
                    }}
                  >
                    <CollectionRow
                      title={collection.name}
                      description={collection.description}
                      deals={collection.deals}
                      userLocation={location}
                    />
                  </motion.div>
                ))
              }
            </motion.div>
            
            {/* Then, render all other collections */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.4
                  }
                }
              }}
            >
              {collections
                .filter(collection => {
                  // Normalize collection names for comparison
                  const normalizedName = collection.name.toLowerCase().replace(/[\s-_]+/g, '_');
                  return ![
                    "active_happy_hours_nearby",
                    "beers_under_10", 
                    "cocktails_under_15",
                    "1_for_1_deals",
                    "one_for_one_deals"
                  ].includes(normalizedName);
                })
                .map((collection, index) => (
                  <motion.div
                    key={`other-${collection.name}-${index}`}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { 
                        opacity: 1, 
                        y: 0,
                        transition: {
                          type: "spring", 
                          duration: 0.5
                        }
                      }
                    }}
                  >
                    <CollectionRow
                      title={collection.name}
                      description={collection.description}
                      deals={collection.deals}
                      userLocation={location}
                    />
                  </motion.div>
                ))
              }
            </motion.div>
          </div>
        </motion.div>
      )}
      
      {/* Removed regular deals list to avoid showing dummy data */}
      
      {/* Inline WhatsApp Contact */}
      <motion.div 
        className="fixed bottom-20 left-0 right-0 z-50 bg-white py-3 border-t border-gray-200 shadow-sm"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          delay: 0.5 
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <motion.span 
              className="text-sm text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Missing a bar or deal?
            </motion.span>
            <motion.button
              onClick={handleWhatsAppClick}
              className="bg-[#25D366] hover:bg-[#1da851] text-white rounded-lg px-3 py-1 flex items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                delay: 0.9,
                x: { type: "spring", stiffness: 300 }
              }}
            >
              <FaWhatsapp className="h-4 w-4 mr-1" />
              <span className="text-sm">Suggest</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
      
      <Navigation />
    </div>
  );
}