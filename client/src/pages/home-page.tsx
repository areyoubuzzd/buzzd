import React, { useState, useEffect, useMemo } from "react";
import Header from "@/components/layout/header";
import LocationBar from "@/components/layout/location-bar";
import FilterBar from "@/components/layout/filter-bar";
import SavingsCalculator from "@/components/savings/savings-calculator";
import Navigation from "@/components/layout/navigation";
import CollectionRow from "@/components/collections/collection-row";
import { LocationAutocomplete } from "@/components/location/location-autocomplete";
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
  priority?: number;
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
  const [userRoadName, setUserRoadName] = useState<string>("My Location"); // Default to "My Location" on initial load
  const [isLocationSelectOpen, setIsLocationSelectOpen] = useState<boolean>(false); // State to control location selector visibility
  const [searchTerm, setSearchTerm] = useState<string>(""); // State for the search input field

  // Fetch all deals for collections with location parameters
  const { data: dealsData } = useQuery<Deal[]>({
    queryKey: ['/api/deals/collections/all', { lat: location.lat, lng: location.lng }],
    staleTime: 60000, // 1 minute
    retry: 2
  });
  
  // Fetch collections metadata from the API
  const { data: apiCollections } = useQuery<ApiCollection[]>({
    queryKey: ['/api/collections'],
    staleTime: 300000, // 5 minutes
    retry: 2
  });
  
  // Helper function to check if deal is active right now (based on day and time)
  const isDealActiveNow = (deal: Deal): boolean => {
    const now = new Date();
    
    // Get Singapore time - print current time for debugging
    console.log(`Current time: ${now.toLocaleString()}`);
    const sgOptions = { timeZone: 'Asia/Singapore' };
    const sgTime = new Date(now.toLocaleString('en-US', sgOptions));
    console.log(`Singapore time: ${sgTime.toLocaleString()}`);
    
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
    // 1. Create "Active Happy Hours" collection (always first)
    // =======================================================
    
    const activeHappyHoursDeals = (() => {
      const enrichedDeals = enrichDeals(allDeals);
      
      // Debug Moon Rooftop Bar deals
      const moonDeals = enrichedDeals.filter(deal => deal.establishmentId === 11);
      if (moonDeals.length > 0) {
        console.log(`FOUND ${moonDeals.length} MOON ROOFTOP BAR DEALS:`);
        moonDeals.forEach((deal, index) => {
          console.log(`MOON DEAL #${index + 1}:`);
          console.log(`- Name: ${deal.drink_name}`);
          console.log(`- Distance: ${deal.distance.toFixed(2)} km`);
          console.log(`- Active: ${deal.isActive}`);
          console.log(`- Valid days: ${deal.valid_days}`);
          console.log(`- Happy hour: ${deal.hh_start_time} - ${deal.hh_end_time}`);
        });
      } else {
        console.log(`NO MOON ROOFTOP BAR DEALS FOUND IN RESPONSE DATA`);
      }
      
      // Implement tiered radius approach
      // Try to find active deals, expanding the radius if needed
      
      // Debug raw deals from the API
      if (enrichedDeals.length === 0) {
        console.log(`WARNING: No deals found at all in API response`);
      } else {
        console.log(`Received ${enrichedDeals.length} deals from API`);
        
        // Log establishment IDs in the response
        const establishmentIds = Array.from(new Set(enrichedDeals.map(d => d.establishmentId)));
        console.log(`Establishment IDs in response: ${establishmentIds.join(', ')}`);
        
        // Check if Moon Rooftop Bar (ID 11) exists in the data
        if (establishmentIds.includes(11)) {
          console.log(`Moon Rooftop Bar (ID 11) IS in the API response data`);
        } else {
          console.log(`WARNING: Moon Rooftop Bar (ID 11) IS NOT in the API response data`);
        }
      }
        
      // Debug all Moon Rooftop Bar deals
      const allMoonDeals = enrichedDeals.filter(deal => deal.establishmentId === 11);
      if (allMoonDeals.length > 0) {
        console.log(`FOUND ${allMoonDeals.length} MOON ROOFTOP BAR DEALS TOTAL:`);
        allMoonDeals.forEach((deal, index) => {
          console.log(`MOON DEAL #${index + 1}:`);
          console.log(`- Name: ${deal.drink_name}`);
          console.log(`- Distance: ${deal.distance.toFixed(2)} km`);
          console.log(`- Active: ${deal.isActive}`);
          console.log(`- Valid days: ${deal.valid_days}`);
          console.log(`- Happy hour: ${deal.hh_start_time} - ${deal.hh_end_time}`);
        });
      } else {
        console.log(`NO MOON ROOFTOP BAR DEALS FOUND IN RESPONSE DATA`);
      }

      // Start with deals within 5km (current radius filter)
      const dealsWithin5km = enrichedDeals.filter(deal => deal.distance <= 5);
      const activeDealsWithin5km = dealsWithin5km.filter(deal => deal.isActive);
      
      // Debug Moon within 5km
      const moonDealsWithin5km = dealsWithin5km.filter(deal => deal.establishmentId === 11);
      if (moonDealsWithin5km.length > 0) {
        console.log(`MOON DEALS WITHIN 5KM: ${moonDealsWithin5km.length}`);
      } else {
        console.log(`NO MOON DEALS WITHIN 5KM RADIUS - THIS IS EXPECTED AS MOON IS ~9KM AWAY`);
      }
      
      // If we have active deals within 5km, use those
      // Otherwise expand to 10km
      let finalDeals: typeof enrichedDeals;
      
      if (activeDealsWithin5km.length > 0) {
        // We found active deals within 5km, use all deals within 5km
        console.log(`Found ${activeDealsWithin5km.length} active deals within 5km radius`);
        finalDeals = dealsWithin5km;
      } else {
        // No active deals in 5km, expand to 10km
        const dealsWithin10km = enrichedDeals.filter(deal => deal.distance <= 10);
        const activeDealsWithin10km = dealsWithin10km.filter(deal => deal.isActive);
        
        if (activeDealsWithin10km.length > 0) {
          // We found active deals within 10km
          console.log(`Found ${activeDealsWithin10km.length} active deals within 10km radius`);
          
          // Check if Moon Rooftop Bar deals are included in the 10km deals
          const moonDealsWithin10km = dealsWithin10km.filter(deal => deal.establishmentId === 11);
          if (moonDealsWithin10km.length > 0) {
            console.log(`MOON DEALS WITHIN 10KM: ${moonDealsWithin10km.length}`);
            
            // Check if any of the Moon deals are active
            const activeMoonDeals = moonDealsWithin10km.filter(deal => deal.isActive);
            if (activeMoonDeals.length > 0) {
              console.log(`ACTIVE MOON DEALS WITHIN 10KM: ${activeMoonDeals.length}`);
            } else {
              console.log(`MOON DEALS WITHIN 10KM RADIUS BUT NONE ARE ACTIVE`);
            }
          }
          
          finalDeals = dealsWithin10km;
        } else {
          // No active deals in 10km, expand to 15km
          const dealsWithin15km = enrichedDeals.filter(deal => deal.distance <= 15);
          const activeDealsWithin15km = dealsWithin15km.filter(deal => deal.isActive);
          
          if (activeDealsWithin15km.length > 0) {
            // We found active deals within 15km
            console.log(`Found ${activeDealsWithin15km.length} active deals within 15km radius`);
            finalDeals = dealsWithin15km;
          } else {
            // No active deals found even in 15km, just use the original 5km radius
            console.log('No active deals found within 15km radius, using default 5km radius');
            finalDeals = dealsWithin5km;
          }
        }
      }
      
      // Sort by active status, distance, and price
      const sortedDeals = sortDeals(finalDeals);
      
      // Include all deals from all restaurants
      // No need to filter to just one deal per restaurant
      const uniqueDeals: typeof sortedDeals = [];
      
      // Add all deals to the collection
      for (const deal of sortedDeals) {
        uniqueDeals.push(deal);
      }
      
      // Limit to 25 deals max
      return uniqueDeals.slice(0, 25);
    })();
    
    // Keeping activeHappyHoursDeals for API-based collections but not adding it directly
    // We'll only add it if it comes from the API collections
    
    // Remember we've used this name (both formats)
    usedCollectionNames.add("happy hours nearby");
    usedCollectionNames.add("happy_hours_nearby");
    
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
    
    // Sort the final result by priority to ensure consistent order
    const sortedResult = [...result].sort((a, b) => {
      // Find the API collection for each collection if available
      const collectionA = apiCollectionMap.get(slugify(a.name));
      const collectionB = apiCollectionMap.get(slugify(b.name));
      
      // Get priorities or use defaults
      const priorityA = collectionA?.priority || 50;
      const priorityB = collectionB?.priority || 50;
      
      // Sort by priority
      return priorityA - priorityB;
    });
    
    // Log the final collection ordering
    console.log("Returning collections sorted by priority:", 
      sortedResult.map(c => `${c.name} (priority: ${apiCollectionMap.get(slugify(c.name))?.priority || 'default'})`));
    
    return sortedResult;
  }, [dealsData, location, apiCollections]);

  useEffect(() => {
    // Store the current page in sessionStorage for proper back navigation
    sessionStorage.setItem('lastVisitedPage', '/');
    console.log('Set lastVisitedPage to / in sessionStorage');
    
    // Check if we have a cached location in localStorage
    const cachedLocationStr = localStorage.getItem('lastKnownLocation');
    let cachedLocation = null;
    
    if (cachedLocationStr) {
      try {
        cachedLocation = JSON.parse(cachedLocationStr);
        // Check if cache is recent (less than 24 hours old)
        if (cachedLocation && cachedLocation.timestamp && 
            Date.now() - cachedLocation.timestamp < 24 * 60 * 60 * 1000) {
          console.log('Using cached location:', cachedLocation.name);
          
          // Update states with cached data
          setUserRoadName(cachedLocation.name);
          setLocation({
            lat: cachedLocation.lat,
            lng: cachedLocation.lng
          });
          
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
            setLocation(newLocation);
            
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
        if (event.detail.roadName) {
          setUserRoadName(event.detail.roadName);
        }
        
        // If this location was detected automatically, don't update the UI location
        // but do update the query parameters if needed
        if (event.detail.detectedLocation && 
            event.detail.lat && 
            event.detail.lng) {
          
          // Update query parameters without changing the displayed location
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
  }, []);

  const handleLocationChange = (newLocation: { lat: number; lng: number }) => {
    // IMPORTANT: This is the key function that updates location
    console.log("Updating location to:", newLocation);
    
    // Update the location in state which will trigger all components to re-render
    // with the new location coordinates
    setLocation(newLocation);
    
    // Reset deals data to force a refresh based on new location
    // We pass the location coordinates as part of the query key to ensure
    // the cache is properly invalidated and data is refetched
    queryClient.invalidateQueries({ 
      queryKey: ['/api/deals/collections/all', { lat: newLocation.lat, lng: newLocation.lng }]
    });
    
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
                    
                    // Show the selected location name
                    setUserRoadName(selectedLocation.name);
                    
                    // Update UI with new location value
                    setLocation({ lat: newLat, lng: newLng });
                    
                    // Trigger a location change after a brief delay
                    setTimeout(() => {
                      handleLocationChange({ lat: newLat, lng: newLng });
                    }, 300);
                    
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
      
      <Navigation />
    </div>
  );
}