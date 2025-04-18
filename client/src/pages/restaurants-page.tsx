import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RestaurantCard, RestaurantCardSkeleton } from '@/components/restaurants/restaurant-card';
import Navigation from '@/components/layout/navigation';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { FaWhatsapp } from 'react-icons/fa';
import { LocationHeader } from '@/components/location/location-header';
import { useLocation } from '@/contexts/location-context';

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
  const filteredEstablishments = establishments?.filter((establishment: Establishment) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      establishment.name.toLowerCase().includes(query) ||
      establishment.cuisine.toLowerCase().includes(query) ||
      establishment.address.toLowerCase().includes(query) ||
      establishment.city.toLowerCase().includes(query)
    );
  });
  
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
    <div className="pb-20">
      <div className="bg-primary text-white px-4 sticky top-0 z-10">
        <div className="flex justify-between items-center h-18"> {/* Fixed height of h-18 (4.5rem) */}
          <motion.h1
            className="text-2xl font-bold"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 400,
              damping: 15
            }}
          >
            Restaurants
          </motion.h1>

          {/* Search bar - made smaller and moved to the right */}
          <motion.div 
            className="relative w-40"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              delay: 0.1,
              duration: 0.3
            }}
          >
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            </motion.div>
            <Input
              className="bg-white/10 border-0 focus-visible:ring-1 text-white pl-8 h-8 text-sm"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </motion.div>
        </div>
      </div>
      
      {/* Location Header Component - moved 5px lower */}
      <div className="pt-[5px]">
        <LocationHeader onOpenFilters={() => console.log("Open filters")} />
      </div>
      
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <RestaurantCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <motion.div 
            className="text-center p-8 text-red-500"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.p 
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.1, type: "spring" }}
            >
              Error loading restaurants.
            </motion.p>
            <motion.p 
              className="text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {(error as Error).message}
            </motion.p>
          </motion.div>
        ) : filteredEstablishments?.length === 0 ? (
          <motion.div 
            className="text-center p-8 text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p>No restaurants found matching "{searchQuery}"</p>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
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
      
      {/* WhatsApp integration for restaurant listing/deal updates */}
      <motion.div 
        className="fixed bottom-20 right-4 z-50"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          delay: 0.3 
        }}
      >
        <motion.button
          onClick={handleWhatsAppClick}
          className="bg-[#25D366] hover:bg-[#1da851] text-white rounded-full p-3 shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <FaWhatsapp className="h-6 w-6" />
        </motion.button>
      </motion.div>
      
      <Navigation />
    </div>
  );
}