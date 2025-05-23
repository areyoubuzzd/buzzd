import React, { useState, useEffect, useMemo } from "react";
import Navigation from "@/components/layout/navigation";
import AppHeader from "@/components/layout/app-header";
import CollectionRow from "@/components/collections/collection-row";
import { CollectionsLoadingSkeleton } from "@/components/collections/collection-row-skeleton";
import { useLocation, LocationContext } from "@/contexts/location-context";
import { LocationHeader } from "@/components/location/location-header";
// Import location components with correct paths and export types
import LocationBar from "@/components/layout/location-bar";
import { LocationAutocomplete } from "@/components/location/location-autocomplete";
// Import our improved deal sorting function
import { sortDealsByActiveStatus } from "@/lib/collection-utils";
// Removed import for DealsList which was using dummy data

// Helper function to calculate string similarity between two strings
function calculateStringSimilarity(str1: string, str2: string): number {
  // Simple implementation of string similarity
  // Returns a value between 0 (completely different) and 1 (identical)
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;
  
  // Count matching characters
  let matches = 0;
  const maxLen = Math.max(str1.length, str2.length);
  const minLen = Math.min(str1.length, str2.length);
  
  for (let i = 0; i < minLen; i++) {
    if (str1[i] === str2[i]) matches++;
  }
  
  // Simple similarity score
  return matches / maxLen;
}
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FiMapPin, FiEdit2, FiFilter } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";
// Import collection utilities
import { 
  getFriendlyCollectionName, 
  getCollectionTags, 
  sortCollectionsByPriority 
} from "@/lib/collection-utils";

// Updated FilterType to match the new filter-bar component
type FilterType = 'active' | 'one-for-one' | 'high-savings' | 'beer' | 'wine' | 'whisky';

// Define Deal and Collection types
type Deal = {
  id: number;
  establishmentId: number;
  alcohol_category: string;
  alcohol_subcategory?: string | null;
  alcohol_subcategory2?: string | null;
  drink_name?: string | null;
  standard_price: number;        // From API (matches DB schema)
  happy_hour_price: number;
  savings?: number;
  savings_percentage?: number;
  valid_days: string;
  hh_start_time: string;
  hh_end_time: string;
  collections?: string | null;
  description?: string | null;
  distance?: number;
  establishment?: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    [key: string]: any;
  }
};

// Collection from API
interface ApiCollection {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  priority: number;
  active: boolean;
}

// Collection model for display
type Collection = {
  name: string;
  deals: Deal[];
  description?: string;
  slug?: string;
  priority: number; // Make priority required to enforce sorting
};

