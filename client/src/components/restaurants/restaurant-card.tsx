import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FaStar, FaWalking, FaClock } from 'react-icons/fa';
import { calculateDistance, formatDistance, getCurrentPosition, DEFAULT_POSITION } from '@/lib/distance-utils';

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
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = days[now.getDay()];
    
    // Get all deals valid today
    const dealsForToday = activeDeals.filter(deal => {
      // Daily
      if (deal.valid_days.toLowerCase() === 'daily' || deal.valid_days.toLowerCase() === 'all days') {
        return true;
      }
      // Weekends
      if (deal.valid_days.toLowerCase() === 'weekends' && (currentDay === 'Sat' || currentDay === 'Sun')) {
        return true;
      }
      // Weekdays
      if (deal.valid_days.toLowerCase() === 'weekdays' && currentDay !== 'Sat' && currentDay !== 'Sun') {
        return true;
      }
      // Ranges like "Mon-Fri"
      if (deal.valid_days.includes('-')) {
        const [startDay, endDay] = deal.valid_days.split('-').map(d => d.trim());
        const startIdx = days.findIndex(d => d === startDay);
        const endIdx = days.findIndex(d => d === endDay);
        const currentIdx = now.getDay();
        
        if (startIdx <= endIdx) {
          return currentIdx >= startIdx && currentIdx <= endIdx;
        } else {
          // Handle wrapping around like "Fri-Sun" (includes Fri, Sat, Sun)
          return currentIdx >= startIdx || currentIdx <= endIdx;
        }
      }
      // Comma-separated lists like "Mon, Wed, Fri"
      if (deal.valid_days.includes(',')) {
        const validDays = deal.valid_days.split(',').map(d => d.trim());
        return validDays.includes(currentDay);
      }
      // Single day
      return deal.valid_days.trim() === currentDay;
    });
    
    // Check if any deals are active now
    const activeDealsNow = dealsForToday.filter(deal => isWithinHappyHour(deal));
    const isActive = activeDealsNow.length > 0;
    
    // Find the earliest start time and latest end time for today's deals
    let latestEndTime = null;
    let earliestStartTime = null;
    
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
        // For inactive deals, find the earliest start time
        earliestStartTime = dealsForToday
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
      <Card className="overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 h-full flex flex-col rounded-xl">
        <div 
          className="aspect-square bg-cover bg-center w-full"
          style={{ backgroundImage: `url(${imageUrlToUse})` }}
        />
        <CardContent className="p-5 flex-grow">
          <div>
            <h3 className="font-medium text-base line-clamp-1">{name}</h3>
            
            {/* Happy Hour status indicator */}
            <div className="mt-1.5 mb-2">
              {/* Status indicator */}
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                <span className={`text-xs ${isActive ? 'text-green-600' : 'text-yellow-600'}`}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              {/* Time indicator with clock */}
              {isActive && endTime && (
                <div className="flex items-center mt-1 ml-3.5">
                  <FaClock className="h-2.5 w-2.5 text-green-600" />
                  <span className="text-xs text-green-600 ml-1">
                    Ends: {endTime}
                  </span>
                </div>
              )}
              {!isActive && hasHappyHourToday && startTime && (
                <div className="flex items-center mt-1 ml-3.5">
                  <FaClock className="h-2.5 w-2.5 text-yellow-600" />
                  <span className="text-xs text-yellow-600 ml-1">
                    Starts: {startTime}
                  </span>
                </div>
              )}
            </div>
            
            {/* Rating and distance on same line */}
            <div className="flex gap-2 items-center">
              {rating && (
                <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 text-yellow-700 border-yellow-200">
                  <FaStar className="h-3 w-3" />
                  <span>{rating.toFixed(1)}</span>
                </Badge>
              )}
              
              {userDistance !== null && (
                <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
                  <FaWalking className="h-3 w-3" />
                  {formatDistance(userDistance)}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function RestaurantCardSkeleton() {
  return (
    <Card className="overflow-hidden h-full flex flex-col rounded-xl">
      <div className="aspect-square bg-gray-200 animate-pulse w-full" />
      <CardContent className="p-5 flex-grow">
        {/* Restaurant name */}
        <div className="h-5 bg-gray-200 animate-pulse w-3/4 rounded-md mb-3" />
        
        {/* Active status */}
        <div className="flex flex-col mt-1.5 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="h-4 bg-gray-200 animate-pulse w-24 rounded-md"></div>
          </div>
          <div className="h-4 bg-gray-200 animate-pulse w-20 rounded-md ml-3.5 mt-0.5"></div>
        </div>
        
        {/* Rating and distance */}
        <div className="flex gap-2 mt-2">
          <div className="h-6 bg-gray-200 animate-pulse w-16 rounded-full" />
          <div className="h-6 bg-gray-200 animate-pulse w-16 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}