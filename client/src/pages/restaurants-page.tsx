import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RestaurantCard, RestaurantCardSkeleton } from '@/components/restaurants/restaurant-card';
import Navigation from '@/components/layout/navigation';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface Deal {
  valid_days: string;
  hh_start_time: string;
  hh_end_time: string;
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
}

// Helper function to check if a deal is active now (copy from restaurant-card.tsx)
function isWithinHappyHour(deal: Deal): boolean {
  if (!deal) return false;
  
  // Get the current date in the user's local timezone
  const now = new Date();
  
  // Get current day name
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDay = days[now.getDay()];
  
  // Check if current day is in valid days
  let isDayValid = false;
  
  // Handle the "Daily" case
  if (deal.valid_days.toLowerCase() === 'daily' || deal.valid_days.toLowerCase() === 'all days') {
    isDayValid = true;
  } 
  // Handle "Weekends" case
  else if (deal.valid_days.toLowerCase() === 'weekends') {
    isDayValid = currentDay === 'Sat' || currentDay === 'Sun';
  }
  // Handle "Weekdays" case
  else if (deal.valid_days.toLowerCase() === 'weekdays') {
    isDayValid = currentDay !== 'Sat' && currentDay !== 'Sun';
  }
  // Handle ranges like "Mon-Fri"
  else if (deal.valid_days.includes('-')) {
    const [startDay, endDay] = deal.valid_days.split('-').map(d => d.trim());
    const startIdx = days.findIndex(d => d === startDay);
    const endIdx = days.findIndex(d => d === endDay);
    const currentIdx = now.getDay();
    
    if (startIdx <= endIdx) {
      isDayValid = currentIdx >= startIdx && currentIdx <= endIdx;
    } else {
      // Handle wrapping around like "Fri-Sun" (includes Fri, Sat, Sun)
      isDayValid = currentIdx >= startIdx || currentIdx <= endIdx;
    }
  }
  // Handle comma-separated lists like "Mon, Wed, Fri"
  else if (deal.valid_days.includes(',')) {
    const validDays = deal.valid_days.split(',').map(d => d.trim());
    isDayValid = validDays.includes(currentDay);
  }
  // Handle single day
  else {
    isDayValid = deal.valid_days.trim() === currentDay;
  }
  
  if (!isDayValid) return false;
  
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
  
  // Check if current time is within happy hour range
  if (startTime <= endTime) {
    // Normal case: e.g. 17:00 - 20:00
    return currentTime >= startTime && currentTime <= endTime;
  } else {
    // Overnight case: e.g. 22:00 - 02:00
    return currentTime >= startTime || currentTime <= endTime;
  }
}

export default function RestaurantsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [userPosition, setUserPosition] = useState<{ lat: number, lng: number } | null>(null);
  
  // Store the current page in sessionStorage for proper back navigation
  useEffect(() => {
    sessionStorage.setItem('lastVisitedPage', '/restaurants');
    console.log('Set lastVisitedPage to /restaurants in sessionStorage');
    
    // Get user's position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.error('Error getting user location:', error);
        // Default to Singapore center
        setUserPosition({ lat: 1.3521, lng: 103.8198 });
      }
    );
  }, []);
  
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
  const hasActiveDeals = (establishment: Establishment): boolean => {
    if (!establishment.activeDeals || establishment.activeDeals.length === 0) return false;
    return establishment.activeDeals.some(deal => isWithinHappyHour(deal));
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
    
    // Add distance and active status to each establishment
    const establishmentsWithMeta = filteredEstablishments.map(establishment => {
      const distance = calculateDistance(
        userPosition.lat,
        userPosition.lng,
        establishment.latitude || 0,
        establishment.longitude || 0
      );
      
      const isActive = hasActiveDeals(establishment);
      
      return {
        ...establishment,
        distance,
        isActive
      };
    });
    
    // Sort: active first, then by distance
    return establishmentsWithMeta.sort((a, b) => {
      // First sort by active status
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      
      // Then sort by distance
      return a.distance - b.distance;
    });
  }, [filteredEstablishments, userPosition]);

  return (
    <div className="pb-20">
      <div className="bg-primary text-white py-4 px-4 sticky top-0 z-10">
        <motion.h1
          className="text-2xl font-bold mb-2"
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
        <motion.div 
          className="relative"
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          </motion.div>
          <Input
            className="bg-white/10 border-0 focus-visible:ring-1 text-white pl-10"
            placeholder="Search restaurants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </motion.div>
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
      
      <Navigation />
    </div>
  );
}