import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FaStar, FaWalking, FaClock } from 'react-icons/fa';
import { calculateDistance, formatDistance, getCurrentPosition, DEFAULT_POSITION } from '@/lib/distance-utils';
import { motion } from 'framer-motion';
import { isValidDay, shortDaysOfWeek, shortDaysOfWeekLowercase } from '@/lib/time-utils';

interface Deal {
  valid_days: string;
  hh_start_time: string;
  hh_end_time: string;
}

interface EstablishmentData {
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

interface RestaurantCardProps {
  establishment: EstablishmentData;
}

// Helper function to check if a deal is active now
// Format time from "17:00" or "1700" to "5:00 PM"
function formatTimeForDisplay(timeStr: string): string {
  let hours = 0;
  let minutes = 0;
  
  if (timeStr.includes(':')) {
    const [hoursStr, minutesStr] = timeStr.split(':');
    hours = parseInt(hoursStr);
    minutes = parseInt(minutesStr);
  } else {
    // Format like "1700"
    if (timeStr.length <= 2) {
      // Just hours like "9" or "17"
      hours = parseInt(timeStr);
      minutes = 0;
    } else if (timeStr.length === 3) {
      // Format like "930" (9:30)
      hours = parseInt(timeStr.substring(0, 1));
      minutes = parseInt(timeStr.substring(1));
    } else {
      // Format like "0930" or "1700"
      hours = parseInt(timeStr.substring(0, 2));
      minutes = parseInt(timeStr.substring(2));
    }
  }
  
  // Format with AM/PM
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // Convert 0 to 12
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  
  return `${hours}:${minutesStr} ${ampm}`;
}

function isWithinHappyHour(deal: Deal): boolean {
  if (!deal) return false;
  
  // Get the current date in the user's local timezone
  const currentDate = new Date();
  
  // Log current time for debugging
  console.log("Current time: " + currentDate.toLocaleString());
  // Use a proper format and then manually convert to lowercase
  const currentDayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  console.log("Current day: " + currentDayName);
  
  // Use the centralized utility to check if the current day is valid
  // This function handles all case-sensitivity issues and special formats
  if (!isValidDay(deal.valid_days, currentDate)) return false;
  
  // Now check if current time is within happy hour
  const currentHour = currentDate.getHours();
  const currentMinute = currentDate.getMinutes();
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

export function RestaurantCard({ establishment }: RestaurantCardProps) {
  const {
    id,
    name,
    address,
    cuisine,
    imageUrl,
    rating,
    description,
    latitude,
    longitude,
    activeDeals,
  } = establishment;

  // State for user distance
  const [userDistance, setUserDistance] = useState<number | null>(null);
  
  // Get happy hour status and times
  const happyHourInfo = useMemo(() => {
    console.log(`Checking active status for ${name}, deals:`, activeDeals);
    if (!activeDeals || activeDeals.length === 0) {
      return { isActive: false, endTime: null, startTime: null, hasHappyHourToday: false };
    }
    
    // Check which deals are active now
    const currentDate = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysLowercase = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDay = days[currentDate.getDay()];
    const currentDayLowercase = currentDay.toLowerCase();
    
    // Get all deals valid today - use our centralized utility for consistent validation
    const dealsForToday = activeDeals.filter(deal => {
      // Log all deal days for debugging
      console.log(`Deal for ${name}: valid_days="${deal.valid_days}", start_time="${deal.hh_start_time}", current day is "${currentDay}"`);
      
      // Use the centralized utility to check if the current day is valid
      return isValidDay(deal.valid_days, currentDate);
    });
    
    // Check if any deals are active now
    const activeDealsNow = dealsForToday.filter(deal => isWithinHappyHour(deal));
    const isActive = activeDealsNow.length > 0;
    
    // Log for debugging
    console.log(`${name}: Has ${dealsForToday.length} deals for today, ${activeDealsNow.length} are active now`);
    
    // Find the earliest start time and latest end time for today's deals
    let latestEndTime = null;
    let earliestStartTime = null;
    
    // Get current time in minutes since midnight
    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    if (dealsForToday.length > 0) {
      if (isActive) {
        // For active deals, find the latest end time
        latestEndTime = dealsForToday
          .filter(deal => isWithinHappyHour(deal))
          .sort((a, b) => {
            // Convert end times to minutes and compare
            let aEndMinutes = 0;
            let bEndMinutes = 0;
            
            if (a.hh_end_time.includes(':')) {
              const [hours, minutes] = a.hh_end_time.split(':').map(Number);
              aEndMinutes = hours * 60 + minutes;
            } else {
              aEndMinutes = parseInt(a.hh_end_time.substring(0, 2)) * 60 + parseInt(a.hh_end_time.substring(2) || '0');
            }
            
            if (b.hh_end_time.includes(':')) {
              const [hours, minutes] = b.hh_end_time.split(':').map(Number);
              bEndMinutes = hours * 60 + minutes;
            } else {
              bEndMinutes = parseInt(b.hh_end_time.substring(0, 2)) * 60 + parseInt(b.hh_end_time.substring(2) || '0');
            }
            
            return bEndMinutes - aEndMinutes; // Sort descending
          })[0].hh_end_time;
      } else {
        // For inactive deals, find the next upcoming start time (future deals for today)
        const upcomingDeals = dealsForToday.filter(deal => {
          // Convert start time to minutes
          let startMinutes = 0;
          if (deal.hh_start_time.includes(':')) {
            const [hours, minutes] = deal.hh_start_time.split(':').map(Number);
            startMinutes = hours * 60 + minutes;
          } else {
            if (deal.hh_start_time.length <= 2) {
              startMinutes = parseInt(deal.hh_start_time) * 60;
            } else if (deal.hh_start_time.length === 3) {
              startMinutes = parseInt(deal.hh_start_time.substring(0, 1)) * 60 + parseInt(deal.hh_start_time.substring(1));
            } else {
              startMinutes = parseInt(deal.hh_start_time.substring(0, 2)) * 60 + parseInt(deal.hh_start_time.substring(2));
            }
          }
          
          // Only include deals that start in the future
          return startMinutes > currentTimeInMinutes;
        });
        
        if (upcomingDeals.length > 0) {
          // Sort by start time (ascending)
          earliestStartTime = upcomingDeals.sort((a, b) => {
            // Convert start times to minutes and compare
            let aStartMinutes = 0;
            let bStartMinutes = 0;
            
            if (a.hh_start_time.includes(':')) {
              const [hours, minutes] = a.hh_start_time.split(':').map(Number);
              aStartMinutes = hours * 60 + minutes;
            } else {
              aStartMinutes = parseInt(a.hh_start_time.substring(0, 2)) * 60 + parseInt(a.hh_start_time.substring(2) || '0');
            }
            
            if (b.hh_start_time.includes(':')) {
              const [hours, minutes] = b.hh_start_time.split(':').map(Number);
              bStartMinutes = hours * 60 + minutes;
            } else {
              bStartMinutes = parseInt(b.hh_start_time.substring(0, 2)) * 60 + parseInt(b.hh_start_time.substring(2) || '0');
            }
            
            return aStartMinutes - bStartMinutes; // Sort ascending
          })[0].hh_start_time;
        } else if (activeDeals && activeDeals.length > 0) {
          // If no deals starting today, show the earliest start time of any deal
          earliestStartTime = activeDeals
            .sort((a, b) => {
              // Convert start times to minutes and compare
              let aStartMinutes = 0;
              let bStartMinutes = 0;
              
              if (a.hh_start_time.includes(':')) {
                const [hours, minutes] = a.hh_start_time.split(':').map(Number);
                aStartMinutes = hours * 60 + minutes;
              } else {
                aStartMinutes = parseInt(a.hh_start_time.substring(0, 2)) * 60 + parseInt(a.hh_start_time.substring(2) || '0');
              }
              
              if (b.hh_start_time.includes(':')) {
                const [hours, minutes] = b.hh_start_time.split(':').map(Number);
                bStartMinutes = hours * 60 + minutes;
              } else {
                bStartMinutes = parseInt(b.hh_start_time.substring(0, 2)) * 60 + parseInt(b.hh_start_time.substring(2) || '0');
              }
              
              return aStartMinutes - bStartMinutes; // Sort ascending
            })[0].hh_start_time;
        }
      }
    }
    
    return {
      isActive,
      endTime: latestEndTime ? formatTimeForDisplay(latestEndTime) : null,
      startTime: earliestStartTime ? formatTimeForDisplay(earliestStartTime) : null,
      hasHappyHourToday: dealsForToday.length > 0
    };
  }, [activeDeals, name]);
  
  const { isActive, endTime, startTime, hasHappyHourToday } = happyHourInfo;
  
  // Fetch user location and calculate distance
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        // Try to get the user's position
        const position = await getCurrentPosition();
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;
        
        // Calculate distance if establishment has coordinates
        if (latitude && longitude) {
          const distance = calculateDistance(userLat, userLon, latitude, longitude);
          setUserDistance(distance);
        }
      } catch (error) {
        console.error('Error getting location:', error);
        // Use default position if geolocation fails
        if (latitude && longitude) {
          const distance = calculateDistance(
            DEFAULT_POSITION.latitude,
            DEFAULT_POSITION.longitude,
            latitude,
            longitude
          );
          setUserDistance(distance);
        }
      }
    };
    
