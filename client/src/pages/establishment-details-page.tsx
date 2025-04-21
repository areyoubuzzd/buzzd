import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { FaStar, FaMapMarkerAlt, FaArrowLeft, FaWalking, FaPhone, FaGlobe, FaMapMarkedAlt, FaClock, FaWhatsapp, FaTelegram, FaShareAlt } from 'react-icons/fa';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import Navigation from '@/components/layout/navigation';
import { calculateDistance, formatDistance, getCurrentPosition, DEFAULT_POSITION } from '@/lib/distance-utils';
import { motion, AnimatePresence } from 'framer-motion';

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
  phone?: string;
  website?: string;
}

interface Deal {
  id: number;
  establishmentId: number;
  alcohol_category: string;
  alcohol_subcategory?: string;
  alcohol_subcategory2?: string;
  drink_name: string;
  standard_price: number;
  happy_hour_price: number;
  savings: number;
  savings_percentage: number;
  valid_days: string;
  hh_start_time: string;
  hh_end_time: string;
  collections?: string;
  imageUrl?: string;
  description?: string; // Added description field
}

interface EstablishmentDetailsResponse {
  establishment: Establishment;
  activeDeals: Deal[];
}

// Helper function to check if we're within happy hour
const isWithinHappyHour = (deal: Deal): boolean => {
  console.log(`Checking if we're within happy hour for ${deal.drink_name}`);
  console.log(`Valid days: ${deal.valid_days}, Hours: ${deal.hh_start_time} - ${deal.hh_end_time}`);
  
  // Get the current date directly from the system time
  // This should already be in the user's local timezone
  const now = new Date();
  
  // Get current day name
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daysLowercase = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const currentDay = days[now.getDay()];
  const currentDayLowercase = currentDay.toLowerCase();
  console.log(`Current day: ${currentDay}`);
  
  // Check if current day is in valid days
  // Common formats: "Mon-Fri", "Mon,Tue,Thu", "Daily", "Weekends"
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
    
    // Debug log
    console.log(`Range check: ${startIdx} <= ${currentIdx} <= ${endIdx}`);
    
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
  
  console.log(`Is day valid: ${isDayValid}`);
  if (!isDayValid) return false;
  
  // Now check if current time is within happy hour
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute; // in minutes since midnight
  console.log(`Current time (in minutes): ${currentTime}, which is ${currentHour}:${currentMinute}`);
  
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
  
  console.log(`Happy hour start time (in minutes): ${startTime}`);
  console.log(`Happy hour end time (in minutes): ${endTime}`);
  
  // For testing - set to true to force active state
  // return true;
  
  // Check if current time is within happy hour range
  let isActive = false;
  if (startTime <= endTime) {
    // Normal case: e.g. 17:00 - 20:00
    isActive = currentTime >= startTime && currentTime <= endTime;
  } else {
    // Overnight case: e.g. 22:00 - 02:00
    isActive = currentTime >= startTime || currentTime <= endTime;
  }
  
  console.log(`Is within happy hour: ${isActive}`);
  return isActive;
};

// Helper to extract happy hour summary
const getHappyHourSummary = (deals: Deal[]): { validDays: string, timeRange: string, isActive: boolean } => {
  if (!deals || deals.length === 0) {
    return { validDays: 'N/A', timeRange: 'N/A', isActive: false };
  }
  
  // Just use the first deal for now (assuming all deals have the same happy hour time)
  const firstDeal = deals[0];
  
  return {
    validDays: firstDeal.valid_days,
    timeRange: `${firstDeal.hh_start_time} - ${firstDeal.hh_end_time}`,
    isActive: isWithinHappyHour(firstDeal)
  };
};

// Animation variants
const cardContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { 
    y: 20, 
    opacity: 0 
  },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  },
  hover: { 
    scale: 1.02,
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
    transition: { 
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  },
  tap: { 
    scale: 0.98,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 15
    }
  }
};

