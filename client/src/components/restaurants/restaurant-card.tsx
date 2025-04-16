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
  
  // Check if any deal is active now
  const isActive = useMemo(() => {
    console.log(`Checking active status for ${name}, deals:`, activeDeals);
    if (!activeDeals || activeDeals.length === 0) return false;
    return activeDeals.some(deal => isWithinHappyHour(deal));
  }, [activeDeals, name]);
  
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
            <div className="flex items-center gap-1.5 mt-1.5 mb-2">
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
              <span className={`text-xs ${isActive ? 'text-green-600' : 'text-yellow-600'}`}>
                {isActive ? 'Active now' : 'Inactive'}
              </span>
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
        <div className="flex items-center gap-1.5 mt-1.5 mb-2">
          <div className="w-2 h-2 rounded-full bg-gray-200 animate-pulse"></div>
          <div className="h-4 bg-gray-200 animate-pulse w-16 rounded-md"></div>
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