    getUserLocation();
  }, [latitude, longitude]);

  // Default image if none provided
  const imageUrlToUse = imageUrl || 'https://via.placeholder.com/300x200?text=No+Image';
  
  // Skip description if it's the same as the address (or contains it)
  const shouldShowDescription = description && 
    !description.includes(address) && 
    description !== address;

  return (
    <Link href={`/establishments/${id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
        whileHover={{ 
          scale: 1.03, 
          transition: { duration: 0.2 } 
        }}
        whileTap={{ scale: 0.98 }}
      >
        <Card className="overflow-hidden cursor-pointer h-full flex flex-col rounded-xl scale-90 transform origin-top-left">
          <motion.div 
            className="aspect-[4/3] bg-cover bg-center w-full"
            style={{ backgroundImage: `url(${imageUrlToUse})` }}
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.3 }
            }}
          />
          <CardContent className="p-3 flex-grow">
            <motion.div>
              <motion.h3 
                className="font-medium text-base line-clamp-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {name}
              </motion.h3>
              
              {/* Status badges */}
              <div className="mt-1.5 mb-2">
                {/* Status and time on same line */}
                <motion.div 
                  className="flex items-center justify-between"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {/* Active/Inactive status */}
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-1.5 ${isActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                    <span className={`text-xs ${isActive ? 'text-green-600' : 'text-yellow-600'}`}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {/* Time display - aligned to the right */}
                  {isActive && endTime && (
                    <div className="flex items-center">
                      <FaClock className="h-2 w-2 text-green-600 mr-1" />
                      <span className="text-xs text-green-600">
                        Ends: {endTime}
                      </span>
                    </div>
                  )}
                  {!isActive && startTime && hasHappyHourToday && (
                    <div className="flex items-center">
                      <FaClock className="h-2 w-2 text-yellow-600 mr-1" />
                      <span className="text-xs text-yellow-600">
                        Starts: {startTime}
                      </span>
                    </div>
                  )}
                </motion.div>
              </div>
              
              {/* Rating and distance on same line */}
              <motion.div 
                className="flex gap-2 items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {rating && (
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 text-yellow-700 border-yellow-200">
                      <FaStar className="h-3 w-3" />
                      <span>{rating.toFixed(1)}</span>
                    </Badge>
                  </motion.div>
                )}
                
                {userDistance !== null && (
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
                      <FaWalking className="h-3 w-3" />
                      {formatDistance(userDistance)}
                    </Badge>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}

export function RestaurantCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
    >
      <Card className="overflow-hidden h-full flex flex-col rounded-xl scale-90 transform origin-top-left">
        <div className="aspect-[4/3] bg-gray-200 animate-pulse w-full" />
        <CardContent className="p-3 flex-grow">
          {/* Restaurant name */}
          <motion.div 
            className="h-5 bg-gray-200 animate-pulse w-3/4 rounded-md mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          />
          
          {/* Active status and time */}
          <div className="mt-1.5 mb-2">
            <motion.div 
              className="flex items-center justify-between"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-gray-200 animate-pulse mr-1.5"></div>
                <div className="h-4 bg-gray-200 animate-pulse w-16 rounded-md"></div>
              </div>
              <div className="flex items-center">
                <div className="h-2 w-2 bg-gray-200 animate-pulse rounded-full mr-1"></div>
                <div className="h-4 bg-gray-200 animate-pulse w-20 rounded-md"></div>
              </div>
            </motion.div>
          </div>
          
          {/* Rating and distance */}
          <motion.div 
            className="flex gap-2 mt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="h-6 bg-gray-200 animate-pulse w-16 rounded-full" />
            <div className="h-6 bg-gray-200 animate-pulse w-16 rounded-full" />
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}