export default function EstablishmentDetailsPage() {
  const [, params] = useRoute('/establishments/:id');
  // Parse the ID to ensure it's a valid number
  const idParam = params?.id;
  const id = idParam && !isNaN(parseInt(idParam)) ? parseInt(idParam) : null;
  
  const [userPosition, setUserPosition] = useState(DEFAULT_POSITION);
  const [userDistance, setUserDistance] = useState<number | null>(null);
  const [isShareExpanded, setIsShareExpanded] = useState(false);
  
  // Keep track of the referrer/previous page
  const [referrer, setReferrer] = useState<string>("/");
  
  // Log the ID parameter for debugging
  useEffect(() => {
    console.log("Establishment ID param:", idParam);
    console.log("Parsed establishment ID:", id);
  }, [idParam, id]);
  
  // Fetch user location
  useEffect(() => {
    const getLocation = async () => {
      try {
        const position = await getCurrentPosition();
        setUserPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      } catch (error) {
        console.error('Error getting location:', error);
        // Use default position if geolocation fails
      }
    };
    
    getLocation();
  }, []);
  
  const { 
    data, 
    isLoading, 
    error 
  } = useQuery<EstablishmentDetailsResponse>({
    queryKey: [`/api/establishments/${id}`],
    enabled: id !== null, // Only enable the query if we have a valid numeric ID
  });
  
  // For debugging
  useEffect(() => {
    if (data) {
      console.log("Establishment details loaded:", data);
    }
  }, [data]);
  
  // Detect the referrer page
  useEffect(() => {
    // Check the document referrer to see where the user came from
    const previousPath = document.referrer;
    console.log("Previous path from document.referrer:", previousPath);
    
    // Check if we can determine the source from local state or sessionStorage
    const sourceFromSessionStorage = sessionStorage.getItem('lastVisitedPage');
    console.log("Source from sessionStorage:", sourceFromSessionStorage);
    
    // If we have information about the referring page, use it
    if (sourceFromSessionStorage && (sourceFromSessionStorage === '/restaurants' || sourceFromSessionStorage === '/')) {
      setReferrer(sourceFromSessionStorage);
      console.log("Setting referrer from sessionStorage:", sourceFromSessionStorage);
    } else if (previousPath && previousPath.includes('/restaurants')) {
      setReferrer('/restaurants');
      console.log("Setting referrer to /restaurants based on document.referrer");
    } else {
      // Use a fallback based on the history object if available
      try {
        // If coming from '/restaurants', set that as the referrer
        const currentUrl = window.location.href;
        const isFromRestaurants = window.performance && 
                                 window.performance.navigation && 
                                 window.performance.navigation.type === 1 && 
                                 currentUrl.includes('/restaurants');
        
        if (isFromRestaurants) {
          setReferrer('/restaurants');
          console.log("Setting referrer to /restaurants based on navigation timing");
        } else {
          // Default to home if we can't determine
          console.log("No specific referrer detected, using default of '/'");
        }
      } catch (error) {
        console.error("Error checking navigation:", error);
      }
    }
  }, []);
  
  // Calculate distance when establishment data and user position are available
  useEffect(() => {
    if (data?.establishment && data.establishment.latitude && data.establishment.longitude) {
      const distance = calculateDistance(
        userPosition.latitude,
        userPosition.longitude,
        data.establishment.latitude,
        data.establishment.longitude
      );
      setUserDistance(distance);
    }
  }, [data, userPosition]);
  
  // Share functionality
  const handleShareViaWhatsApp = () => {
    if (!data?.establishment) return;
    
    const { name, address, city, postalCode } = data.establishment;
    const fullAddress = `${address}, ${city}, ${postalCode}`;
    const message = `Check out ${name} in Buzzd app! They have great happy hour deals! Address: ${fullAddress}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  const handleShareViaTelegram = () => {
    if (!data?.establishment) return;
    
    const { name, address, city, postalCode } = data.establishment;
    const fullAddress = `${address}, ${city}, ${postalCode}`;
    const message = `Check out ${name} in Buzzd app! They have great happy hour deals! Address: ${fullAddress}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(message)}`;
    window.open(telegramUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Loading restaurant details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <p className="text-red-500 text-lg font-semibold mb-2">Error loading restaurant details</p>
        <p className="text-gray-300 mb-4">
          {id === null 
            ? "Invalid restaurant ID. Please try again with a valid restaurant." 
            : "We couldn't load the details for this restaurant. Please try again later."}
        </p>
        <Button asChild variant="outline" className="bg-[#FFC300] text-[#F4F4F9] hover:bg-[#FFC300]/80 mb-2">
          <Link href="/restaurants">
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Back to Restaurants
          </Link>
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <p className="text-yellow-500 text-lg font-semibold mb-2">Restaurant not found</p>
        <p className="text-gray-300 mb-4">
          The restaurant you're looking for doesn't exist or might have been removed.
        </p>
        <Button asChild variant="outline" className="bg-[#FFC300] text-[#F4F4F9] hover:bg-[#FFC300]/80 mb-2">
          <Link href="/restaurants">
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Back to Restaurants
          </Link>
        </Button>
      </div>
    );
  }

  const { establishment, activeDeals } = data;
  const happyHour = getHappyHourSummary(activeDeals);

  return (
    <div className="pb-20 bg-[#232946]">
      <div 
        className="h-48 bg-cover bg-center relative"
        style={{ 
          backgroundImage: establishment.imageUrl 
            ? `url(${establishment.imageUrl})` 
            : 'linear-gradient(to right, var(--primary), var(--primary-foreground))' 
        }}
      >
        <div className="absolute inset-0 bg-black/40 flex items-end">
          <div className="p-4 text-[#F4F4F9]">
            <Link href={referrer}>
              <Button size="sm" variant="ghost" className="bg-[#FFC300] text-[#F4F4F9] hover:bg-[#FFC300]/80 mb-2">
                <FaArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {/* Restaurant Name as Title */}
        <h1 className="text-2xl font-bold mb-2 text-[#F4F4F9]">{establishment.name}</h1>
        
        {/* Happy Hours Section with active indicator */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <FaClock className="text-[#FFC300]" />
            <h3 className="text-lg font-semibold text-[#F4F4F9]">Happy Hours</h3>
            <div className="flex items-center ml-2">
              <div className={`w-2 h-2 rounded-full ${happyHour.isActive ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse mr-1`}></div>
              <span className={`text-xs font-medium ${happyHour.isActive ? 'text-green-400' : 'text-yellow-400'}`}>
                {happyHour.isActive ? 'Active now' : 'Inactive'}
              </span>
            </div>
          </div>
          <div className="pl-6 text-sm text-[#F4F4F9]/80">
            <p><span className="font-medium">Days:</span> {happyHour.validDays}</p>
            <p><span className="font-medium">Hours:</span> {happyHour.timeRange}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge variant="outline" className="bg-primary/10">{establishment.cuisine}</Badge>
          
          {userDistance !== null && (
            <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
              <FaWalking className="h-3 w-3" />
              {formatDistance(userDistance)}
            </Badge>
          )}
          
          {establishment.rating && (
            <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 text-yellow-700 border-yellow-200">
              <FaStar className="h-3 w-3" />
              {establishment.rating.toFixed(1)}
            </Badge>
          )}
        </div>
        
        {establishment.description && (
          <p className="text-gray-600 mb-6">{establishment.description}</p>
        )}
        
        <h2 className="text-xl font-bold mb-4 text-[#FFC300]">Active Deals</h2>
        
        {activeDeals.length === 0 ? (
          <p className="text-gray-500">No active deals at this time.</p>
        ) : (
          <motion.div 
            className="grid gap-4"
            variants={cardContainerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {activeDeals.map((deal, index) => (
                <motion.div
                  key={deal.id}
                  layout
                  custom={index}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  whileTap="tap"
                  transition={{
                    layout: { type: "spring", stiffness: 300, damping: 30 },
                    delay: index * 0.05
                  }}
                  className="rounded-xl overflow-hidden bg-[#2a3158] shadow-md border border-[#3a4174]"
                >
                  <div className="p-5">
                    <div className="mb-2">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-[#F4F4F9]">{deal.drink_name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400 line-through">${deal.standard_price.toFixed(2)}</span>
                          <span className="font-bold text-[#FFC300]">${deal.happy_hour_price.toFixed(2)}</span>
                        </div>
                      </div>
                      <motion.p 
                        className="text-xs text-green-400"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 + 0.2 }}
                      >
                        Save {deal.savings_percentage}%
                      </motion.p>
                    </div>
                    {deal.description && (
                      <motion.div 
                        className="text-sm text-[#F4F4F9]/80 mt-2 border-t border-[#3a4174] pt-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 + 0.3 }}
                      >
                        {deal.description}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
        
        <motion.h2 
          className="text-xl font-bold mt-6 mb-4 text-[#FFC300]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Contact & Location
        </motion.h2>
        <div className="grid gap-4 mb-6">
          <motion.div 
            className="rounded-xl overflow-hidden bg-[#2a3158] shadow-md border border-[#3a4174]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 24,
              delay: 0.6 
            }}
            whileHover={{ 
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
              y: -2,
              transition: { 
                type: "spring",
                stiffness: 400,
                damping: 15
              }
            }}
          >
            <div className="p-5">
              <div className="space-y-3">
                <motion.div 
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <FaMapMarkerAlt className="text-[#FFC300] h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-[#F4F4F9]">Address</p>
                    <p className="text-sm text-[#F4F4F9]/70">{establishment.address}</p>
                    <p className="text-sm text-[#F4F4F9]/70">{establishment.city} {establishment.postalCode}</p>
                  </div>
                </motion.div>
                
                {establishment.phone && (
                  <motion.div 
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <FaPhone className="text-[#FFC300] h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-[#F4F4F9]">Phone</p>
                      <a 
                        href={`tel:${establishment.phone}`}
                        className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        {establishment.phone}
                      </a>
                    </div>
                  </motion.div>
                )}
                
                {establishment.website && (
                  <motion.div 
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    <FaGlobe className="text-[#FFC300] h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-[#F4F4F9]">Website</p>
                      <a 
                        href={establishment.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300 hover:underline break-all"
                      >
                        {establishment.website}
                      </a>
                    </div>
                  </motion.div>
                )}
                
                {establishment.latitude && establishment.longitude && (
                  <motion.div 
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 }}
                  >
                    <FaMapMarkedAlt className="text-[#FFC300] h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-[#F4F4F9]">Directions</p>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${establishment.latitude},${establishment.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        Open in Google Maps
                      </a>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {establishment.latitude && establishment.longitude && (
          <motion.div 
            className="rounded-xl overflow-hidden h-48 bg-[#2a3158] mb-6 shadow-md border border-[#3a4174]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 24,
              delay: 1.1
            }}
            whileHover={{ 
              scale: 1.02,
              transition: { type: "spring", stiffness: 400, damping: 10 }
            }}
          >
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${establishment.latitude},${establishment.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full h-full bg-[#2a3158] text-[#F4F4F9]"
            >
              <div className="text-center">
                <motion.div 
                  className="flex justify-center mb-2"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.3, type: "spring" }}
                >
                  <FaMapMarkedAlt size={32} className="text-[#FFC300]" />
                </motion.div>
                <motion.span 
                  className="text-sm font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                >
                  View on Google Maps
                </motion.span>
              </div>
            </a>
          </motion.div>
        )}
      </div>
      
      {/* Share floating bar */}
      <motion.div
        className="fixed bottom-20 left-0 right-0 z-50 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.5
        }}
      >
        <motion.div 
          className="bg-white rounded-full shadow-lg mx-auto flex items-center justify-between px-4 py-2"
          whileHover={{ scale: 1.02 }}
        >
          <span className="text-gray-800 text-sm mr-2">Share this spot with your friends</span>
          <div className="flex items-center space-x-3">
            <motion.button
              onClick={handleShareViaWhatsApp}
              className="text-[#25D366] p-1 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaWhatsapp className="h-[22px] w-[22px]" />
            </motion.button>
            
            <motion.button
              onClick={handleShareViaTelegram}
              className="text-[#0088cc] p-1 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaTelegram className="h-[22px] w-[22px]" />
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
      
      <Navigation />
    </div>
  );
}