export default function HomePage() {
  // Use this for WhatsApp button so it's directly embedded in this file
  const handleWhatsAppClick = () => {
    const whatsappUrl = "https://wa.me/6587654321?text=Hello%2C%20I'd%20like%20to%20suggest%20a%20restaurant%20or%20deal%20to%20be%20added%20to%20the%20app.";
    window.open(whatsappUrl, "_blank");
  };
  
  // Store the current page in sessionStorage for proper back navigation
  useEffect(() => {
    sessionStorage.setItem('lastVisitedPage', '/');
    console.log('HomePage: Set lastVisitedPage to / in sessionStorage');
  }, []);
  
  // Get location, state setters, and other functions from global context
  const { 
    location, 
    userRoadName, 
    isUsingDefaultLocation, 
    userPosition,
    updateLocation,
    setUserRoadName,
    setIsUsingDefaultLocation 
  } = useLocation();
  
  // Create state variables for location UI
  const [isLocationSelectOpen, setIsLocationSelectOpen] = useState(false);
  const [userPostalCode, setUserPostalCode] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>('active');
  const [totalDealsFound, setTotalDealsFound] = useState<number>(30); // Total deals from API
  const [searchTerm, setSearchTerm] = useState<string>(""); // State for the search input field

  // Fetch all deals for collections with location parameters
  const { 
    data: dealsData,
    isLoading: isDealsLoading
  } = useQuery<Deal[]>({
    queryKey: ['/api/deals/collections/all', { lat: location.lat, lng: location.lng }],
    staleTime: 60000, // 1 minute
    retry: 2
  });
  
  // Fetch collections metadata from the API
  const { 
    data: apiCollections,
    isLoading: isCollectionsLoading
  } = useQuery<ApiCollection[]>({
    queryKey: ['/api/collections'],
    staleTime: 300000, // 5 minutes
    retry: 2
  });
  
  // Combined loading state
  const isLoading = isDealsLoading || isCollectionsLoading;
  
  // Helper function to check if deal is active right now (based on day and time)
  const isDealActiveNow = (deal: Deal): boolean => {
    // Don't log every deal check to avoid console flood
    const isLoggingEnabled = deal.establishmentId === 1 || deal.establishmentId === 2; 
    
    const now = new Date();
    
    // Get Singapore time - print current time for debugging (only for first few deals)
    if (isLoggingEnabled) console.log(`Current time: ${now.toLocaleString()}`);
    const sgOptions = { timeZone: 'Asia/Singapore' };
    const sgTime = new Date(now.toLocaleString('en-US', sgOptions));
    if (isLoggingEnabled) console.log(`Singapore time: ${sgTime.toLocaleString()}`);
    
    // Get day of week in Singapore time (0 = Sunday, 1 = Monday, etc.)
    const currentDay = sgTime.getDay();
    const daysMap = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday', 
      4: 'thursday',
      5: 'friday',
      6: 'saturday'
    };
    const currentDayName = daysMap[currentDay as keyof typeof daysMap];
    console.log(`Current day: ${currentDayName}`);
    
    // Check if today is in the valid days (case insensitive)
    const validDaysLower = deal.valid_days.toLowerCase();
    console.log(`Deal ${deal.id} (${deal.drink_name}) valid days: "${validDaysLower}"`);
    
    // Special logging for Moon Rooftop Bar deals
    if (deal.establishmentId === 11) {
      console.log(`MOON DEAL CHECK: ${deal.drink_name}, valid_days: ${validDaysLower}, start: ${deal.hh_start_time}, end: ${deal.hh_end_time}`);
    }
    
    // Check for "all days" or day ranges like "mon-fri"
    let dayMatches = false;
    
    // Case 1: Direct matches for "all days" or "everyday"
    if (validDaysLower === 'all days' || 
        validDaysLower.includes('everyday') || 
        validDaysLower.includes('all')) {
      dayMatches = true;
    } 
    // Case 2: Exact day name is included
    else if (validDaysLower.includes(currentDayName)) {
      dayMatches = true;
    }
    // Case 3: Check for day ranges like "mon-fri", "mon-thu", etc.
    else if (validDaysLower.includes('-')) {
      const dayParts = validDaysLower.split('-');
      if (dayParts.length === 2) {
        // Get numeric day values
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const startDayValue = days.findIndex(d => dayParts[0].trim().toLowerCase().startsWith(d));
        const endDayValue = days.findIndex(d => dayParts[1].trim().toLowerCase().startsWith(d));
        const currentDayValue = currentDay;
        
        if (startDayValue !== -1 && endDayValue !== -1) {
          // Check if current day is within range
          dayMatches = currentDayValue >= startDayValue && currentDayValue <= endDayValue;
          console.log(`Range check: ${startDayValue} <= ${currentDayValue} <= ${endDayValue} => ${dayMatches}`);
        }
      }
    }
    
    if (!dayMatches) {
      console.log(`Deal ${deal.id} is NOT active: day (${currentDayName}) not in valid days (${validDaysLower})`);
      return false;
    }
    
    // Current time in 24-hour format (e.g., 1430 for 2:30pm)
    const currentHours = sgTime.getHours();
    const currentMinutes = sgTime.getMinutes();
    const currentTimeValue = currentHours * 100 + currentMinutes;
    console.log(`Current time value: ${currentTimeValue}`);
    
    // Parse start time, handling both "14:30" and "1430" formats
    let startTimeValue = 0;
    try {
      if (deal.hh_start_time.includes(':')) {
        const [startHours, startMinutes] = deal.hh_start_time.split(':').map(n => parseInt(n, 10));
        startTimeValue = startHours * 100 + startMinutes;
      } else {
        startTimeValue = parseInt(deal.hh_start_time, 10);
      }
      console.log(`Start time raw: "${deal.hh_start_time}", parsed: ${startTimeValue}`);
    } catch (e) {
      console.warn(`Error parsing start time "${deal.hh_start_time}" for deal ${deal.id}:`, e);
      return false;
    }
    
    // Parse end time, handling both "19:00" and "1900" formats
    let endTimeValue = 0;
    try {
      if (deal.hh_end_time.includes(':')) {
        const [endHours, endMinutes] = deal.hh_end_time.split(':').map(n => parseInt(n, 10));
        endTimeValue = endHours * 100 + endMinutes;
      } else {
        endTimeValue = parseInt(deal.hh_end_time, 10);
      }
      console.log(`End time raw: "${deal.hh_end_time}", parsed: ${endTimeValue}`);
    } catch (e) {
      console.warn(`Error parsing end time "${deal.hh_end_time}" for deal ${deal.id}:`, e);
      return false;
    }
    
    // Check if current time is within happy hour
    const isActive = currentTimeValue >= startTimeValue && currentTimeValue <= endTimeValue;
    
    if (isActive) {
      console.log(`Deal "${deal.drink_name}" from establishment ${deal.establishmentId} is ACTIVE (${currentTimeValue} is between ${startTimeValue} and ${endTimeValue})`);
      
      // Special logging for Moon Rooftop Bar deals
      if (deal.establishmentId === 11) {
        console.log(`MOON DEAL ACTIVE: ${deal.drink_name} is ACTIVE!`);
      }
    } else {
      console.log(`Deal "${deal.drink_name}" is NOT active: time ${currentTimeValue} is NOT between ${startTimeValue} and ${endTimeValue}`);
    }
    
    // Return whether the deal is active now
    return isActive;
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
  
  // Helper to create a slug from a collection name
  const slugify = (name: string): string => {
    return name.toLowerCase()
      .replace(/[\s-]+/g, '_')
      .replace(/[^\w-]+/g, '');
  };
  
  // Generate collections from deals data and API collections
  const collections = useMemo<Collection[]>(() => {
    if (!dealsData || dealsData.length === 0) return [];
    
    // Create a copy of the deals data to work with
    const allDeals = [...dealsData];
    
    console.log("API Collections available:", apiCollections?.map(c => 
      `${c.name} (slug: ${c.slug}, priority: ${c.priority})`));
    
    // Reuse the existing isDealActiveNow function from above
    
    // Calculate distance based on establishment location data if distance is not already provided
    const calculateDistance = (deal: Deal): number => {
      // First check if the deal has a distance property from the server
      if ('distance' in deal && typeof deal.distance === 'number') {
        return deal.distance;
      }
      
      // If no server-provided distance, calculate based on client data
      // Get establishment coordinates
      const est = deal.establishment;
      if (est && est.latitude && est.longitude) {
        // Special logging for Moon Rooftop Bar
        if (deal.establishmentId === 11) {
          console.log(`MOON ROOFTOP BAR: Calculating distance - Your location: ${location.lat},${location.lng}, Bar location: ${est.latitude},${est.longitude}`);
        }
        
        // Calculate haversine distance
        const calcDistance = calculateHaversineDistance(
          location.lat, location.lng,
          est.latitude, est.longitude
        );
        
        // Special logging for Moon Rooftop Bar
        if (deal.establishmentId === 11) {
          console.log(`MOON ROOFTOP BAR: Calculated distance = ${calcDistance.toFixed(2)} km`);
        }
        
        return calcDistance;
      }
      
      // Fallback if no proper coordinates
      const baseDistance = (deal.establishmentId % 10) * 0.5 + 0.1;
      const userFactor = (location.lat + location.lng) % 1;
      return baseDistance * (1 + userFactor * 0.2);
    };
    
    // Calculate haversine distance between two points in km
    const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Radius of the earth in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c; // Distance in km
      return distance;
    };
    
    // Enrich deals with active status and distance
    const enrichDeals = (deals: Deal[]): (Deal & { isActive: boolean; distance: number })[] => {
      return deals.map(deal => ({
        ...deal,
        isActive: isDealActiveNow(deal),
        distance: calculateDistance(deal)
      }));
    };
    
    // CRITICAL FIX: Enhanced sort deals function that GUARANTEES active deals come first
    const sortDeals = (deals: (Deal & { isActive: boolean; distance: number })[]) => {
      // First ensure all deals have up-to-date isActive flag
      const dealsWithCurrentActiveStatus = deals.map(deal => ({
        ...deal,
        // Force recalculation of active status to ensure it's accurate
        isActive: isDealActiveNow(deal)
      }));
      
      // Print debug info
      const activeDeals = dealsWithCurrentActiveStatus.filter(d => d.isActive);
      const inactiveDeals = dealsWithCurrentActiveStatus.filter(d => !d.isActive);
      console.log(`Sorting ${deals.length} deals: ${activeDeals.length} active, ${inactiveDeals.length} inactive`);
      
      // Use the common utility function to ensure consistent sorting across the app
      // This guarantees active deals always appear first, then sorted by distance and price
      return sortDealsByActiveStatus(dealsWithCurrentActiveStatus);
    };
    
    // The final array of collections we'll return
    const result: Collection[] = [];
    
    // Keep track of which collection names we've already used (case-insensitive)
    const usedCollectionNames = new Set<string>();
    
    // Map of API collection slugs to match them with appropriate deals
    const apiCollectionMap = new Map<string, ApiCollection>();
    
    // Build a map of API collections for easy lookup by slug
    if (apiCollections && apiCollections.length > 0) {
      // Log available API collections
      console.log("Available API collections:", apiCollections.map(c => c.name).join(", "));
      
      // Create a map for quick slug lookup
      apiCollections.forEach(collection => {
        apiCollectionMap.set(collection.slug, collection);
      });
    }
    
    // =======================================================
    // 1. Create "Happy Hours Nearby" collection (always first)
    // =======================================================
    
    const activeHappyHoursDeals = (() => {
      console.log('Generating Happy Hours Nearby using enhanced 6-step logic with prioritized active_happy_hours collection');
      const enrichedDeals = enrichDeals(allDeals);
      
      // Debug logging
      if (enrichedDeals.length === 0) {
        console.log(`WARNING: No deals found at all in API response`);
      } else {
        console.log(`Received ${enrichedDeals.length} deals from API`);
        
        // Log establishment IDs in the response
        const establishmentIds = Array.from(new Set(enrichedDeals.map(d => d.establishmentId)));
        console.log(`Establishment IDs in response: ${establishmentIds.join(', ')}`);
      }
      
      // ABSOLUTELY CRITICAL FIX - STEP 0: ALWAYS use active_happy_hours collection deals
      // This step guarantees we use the 25 deals added by post-data-refresh.ts script
      const collectionDeals = enrichedDeals.filter(deal => {
        const collectionTags = getCollectionTags(deal);
        return collectionTags.includes('active_happy_hours');
      });
      
      console.log(`Step 0: Found ${collectionDeals.length} deals with active_happy_hours collection tag`);
      
      // ALWAYS use the active_happy_hours collection as the source of truth
      // This ensures we consistently show the same deals regardless of other factors
      if (collectionDeals.length > 0) {
        console.log('CRITICAL FIX: Using active_happy_hours collection deals exclusively');
        // Sort these by active status first, then by distance, then by price
        return sortDeals(collectionDeals);
      }
      
      // If we have some but not enough, continue with normal logic and combine at the end
      console.log(`Found some active_happy_hours deals (${collectionDeals.length}) but not enough, continuing with normal logic`);
      
      // STEP 1: First search for restaurants within 5KM radius of user's location
      const dealsWithin5km = enrichedDeals.filter(deal => deal.distance <= 5);
      console.log(`Step 1: Found ${dealsWithin5km.length} deals within 5km radius`);
      
      // Group deals by establishment to track restaurants (not individual deals)
      const establishmentsWithin5km = new Map<number, typeof enrichedDeals>();
      dealsWithin5km.forEach(deal => {
        if (!establishmentsWithin5km.has(deal.establishmentId)) {
          establishmentsWithin5km.set(deal.establishmentId, []);
        }
        establishmentsWithin5km.get(deal.establishmentId)?.push(deal);
      });
      console.log(`Step 1: Found ${establishmentsWithin5km.size} restaurants within 5km radius`);
      
      // STEP 2: Only include restaurants if today is a happy hour day
      const restaurantsWithHappyHourToday = Array.from(establishmentsWithin5km.entries())
        .filter(([_, deals]) => {
          // A restaurant has a happy hour today if any of its deals are valid today
          return deals.some(deal => {
            const validDaysLower = deal.valid_days.toLowerCase();
            const now = new Date();
            const sgOptions = { timeZone: 'Asia/Singapore' };
            const sgTime = new Date(now.toLocaleString('en-US', sgOptions));
            const currentDay = sgTime.getDay();
            const daysMap = {
              0: 'sunday',
              1: 'monday',
              2: 'tuesday',
              3: 'wednesday', 
              4: 'thursday',
              5: 'friday',
              6: 'saturday'
            };
            const currentDayName = daysMap[currentDay as keyof typeof daysMap];
            
            // Check for day matches
            let dayMatches = false;
            
            // Case 1: Direct matches for "all days" or "everyday"
            if (validDaysLower === 'all days' || 
                validDaysLower.includes('everyday') || 
                validDaysLower.includes('all')) {
              dayMatches = true;
            } 
            // Case 2: Exact day name is included
            else if (validDaysLower.includes(currentDayName)) {
              dayMatches = true;
            }
            // Case 3: Check for day ranges like "mon-fri", "mon-thu", etc.
            else if (validDaysLower.includes('-')) {
              const dayParts = validDaysLower.split('-');
              if (dayParts.length === 2) {
                // Get numeric day values
                const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                const startDayValue = days.findIndex(d => dayParts[0].trim().toLowerCase().startsWith(d));
                const endDayValue = days.findIndex(d => dayParts[1].trim().toLowerCase().startsWith(d));
                
                if (startDayValue !== -1 && endDayValue !== -1) {
                  // Check if current day is within range
                  dayMatches = currentDay >= startDayValue && currentDay <= endDayValue;
                }
              }
            }
            
            return dayMatches;
          });
        });
      
      console.log(`Step 2: Found ${restaurantsWithHappyHourToday.length} restaurants with happy hours today`);
      
      // STEP 3: Look for restaurants within happy hour time window
      const restaurantsWithActiveHappyHour = restaurantsWithHappyHourToday
        .filter(([_, deals]) => {
          // A restaurant has an active happy hour if any of its deals are active now
          return deals.some(deal => isDealActiveNow(deal));
        });
      
      console.log(`Step 3: Found ${restaurantsWithActiveHappyHour.length} restaurants with active happy hours`);
      
      // Create a final list of deals from restaurants with active happy hours
      let activeDealsFromActiveRestaurants: typeof enrichedDeals = [];
      restaurantsWithActiveHappyHour.forEach(([_, deals]) => {
        activeDealsFromActiveRestaurants = activeDealsFromActiveRestaurants.concat(deals);
      });
      
      // STEP 4: If fewer than 2 active restaurants found, expand search to 10KM
      if (restaurantsWithActiveHappyHour.length < 2) {
        console.log(`Step 4: Not enough active restaurants (${restaurantsWithActiveHappyHour.length}), expanding to 10km`);
        
        // Expand to 10km
        const dealsWithin10km = enrichedDeals.filter(deal => deal.distance > 5 && deal.distance <= 10);
        console.log(`Step 4: Found ${dealsWithin10km.length} additional deals within 5-10km radius`);
        
        // Group by establishment
        const establishmentsWithin10km = new Map<number, typeof enrichedDeals>();
        dealsWithin10km.forEach(deal => {
          if (!establishmentsWithin10km.has(deal.establishmentId)) {
            establishmentsWithin10km.set(deal.establishmentId, []);
          }
          establishmentsWithin10km.get(deal.establishmentId)?.push(deal);
        });
        
        // Filter for today's happy hours
        const restaurants10kmWithHappyHourToday = Array.from(establishmentsWithin10km.entries())
          .filter(([_, deals]) => {
            return deals.some(deal => {
              const validDaysLower = deal.valid_days.toLowerCase();
              const now = new Date();
              const sgOptions = { timeZone: 'Asia/Singapore' };
              const sgTime = new Date(now.toLocaleString('en-US', sgOptions));
              const currentDay = sgTime.getDay();
              const daysMap = {
                0: 'sunday',
                1: 'monday',
                2: 'tuesday',
                3: 'wednesday', 
                4: 'thursday',
                5: 'friday',
                6: 'saturday'
              };
              const currentDayName = daysMap[currentDay as keyof typeof daysMap];
              
              let dayMatches = false;
              if (validDaysLower === 'all days' || validDaysLower.includes('everyday') || validDaysLower.includes('all')) {
                dayMatches = true;
              } else if (validDaysLower.includes(currentDayName)) {
                dayMatches = true;
              } else if (validDaysLower.includes('-')) {
                const dayParts = validDaysLower.split('-');
                if (dayParts.length === 2) {
                  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                  const startDayValue = days.findIndex(d => dayParts[0].trim().toLowerCase().startsWith(d));
                  const endDayValue = days.findIndex(d => dayParts[1].trim().toLowerCase().startsWith(d));
                  if (startDayValue !== -1 && endDayValue !== -1) {
                    dayMatches = currentDay >= startDayValue && currentDay <= endDayValue;
                  }
                }
              }
              return dayMatches;
            });
          });
        
        // Filter for active happy hours
        const restaurants10kmWithActiveHappyHour = restaurants10kmWithHappyHourToday
          .filter(([_, deals]) => {
            return deals.some(deal => isDealActiveNow(deal));
          });
        
        console.log(`Step 4: Found ${restaurants10kmWithActiveHappyHour.length} additional restaurants with active happy hours in 5-10km radius`);
        
        // Add these deals to our collection
        restaurants10kmWithActiveHappyHour.forEach(([_, deals]) => {
          activeDealsFromActiveRestaurants = activeDealsFromActiveRestaurants.concat(deals);
        });
      }
      
      // STEP 5: Force sorting with active deals first using our improved sortDeals function
      console.log(`Step 5: Sorting ${activeDealsFromActiveRestaurants.length} deals from happy hour restaurants`);
      
      // Debug which deals are active right now
      const activeDealsCount = activeDealsFromActiveRestaurants.filter(deal => isDealActiveNow(deal)).length;
      console.log(`Step 5: Found ${activeDealsCount} currently active deals out of ${activeDealsFromActiveRestaurants.length} total`);
      
      // CRITICAL FIX: Force-sort ALL deals from restaurants with active happy hours
      // This ensures we show ACTIVE deals first, then inactive ones by distance
      const sortedDeals = sortDeals(activeDealsFromActiveRestaurants);
      
      // Log the top 5 deals to verify active deals are first
      console.log("TOP 5 SORTED DEALS:");
      sortedDeals.slice(0, 5).forEach((deal, i) => {
        const isActive = isDealActiveNow(deal);
        console.log(`Deal #${i+1}: ${deal.drink_name} from establishment ${deal.establishmentId} - ACTIVE: ${isActive}, Distance: ${deal.distance.toFixed(2)}km`);
      });
      
      console.log(`Step 5: Sorted ${sortedDeals.length} deals by active status and distance`);
      
      // STEP 6: First prioritize deals that are explicitly in the active_happy_hours collection,
      // then augment with our computed active deals to reach a total of 25
      const finalDeals = [...collectionDeals];
      
      // Now add sorted deals that are not already in the collection
      for (const deal of sortedDeals) {
        // Skip if the deal is already in finalDeals (from collectionDeals)
        if (!finalDeals.some(d => d.id === deal.id)) {
          finalDeals.push(deal);
          // Stop once we have 25 deals
          if (finalDeals.length >= 25) break;
        }
      }
      
      // Final sort to ensure active deals come first
      return sortDeals(finalDeals).slice(0, 25);
    })();
    
    // Now ALWAYS add the Active Happy Hours directly as the first collection
    // This is critical to ensure it always appears in the correct position
    if (activeHappyHoursDeals.length > 0) {
      result.push({
        name: "Happy Hours Nearby",
        description: "Active happy hour deals near your location",
        deals: activeHappyHoursDeals,
        priority: 1 // Highest priority - always first
      });
      
      // Remember we've used this name (both formats)
      usedCollectionNames.add("happy hours nearby");
      usedCollectionNames.add("happy_hours_nearby");
      usedCollectionNames.add("active_happy_hours");
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
        deals: beersUnder10Deals,
        priority: 10 // Medium-high priority
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
        deals: cocktailsUnder15Deals,
        priority: 20 // Medium priority
      });
      
      // Remember we've used this name (both formats)
      usedCollectionNames.add("cocktails under $15");
      usedCollectionNames.add("cocktails_under_15");
    }
    
    // =======================================================
    // 4. Create "1-for-1 Deals" collection (always fourth)
    // =======================================================
    
    const oneForOneDeals = (() => {
      // Filter to 1-for-1 deals based on collections or alcohol_subcategory
      const filteredDeals = allDeals.filter(deal => 
        (deal.collections && deal.collections.includes("1-for-1_deal")) ||
        (deal.alcohol_subcategory && deal.alcohol_subcategory.toLowerCase().includes("1-for-1"))
      );
      
      // Enrich and sort
      return sortDeals(enrichDeals(filteredDeals));
    })();
    
    // Only add if it has deals
    if (oneForOneDeals.length > 0) {
      result.push({
        name: "1-for-1 Deals",
        description: "Buy one get one free deals near you",
        deals: oneForOneDeals,
        priority: 15 // Higher priority for promotional deals
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
        
        // Determine appropriate priority for this tag-based collection
        const apiCollection = apiCollectionMap.get(tag.toLowerCase().replace(/\s+/g, '_'));
        const priority = apiCollection?.priority || (() => {
          // Assign priority based on tag name if no API collection exists
          const tagLower = tag.toLowerCase();
          if (tagLower.includes('active') || tagLower.includes('happy hour')) return 1;
          if (tagLower.includes('under $10') || tagLower.includes('under $12')) return 10;
          if (tagLower.includes('craft beer')) return 12;
          if (tagLower.includes('1-for-1') || tagLower.includes('one for one')) return 15;
          if (tagLower.includes('free flow')) return 16;
          if (tagLower.includes('bottle')) return 17;
          if (tagLower.includes('under $15')) return 20;
          if (tagLower.includes('signature')) return 21;
          if (tagLower.includes('bucket')) return 23;
          if (tagLower.includes('whisky')) return 40;
          if (tagLower.includes('gin')) return 41;
          if (tagLower.includes('cbd')) return 60;
          if (tagLower.includes('orchard')) return 61;
          if (tagLower.includes('holland')) return 62;
          return 50; // Default priority
        })();
        
        tagCollections.push({
          name: tag,
          description: `${tag} deals near you`,
          deals: sortDeals(enrichedDeals),
          priority // Add the priority to the collection object
        });
        
        // Remember we've used this tag
        usedCollectionNames.add(tag.toLowerCase());
      }
    });
    
    // Generate collections from API-provided collection data
    const apiBasedCollections: Collection[] = [];
    
    // Only try to generate API-based collections if we have apiCollections data
    if (apiCollections && apiCollections.length > 0 && apiCollectionMap.size > 0) {
      console.log("Generating collections from API data with priority order");
      
      // Sort API collections by priority value (ascending)
      const sortedApiCollections = [...apiCollections].sort((a, b) => a.priority - b.priority);
      
      // For each collection in the API, try to create a matching collection
      for (const apiCollection of sortedApiCollections) {
        // Skip inactive collections
        if (!apiCollection.active) {
          console.log(`Skipping inactive collection: ${apiCollection.name}`);
          continue;
        }
        
        // Skip if we already have a collection with this name (case insensitive)
        const collectionNameLower = apiCollection.name.toLowerCase();
        if (usedCollectionNames.has(collectionNameLower)) {
          console.log(`Skipping duplicate collection: ${apiCollection.name}`);
          continue;
        }
        
        // Create a filter function to find deals for this collection
        const getDealsForCollection = (): Deal[] => {
          const slug = apiCollection.slug;
          
          // Different slugs need different filtering logic
          if (slug === 'active_happy_hours') {
            // Already handled with activeHappyHoursDeals
            return [];
          }
          
          if (slug === 'all_deals') {
            // Return all deals up to 50
            const sortedAllDeals = sortDeals(enrichDeals(allDeals));
            return sortedAllDeals.slice(0, 50);
          }
          
          if (slug === 'beers_under_12') {
            // Filter to beer deals under $12
            return sortDeals(enrichDeals(allDeals.filter(deal => 
              deal.alcohol_category.toLowerCase() === "beer" && deal.happy_hour_price < 12
            )));
          }
          
          if (slug === 'beers_under_15') {
            // Filter to beer deals under $15
            return sortDeals(enrichDeals(allDeals.filter(deal => 
              deal.alcohol_category.toLowerCase() === "beer" && deal.happy_hour_price < 15
            )));
          }
          
          if (slug === 'craft_beers') {
            // Filter to craft beers
            return sortDeals(enrichDeals(allDeals.filter(deal => 
              deal.alcohol_category.toLowerCase() === "beer" && 
              deal.alcohol_subcategory?.toLowerCase().includes('craft') 
            )));
          }
          
          if (slug === 'beer_buckets_under_40') {
            // Filter to beer buckets under $40
            return sortDeals(enrichDeals(allDeals.filter(deal => 
              deal.alcohol_category.toLowerCase() === "beer" && 
              deal.alcohol_subcategory?.toLowerCase().includes('bucket') &&
              deal.happy_hour_price < 40
            )));
          }
          
          if (slug === 'wines_under_12') {
            // Filter to wine deals under $12
            return sortDeals(enrichDeals(allDeals.filter(deal => 
              deal.alcohol_category.toLowerCase() === "wine" && deal.happy_hour_price < 12
            )));
          }
          
          if (slug === 'wines_under_15') {
            // Filter to wine deals under $15 
            return sortDeals(enrichDeals(allDeals.filter(deal => 
              deal.alcohol_category.toLowerCase() === "wine" && deal.happy_hour_price < 15
            )));
          }
          
          if (slug === 'bottles_under_100') {
            // Filter to bottle deals under $100
            return sortDeals(enrichDeals(allDeals.filter(deal => 
              deal.alcohol_subcategory?.toLowerCase().includes('bottle') && 
              deal.happy_hour_price < 100
            )));
          }
          
          if (slug === 'cocktails_under_12') {
            // Filter to cocktail deals under $12
            return sortDeals(enrichDeals(allDeals.filter(deal => 
              deal.alcohol_category.toLowerCase() === "cocktail" && deal.happy_hour_price < 12
            )));
          }
          
          if (slug === 'cocktails_under_15') {
            // Filter to cocktail deals under $15
            return sortDeals(enrichDeals(allDeals.filter(deal => 
              deal.alcohol_category.toLowerCase() === "cocktail" && deal.happy_hour_price < 15
            )));
          }
          
          if (slug === 'signature_cocktails') {
            // Filter to signature cocktails
            return sortDeals(enrichDeals(allDeals.filter(deal => 
              deal.alcohol_category.toLowerCase() === "cocktail" && 
              deal.alcohol_subcategory?.toLowerCase().includes('signature')
            )));
          }
          
          if (slug === 'whisky_deals') {
            // Filter to whisky deals
            return sortDeals(enrichDeals(allDeals.filter(deal => 
              deal.alcohol_category.toLowerCase() === "spirits" && 
              (deal.alcohol_subcategory?.toLowerCase().includes('whisky') ||
               deal.alcohol_subcategory?.toLowerCase().includes('whiskey'))
            )));
          }
          
          if (slug === 'gin_deals') {
            // Filter to gin deals
            return sortDeals(enrichDeals(allDeals.filter(deal => 
              deal.alcohol_category.toLowerCase() === "spirits" && 
              deal.alcohol_subcategory?.toLowerCase().includes('gin')
            )));
          }
          
          if (slug === 'one_for_one_deals') {
            // Filter to 1-for-1 deals
            return sortDeals(enrichDeals(allDeals.filter(deal => 
              (deal.collections && deal.collections.includes("1-for-1_deal")) ||
              (deal.alcohol_subcategory && deal.alcohol_subcategory.toLowerCase().includes("1-for-1"))
            )));
          }
          
          if (slug === 'free_flow_deals') {
            // Filter to free flow deals
            return sortDeals(enrichDeals(allDeals.filter(deal => 
              (deal.collections && deal.collections.includes("free_flow")) ||
              (deal.alcohol_subcategory && deal.alcohol_subcategory.toLowerCase().includes("free flow"))
            )));
          }
          
          if (slug === 'two_bottle_discounts') {
            // Filter to two bottle discount deals
            return sortDeals(enrichDeals(allDeals.filter(deal => 
              (deal.collections && deal.collections.includes("two_bottle_discount")) ||
              (deal.alcohol_subcategory && deal.alcohol_subcategory.toLowerCase().includes("two bottle"))
            )));
          }
          
          // For location-specific collections, we'd need establishment data
          // Let's try to do our best based on the collections field
          
          // Default case - check if any deals have this collection tag
          return sortDeals(enrichDeals(allDeals.filter(deal => 
            deal.collections && 
            deal.collections.split(',')
              .map(t => t.trim().toLowerCase())
              .some(t => t === slug)
          )));
        };
        
        // Get deals for this collection
        const dealsForCollection = getDealsForCollection();
        
        // Only add collection if it has deals
        if (dealsForCollection.length > 0) {
          apiBasedCollections.push({
            name: getFriendlyCollectionName(apiCollection.slug),
            description: apiCollection.description,
            slug: apiCollection.slug,
            priority: apiCollection.priority,
            deals: dealsForCollection
          });
          
          // Mark this collection name as used
          usedCollectionNames.add(apiCollection.name.toLowerCase());
          usedCollectionNames.add(apiCollection.slug.toLowerCase());
        }
      }
    }
    
    // We'll now create collections based on the API collections and matching the tags in deals
  
  // If we have API collections data, use it as the primary source for organizing deals
  if (apiCollections && apiCollections.length > 0) {
    console.log(`Using ${apiCollections.length} collections from the API`);
    
    // Sort API collections by priority (ascending)
    const sortedApiCollections = [...apiCollections].sort((a, b) => a.priority - b.priority);
    
    // For each API collection, create a matching collection with deals
    for (const apiCollection of sortedApiCollections) {
      // Skip inactive collections
      if (!apiCollection.active) {
        console.log(`Skipping inactive collection: ${apiCollection.name}`);
        continue;
      }
      
      // Handle special collections
      if (apiCollection.slug === 'active_happy_hours') {
        // We already have Active Happy Hours collection
        if (result.some(c => c.name.toLowerCase().includes('active happy'))) {
          console.log('Skipping Active Happy Hours - already created');
          continue;
        }
      }
      
      // Get deals for this collection
      let dealsForCollection: Deal[] = [];
      
      if (apiCollection.slug === 'all_deals') {
        // For all deals, just include all deals up to 50
        const sortedAllDeals = sortDeals(enrichDeals(allDeals));
        dealsForCollection = sortedAllDeals.slice(0, 50);
      } else if (apiCollection.slug === 'active_happy_hours') {
        // For active happy hours, use the existing active deals logic
        // This is already handled in the activeHappyHoursDeals calculation
        dealsForCollection = activeHappyHoursDeals;
      } else {
        // For other collections, filter deals by matching the collection tag
        dealsForCollection = allDeals.filter(deal => 
          deal.collections && 
          getCollectionTags(deal).includes(apiCollection.slug)
        );
        
        // Enrich and sort these deals
        if (dealsForCollection.length > 0) {
          dealsForCollection = sortDeals(enrichDeals(dealsForCollection));
        }
      }
      
      // Only add the collection if it has deals
      if (dealsForCollection.length > 0) {
        result.push({
          name: getFriendlyCollectionName(apiCollection.slug),
          description: apiCollection.description || `${getFriendlyCollectionName(apiCollection.slug)} deals near you`,
          deals: dealsForCollection,
          slug: apiCollection.slug,
          priority: apiCollection.priority
        });
      } else {
        console.log(`Collection ${apiCollection.name} has no deals, skipping`);
      }
    }
    
    // Sort result by priority again to ensure correct order
    result.sort((a, b) => {
      const aPriority = (a as any).priority || 999;
      const bPriority = (b as any).priority || 999;
      return aPriority - bPriority;
    });
    
  } else {
    // We don't have API collections, use tag-based collections as fallback
    
    // Sort tag collections - by priority, active deals, then name
    const sortedTagCollections = tagCollections.sort((a, b) => {
      // First try to sort by collection priority using the slugified name
      const collectionA = apiCollectionMap.get(slugify(a.name));
      const collectionB = apiCollectionMap.get(slugify(b.name));
      
      // Get priorities or assign default priority based on collection name
      const getPriority = (name: string, apiCollection: ApiCollection | undefined): number => {
        if (apiCollection?.priority !== undefined) return apiCollection.priority;
        
        // Default priorities based on name patterns (consistent with API priorities)
        const nameLower = name.toLowerCase();
        if (nameLower.includes('active') || nameLower.includes('happy hour')) return 1;
        if (nameLower.includes('under $10') || nameLower.includes('under $12')) return 10;
        if (nameLower.includes('craft beer')) return 12;
        if (nameLower.includes('1-for-1') || nameLower.includes('one for one')) return 15;
        if (nameLower.includes('free flow')) return 16;
        if (nameLower.includes('two bottle')) return 17;
        if (nameLower.includes('under $15')) return 20;
        if (nameLower.includes('signature')) return 21;
        if (nameLower.includes('bucket')) return 23;
        if (nameLower.includes('whisky')) return 40;
        if (nameLower.includes('gin')) return 41;
        
        // Check for region-based collections
        if (nameLower.includes('cbd')) return 60;
        if (nameLower.includes('orchard')) return 61;
        if (nameLower.includes('holland village')) return 62;
        
        // Default priority
        return 50;
      };
      
      const aPriority = getPriority(a.name, collectionA);
      const bPriority = getPriority(b.name, collectionB);
      
      // If priorities differ, use them for sorting
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // If priorities are the same, check if deals are active
      const aHasActiveDeals = a.deals.some(deal => 
        (deal as unknown as { isActive: boolean }).isActive
      );
      
      const bHasActiveDeals = b.deals.some(deal => 
        (deal as unknown as { isActive: boolean }).isActive
      );
      
      // If one has active deals but the other doesn't, show the active one first
      if (aHasActiveDeals && !bHasActiveDeals) return -1;
      if (!aHasActiveDeals && bHasActiveDeals) return 1;
      
      // If active status is the same, sort alphabetically
      return a.name.localeCompare(b.name);
    });
    
    // Add all tag collections
    result.push(...sortedTagCollections);
  }
    
    // ABSOLUTELY CRITICAL FIX: Create a new array with "Happy Hours Nearby" manually placed first
    // This approach guarantees it's always first by avoiding any sorting whatsoever
    let sortedResult = [];
    
    // First, manually find and add the Happy Hours Nearby collection
    const happyHoursCollection = result.find(c => c.name === "Happy Hours Nearby");
    if (happyHoursCollection) {
      // CRITICAL FIX: Ensure Happy Hours Nearby always has at least 25 deals
      // For active_happy_hours, directly fetch fresh data if needed
      if (happyHoursCollection.deals.length < 25) {
        console.log(`FIXING ISSUE: Happy Hours Nearby only has ${happyHoursCollection.deals.length} deals, should have 25`);
        
        // Use a direct API call to get all active_happy_hours deals
        fetch('/api/deals/collections/active_happy_hours')
          .then(res => res.json())
          .then(deals => {
            console.log(`Received ${deals.length} deals from active_happy_hours collection API`);
            
            if (deals.length > 0) {
              // Update the deals in this collection
              happyHoursCollection.deals = deals;
              console.log(`Updated Happy Hours Nearby with ${deals.length} deals`);
            }
          })
          .catch(err => {
            console.error('Error fetching active_happy_hours deals:', err);
          });
      }
      
      sortedResult.push(happyHoursCollection);
      
      // Then sort all other collections by priority
      const otherCollections = result.filter(c => c.name !== "Happy Hours Nearby")
        .sort((a, b) => {
          // Sort by priority first
          const aPriority = a.priority || 999;
          const bPriority = b.priority || 999;
          
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          
          // For same priority, sort active collections first
          const aHasActiveDeals = a.deals.some(deal => isDealActiveNow(deal));
          const bHasActiveDeals = b.deals.some(deal => isDealActiveNow(deal));
          
          if (aHasActiveDeals && !bHasActiveDeals) return -1;
          if (!aHasActiveDeals && bHasActiveDeals) return 1;
          
          // Finally sort by name
          return a.name.localeCompare(b.name);
        });
      
      // Add all other collections after Happy Hours Nearby
      sortedResult = [...sortedResult, ...otherCollections];
    } else {
      // If Happy Hours Nearby doesn't exist (which shouldn't happen), just sort everything
      console.error("CRITICAL ERROR: Happy Hours Nearby collection not found!");
      sortedResult = [...result].sort((a, b) => {
        // Apply the same sorting logic as above
        const aPriority = a.priority || 999;
        const bPriority = b.priority || 999;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        const aHasActiveDeals = a.deals.some(deal => isDealActiveNow(deal));
        const bHasActiveDeals = b.deals.some(deal => isDealActiveNow(deal));
        
        if (aHasActiveDeals && !bHasActiveDeals) return -1;
        if (!aHasActiveDeals && bHasActiveDeals) return 1;
        
        return a.name.localeCompare(b.name);
      });
    }
    
    // Verify the first collection is Happy Hours Nearby
    if (sortedResult.length > 0 && sortedResult[0].name !== "Happy Hours Nearby") {
      console.error("CRITICAL ERROR: First collection is not Happy Hours Nearby after sorting!");
    }
    
    // Log the final collection ordering with active status
    console.log("Returning collections sorted by active deals first, then priority:", 
      sortedResult.map(c => {
        const hasActiveDeals = c.deals.some(deal => isDealActiveNow(deal));
        return `${c.name} (priority: ${c.priority}, active: ${hasActiveDeals})`;
      }));
    
    return sortedResult;
  }, [dealsData, location, apiCollections]);

  useEffect(() => {
    // Store the current page in sessionStorage for proper back navigation
    sessionStorage.setItem('lastVisitedPage', '/');
    console.log('Set lastVisitedPage to / in sessionStorage');
    
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
          updateLocation({
            lat: cachedLocation.lat,
            lng: cachedLocation.lng
          }, "My Location");
          
          // Even with cached data, we'll still try to get fresh location
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
            updateLocation(newLocation, "My Location");
            
            // LocationBar will handle the reverse geocoding and update the road name
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
    
    // Listen for postal code and road name updates from LocationBar
    const handlePostalCodeUpdate = (event: CustomEvent) => {
      if (event.detail) {
        if (event.detail.postalCode) {
          setUserPostalCode(event.detail.postalCode);
        }
              // Use the actual road name from detected location
        // Only update road name if we're not using "My Location"
        if (event.detail.roadName && !isUsingDefaultLocation) {
          setUserRoadName(event.detail.roadName);
        }
        
        // If this location was detected automatically, don't update the UI location
        // but do update the query parameters if needed
        if (event.detail.detectedLocation && 
            event.detail.lat && 
            event.detail.lng) {
          
          // If we're using "My Location", keep it displayed
          if (isUsingDefaultLocation) {
            setUserRoadName("My Location");
          }
          
          // Update query parameters without changing the displayed location name
          setTimeout(() => {
            handleLocationChange({ 
              lat: event.detail.lat, 
              lng: event.detail.lng 
            });
          }, 300);
        }
      }
    };
    
    // Add event listener
    window.addEventListener('postalCodeUpdated', handlePostalCodeUpdate as EventListener);
    
    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('postalCodeUpdated', handlePostalCodeUpdate as EventListener);
    };
  }, [isUsingDefaultLocation]);

  const handleLocationChange = (newLocation: { lat: number; lng: number }) => {
    // IMPORTANT: This is the key function that updates location
    console.log("Updating location to:", newLocation);
    
    // Use context's updateLocation function which will properly update all state
    // and trigger cache invalidation automatically
    updateLocation(newLocation, userRoadName);
    
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
      <AppHeader />
      
      <LocationBar 
        onLocationChange={handleLocationChange} 
        onOpenFilters={handleOpenFilters} 
      />
      
      {/* Simple location selector with minimal UI */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="container mx-auto">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              {isLocationSelectOpen ? (
                <LocationAutocomplete
                  defaultValue=""
                  placeholder="Search for a location..."
                  onLocationSelect={(selectedLocation) => {
                    // Use the coordinates from the selected location
                    const newLat = selectedLocation.latitude;
                    const newLng = selectedLocation.longitude;
                    
                    // Always display "My Location" regardless of what's selected
                    setUserRoadName("My Location");
                    setIsUsingDefaultLocation(true);
                    
                    // Update location through context's updateLocation function
                    updateLocation({ lat: newLat, lng: newLng }, "My Location");
                    
                    // No need for timeout or separate handleLocationChange call as updateLocation handles everything
                    
                    // Close the location selector
                    setIsLocationSelectOpen(false);
                  }}
                />
              ) : (
                <div 
                  className="flex items-center text-sm text-gray-600 cursor-pointer"
                  onClick={() => {
                    setIsLocationSelectOpen(true);
                  }}
                >
                  <FiMapPin className="mr-1 h-4 w-4 text-gray-400" />
                  <span className="font-medium">{userRoadName}</span>
                </div>
              )}
              {/* Filter button moved to top right */}
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="border border-gray-200 hover:bg-gray-100 rounded-lg p-2 shrink-0"
                style={{ background: "#f8f7f5" }}
                onClick={handleOpenFilters}
              >
                <FiFilter className="h-4 w-4 text-[#191632]" />
              </Button>
            </div>
            
            {/* Filter button has been moved to the top right corner */}
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
              {/* Show loading skeletons when data is being fetched */}
              {isLoading ? (
                <CollectionsLoadingSkeleton />
              ) : (
                /* Render collections in their proper priority order when data is available */
                collections
                  // No filtering - use the exact server-side priority values
                  .sort((a, b) => {
                    // Sort by priority value directly
                    return a.priority - b.priority;
                  })
                  .map((collection, index) => (
                    <motion.div
                      key={`collection-${collection.name}-${index}`}
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
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
      
      {/* Removed regular deals list to avoid showing dummy data */}
      
      <Navigation />
    </div>
  );
}