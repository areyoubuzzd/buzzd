import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RestaurantCard, RestaurantCardSkeleton } from '@/components/restaurants/restaurant-card';
import Navigation from '@/components/layout/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { FaWhatsapp } from 'react-icons/fa';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import { LocationHeader } from '@/components/location/location-header';
import { useLocation } from '@/contexts/location-context';
import { Link } from 'wouter';
import logoBlack from '@/assets/logo_black.png';

interface Deal {
  valid_days: string;
  hh_start_time: string;
  hh_end_time: string;
  drink_name?: string;
}

interface Establishment {
  id: number;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  cuisine: string;
  imageUrl?: string;
  rating?: number;
  description?: string;
  external_id?: string;
  latitude?: number;
  longitude?: number;
  activeDeals?: Deal[];
  hasActiveDeals?: boolean; // Added this property from server response
}

// Helper function to check if a deal is active now (copy from restaurant-card.tsx)
function isWithinHappyHour(deal: Deal): boolean {
  if (!deal) return false;
  
  // Get the current date in the user's local timezone
  const now = new Date();
  
  // Get current day name
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daysLowercase = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const currentDay = days[now.getDay()];
  const currentDayLowercase = currentDay.toLowerCase();
  
  // Check if current day is in valid days
  let isDayValid = false;
  
  // Normalize the valid_days string to lowercase for case-insensitive comparison
  const validDaysLower = deal.valid_days.toLowerCase();
  
  // Handle the "Daily" case
  if (validDaysLower === 'daily' || validDaysLower === 'all days') {
    isDayValid = true;
  } 
  // Handle "Weekends" case
  else if (validDaysLower === 'weekends') {
    isDayValid = currentDay === 'Sat' || currentDay === 'Sun';
  }
  // Handle "Weekdays" case
  else if (validDaysLower === 'weekdays') {
    isDayValid = currentDay !== 'Sat' && currentDay !== 'Sun';
  }
  // Handle ranges like "Mon-Fri" or "mon-fri"
  else if (validDaysLower.includes('-')) {
    const [startDay, endDay] = validDaysLower.split('-').map(d => d.trim());
    const startIdx = daysLowercase.indexOf(startDay);
    const endIdx = daysLowercase.indexOf(endDay);
    const currentIdx = now.getDay();
    
    if (startIdx !== -1 && endIdx !== -1) {
      if (startIdx <= endIdx) {
        isDayValid = currentIdx >= startIdx && currentIdx <= endIdx;
      } else {
        // Handle wrapping around like "Fri-Sun" (includes Fri, Sat, Sun)
        isDayValid = currentIdx >= startIdx || currentIdx <= endIdx;
      }
    }
  }
  // Handle comma-separated lists like "Mon, Wed, Fri"
  else if (validDaysLower.includes(',')) {
    const validDays = validDaysLower.split(',').map(d => d.trim());
    isDayValid = validDays.includes(currentDayLowercase);
  }
  // Handle single day
  else {
    isDayValid = validDaysLower.trim() === currentDayLowercase;
  }
  
  if (!isDayValid) {
    if (deal.drink_name) { // Only log if the deal has a name to avoid cluttering console
      console.log(`Deal "${deal.drink_name}" is NOT active: Day ${currentDay} is not in valid days "${deal.valid_days}"`);
    }
    return false;
  }
  
  // Now check if current time is within happy hour
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute; // in minutes since midnight
  
  // Parse happy hour times
  // Handle different formats like "17:00", "17:00:00", "1700"
  let startTime = 0;
  let endTime = 0;
  
  // Parse start time
  if (deal.hh_start_time.includes(':')) {
    const [hours, minutes] = deal.hh_start_time.split(':').map(Number);
    startTime = hours * 60 + (minutes || 0);
  } else {
    // Format like "1700"
    const timeStr = deal.hh_start_time;
    // Handle possible formats
    if (timeStr.length <= 2) {
      // Just hours like "9" or "17"
      startTime = parseInt(timeStr) * 60;
    } else if (timeStr.length === 3) {
      // Format like "930" (9:30)
      const hours = parseInt(timeStr.substring(0, 1));
      const minutes = parseInt(timeStr.substring(1));
      startTime = hours * 60 + minutes;
    } else {
      // Format like "0930" or "1700"
      const hours = parseInt(timeStr.substring(0, 2));
      const minutes = parseInt(timeStr.substring(2));
      startTime = hours * 60 + minutes;
    }
  }
  
  // Parse end time
  if (deal.hh_end_time.includes(':')) {
    const [hours, minutes] = deal.hh_end_time.split(':').map(Number);
    endTime = hours * 60 + (minutes || 0);
  } else {
    // Format like "1700"
    const timeStr = deal.hh_end_time;
    // Handle possible formats
    if (timeStr.length <= 2) {
      // Just hours like "9" or "17"
      endTime = parseInt(timeStr) * 60;
    } else if (timeStr.length === 3) {
      // Format like "930" (9:30)
      const hours = parseInt(timeStr.substring(0, 1));
      const minutes = parseInt(timeStr.substring(1));
      endTime = hours * 60 + minutes;
    } else {
      // Format like "0930" or "1700"
      const hours = parseInt(timeStr.substring(0, 2));
      const minutes = parseInt(timeStr.substring(2));
      endTime = hours * 60 + minutes;
    }
  }
  
  // Log the time values for debugging
  console.log(`Start time raw: "${deal.hh_start_time}", parsed: ${startTime}`);
  console.log(`End time raw: "${deal.hh_end_time}", parsed: ${endTime}`);
  console.log(`Current time value: ${currentTime}`);
  
  // Check if current time is within happy hour range
  if (startTime <= endTime) {
    // Normal case: e.g. 17:00 - 20:00
    const isActive = currentTime >= startTime && currentTime <= endTime;
    
    if (deal.drink_name) { // Only log for deals with a name to avoid console clutter
      if (isActive) {
        console.log(`Deal "${deal.drink_name}" is ACTIVE (${currentTime} is between ${startTime} and ${endTime})`);
      } else {
        console.log(`Deal "${deal.drink_name}" is NOT active: time ${currentTime} is NOT between ${startTime} and ${endTime}`);
      }
    }
    
    return isActive;
  } else {
    // Overnight case: e.g. 22:00 - 02:00
    const isActive = currentTime >= startTime || currentTime <= endTime;
    
    if (deal.drink_name) { // Only log for deals with a name to avoid console clutter
      if (isActive) {
        console.log(`Deal "${deal.drink_name}" is ACTIVE (${currentTime} is either >= ${startTime} or <= ${endTime})`);
      } else {
        console.log(`Deal "${deal.drink_name}" is NOT active: time ${currentTime} is neither >= ${startTime} nor <= ${endTime}`);
      }
    }
    
    return isActive;
  }
}

export default function RestaurantsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { location, userRoadName } = useLocation(); // Import userRoadName too
  const [userPosition, setUserPosition] = useState<{ lat: number, lng: number } | null>(null);
  
  // WhatsApp button handler
  const handleWhatsAppClick = () => {
    const whatsappUrl = "https://wa.me/6587654321?text=Hello%2C%20I'd%20like%20to%20list%20my%20restaurant%20or%20update%20a%20deal%20in%20the%20app.";
    window.open(whatsappUrl, "_blank");
  };
  
  // Store the current page in sessionStorage for proper back navigation
  useEffect(() => {
    sessionStorage.setItem('lastVisitedPage', '/restaurants');
    console.log('Set lastVisitedPage to /restaurants in sessionStorage');
    
    // Use the location from the global context
    console.log('RestaurantsPage: Location from context:', location, 'Name:', userRoadName);
    setUserPosition({
      lat: location.lat,
      lng: location.lng
    });
  }, [location, userRoadName]);
  
  const { 
    data: establishments, 
    isLoading, 
    error 
  } = useQuery<Establishment[]>({
    queryKey: ['/api/establishments'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Function to calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in km
  };
  
  // Check if a restaurant has active deals
  // We can use the precomputed hasActiveDeals flag from the server if it exists
  const hasActiveDeals = (establishment: Establishment): boolean => {
    console.log(`Checking active status for ${establishment.name}, deals:`, establishment.activeDeals);
    
    // First check if the server provided the hasActiveDeals flag
    if ('hasActiveDeals' in establishment && establishment.hasActiveDeals !== undefined) {
      console.log(`${establishment.name} has server-provided hasActiveDeals flag:`, establishment.hasActiveDeals);
      return establishment.hasActiveDeals;
    }
    
    // Fallback to client-side calculation
    if (!establishment.activeDeals || establishment.activeDeals.length === 0) {
      console.log(`${establishment.name}: No active deals array or empty array`);
      return false;
    }
    
    // Count how many deals are active for the current day and time
    let activeDealCount = 0;
    let todayDealCount = 0;
    
    establishment.activeDeals.forEach(deal => {
      const isActive = isWithinHappyHour(deal);
      if (isActive) activeDealCount++;
      if (isDealValidForToday(deal)) todayDealCount++;
    });
    
    console.log(`${establishment.name}: Has ${todayDealCount} deals for today, ${activeDealCount} are active now`);
    return activeDealCount > 0;
  };
  
  // Helper function to check if a deal is valid for the current day (regardless of time)
  const isDealValidForToday = (deal: Deal): boolean => {
    if (!deal) return false;
    
    // Get the current date
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysLowercase = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDay = days[now.getDay()];
    const currentDayLowercase = currentDay.toLowerCase();
    
    // Normalize the valid_days string to lowercase
    const validDaysLower = deal.valid_days.toLowerCase();
    
    // Check various day formats
    if (validDaysLower === 'daily' || validDaysLower === 'all days') {
      return true;
    } 
    else if (validDaysLower === 'weekends') {
      return currentDay === 'Sat' || currentDay === 'Sun';
    }
    else if (validDaysLower === 'weekdays') {
      return currentDay !== 'Sat' && currentDay !== 'Sun';
    }
    else if (validDaysLower.includes('-')) {
      const [startDay, endDay] = validDaysLower.split('-').map(d => d.trim());
      const startIdx = daysLowercase.indexOf(startDay);
      const endIdx = daysLowercase.indexOf(endDay);
      const currentIdx = now.getDay();
      
      console.log(`Deal for ${deal.drink_name}: valid_days="${deal.valid_days}", start_time="${deal.hh_start_time}", current day is "${currentDay}"`);
      console.log(`Range check: ${startIdx} <= ${currentIdx} <= ${endIdx} => ${startIdx <= currentIdx && currentIdx <= endIdx}`);
      
      if (startIdx !== -1 && endIdx !== -1) {
        if (startIdx <= endIdx) {
          return currentIdx >= startIdx && currentIdx <= endIdx;
        } else {
          // Handle wrapping around like "Fri-Sun" (includes Fri, Sat, Sun)
          return currentIdx >= startIdx || currentIdx <= endIdx;
        }
      }
    }
    else if (validDaysLower.includes(',')) {
      const validDays = validDaysLower.split(',').map(d => d.trim());
      return validDays.includes(currentDayLowercase);
    }
    else {
      return validDaysLower.trim() === currentDayLowercase;
    }
    
    return false;
  };
  
  // Filter restaurants based on search query
  const filteredEstablishments = useMemo(() => {
    if (!establishments) return [];
    
    if (!searchQuery) return establishments;
    
    const query = searchQuery.toLowerCase();
    return establishments.filter((establishment: Establishment) => (
      establishment.name.toLowerCase().includes(query) ||
      establishment.cuisine.toLowerCase().includes(query) ||
      establishment.address.toLowerCase().includes(query) ||
      establishment.city.toLowerCase().includes(query)
    ));
  }, [establishments, searchQuery]);
  
  // Sort restaurants: active first, then by distance
  const sortedEstablishments = useMemo(() => {
    if (!filteredEstablishments || !userPosition) return filteredEstablishments;
    
    console.log("Starting to sort establishments with user position:", userPosition);
    
    // Add distance and active status to each establishment
    const establishmentsWithMeta = filteredEstablishments.map(establishment => {
      const distance = calculateDistance(
        userPosition.lat,
        userPosition.lng,
        establishment.latitude || 0,
        establishment.longitude || 0
      );
      
      const isActive = hasActiveDeals(establishment);
      
      console.log(`Calculated for ${establishment.name}: distance=${distance.toFixed(2)}km, isActive=${isActive}`);
      
      return {
        ...establishment,
        distance,
        isActive
      };
    });
    
    console.log("Pre-sort establishments:", establishmentsWithMeta.map(e => ({
      name: e.name,
      isActive: e.isActive,
      distance: e.distance.toFixed(2)
    })));
    
    // Sort: active first, then by distance
    const sortedResult = establishmentsWithMeta.sort((a, b) => {
      // First sort by active status
      if (a.isActive && !b.isActive) {
        console.log(`Sorting: ${a.name} (active) comes before ${b.name} (inactive)`);
        return -1;
      }
      if (!a.isActive && b.isActive) {
        console.log(`Sorting: ${b.name} (active) comes before ${a.name} (inactive)`);
        return 1;
      }
      
      // If both have same active status, sort by distance
      const distanceDiff = a.distance - b.distance;
      console.log(`Sorting by distance: ${a.name} (${a.distance.toFixed(2)}km) vs ${b.name} (${b.distance.toFixed(2)}km), diff=${distanceDiff.toFixed(2)}`);
      return distanceDiff;
    });
    
    console.log("Post-sort establishments:", sortedResult.map(e => ({
      name: e.name,
      isActive: e.isActive,
      distance: e.distance.toFixed(2)
    })));
    
    return sortedResult;
  }, [filteredEstablishments, userPosition]);

  return (
    <div className="pb-20 bg-[#232946]">
      <header className="sticky top-0 z-50 bg-[#EAE6E1] shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-[4.5rem]">
            <div className="flex items-center">
              <Link href="/">
                <div className="flex items-center cursor-pointer" style={{ marginLeft: "-12px" }}>
                  <img 
                    src={logoBlack} 
                    alt="Buzzd Logo" 
                    className="h-[4rem]"
                  />
                </div>
              </Link>
            </div>

            {/* Space reserved for future UI elements */}
            <div></div>
          </div>
        </div>
      </header>
      
      {/* Location Header Component */}
      <div className="mt-0">
        <LocationHeader onOpenFilters={() => console.log("Open filters")} />
      </div>
      
      {/* Restaurant Page Heading */}
      <div className="bg-[#232946] px-4 py-6 border-b border-[#353e6b]">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-white">Restaurants & Bars</h1>
          <p className="text-gray-300 mt-1">Find the best happy hour spots near you</p>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="bg-[#282f57] px-4 py-3 border-b border-[#353e6b] sticky top-[4.5rem] z-10">
        <div className="container mx-auto">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search for restaurant or area"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 py-2 w-full rounded-lg border-[#353e6b]"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 rounded-full"
              >
                <FiX />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="bg-[#232946] px-4 py-2 border-b border-[#353e6b]">
        <div className="container mx-auto">
          <p className="text-sm text-gray-300">
            {sortedEstablishments?.length || 0} {sortedEstablishments?.length === 1 ? 'restaurant' : 'restaurants'} found
            {searchQuery ? ` for "${searchQuery}"` : ''}
          </p>
        </div>
      </div>
      
      <div className="px-4 py-4 bg-[#232946]">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {[...Array(6)].map((_, i) => (
              <RestaurantCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="bg-[#353e6b] p-4 rounded-full mb-4">
              <FiSearch className="h-8 w-8 text-amber-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">Error loading restaurants</h3>
            <p className="text-gray-300 max-w-md">
              {(error as Error).message}
            </p>
          </div>
        ) : filteredEstablishments?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="bg-[#353e6b] p-4 rounded-full mb-4">
              <FiSearch className="h-8 w-8 text-amber-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">No restaurants found</h3>
            <p className="text-gray-300 max-w-md">
              {searchQuery 
                ? `No restaurants match "${searchQuery}". Try a different search term.`
                : "We couldn't find any restaurants in this area. Try changing your location."}
            </p>
            {searchQuery && (
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <Badge 
                  variant="outline" 
                  className="flex items-center gap-1 cursor-pointer hover:bg-[#353e6b] border-amber-400 text-amber-400"
                  onClick={() => setSearchQuery('')}
                >
                  "{searchQuery}" <FiX className="h-3 w-3" />
                </Badge>
              </div>
            )}
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {sortedEstablishments?.map((establishment: any, index: number) => (
              <motion.div
                key={establishment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: index * 0.05,
                  duration: 0.3
                }}
              >
                <RestaurantCard establishment={establishment} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
      
      {/* WhatsApp integration removed as requested */}
      
      <Navigation />
    </div>
  );
}