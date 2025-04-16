import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { FaStar, FaMapMarkerAlt, FaArrowLeft, FaWalking, FaPhone, FaGlobe, FaMapMarkedAlt, FaClock } from 'react-icons/fa';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import Navigation from '@/components/layout/navigation';
import { calculateDistance, formatDistance, getCurrentPosition, DEFAULT_POSITION } from '@/lib/distance-utils';

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
}

interface EstablishmentDetailsResponse {
  establishment: Establishment;
  activeDeals: Deal[];
}

// Helper function to check if we're within happy hour
const isWithinHappyHour = (deal: Deal): boolean => {
  // Get the current date in Singapore time (GMT+8)
  const now = new Date();
  now.setUTCHours(now.getUTCHours() + 8); // Convert to Singapore time (GMT+8)
  
  // Get current day name
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDay = days[now.getDay()];
  
  // Check if current day is in valid days
  // Common formats: "Mon-Fri", "Mon,Tue,Thu", "Daily", "Weekends"
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
    const hours = parseInt(timeStr.substring(0, timeStr.length - 2));
    const minutes = parseInt(timeStr.substring(timeStr.length - 2));
    startTime = hours * 60 + minutes;
  }
  
  // Parse end time
  if (deal.hh_end_time.includes(':')) {
    const [hours, minutes] = deal.hh_end_time.split(':').map(Number);
    endTime = hours * 60 + (minutes || 0);
  } else {
    // Format like "1700"
    const timeStr = deal.hh_end_time;
    const hours = parseInt(timeStr.substring(0, timeStr.length - 2));
    const minutes = parseInt(timeStr.substring(timeStr.length - 2));
    endTime = hours * 60 + minutes;
  }
  
  // Check if current time is within happy hour range
  if (startTime <= endTime) {
    // Normal case: e.g. 17:00 - 20:00
    return currentTime >= startTime && currentTime <= endTime;
  } else {
    // Overnight case: e.g. 22:00 - 02:00
    return currentTime >= startTime || currentTime <= endTime;
  }
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

export default function EstablishmentDetailsPage() {
  const [, params] = useRoute('/establishments/:id');
  const id = params?.id;
  const [userPosition, setUserPosition] = useState(DEFAULT_POSITION);
  const [userDistance, setUserDistance] = useState<number | null>(null);
  
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
    enabled: !!id,
  });
  
  // For debugging
  useEffect(() => {
    if (data) {
      console.log("Establishment details loaded:", data);
    }
  }, [data]);
  
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
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-red-500 mb-4">Error loading restaurant details</p>
        <Button asChild variant="outline">
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
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="mb-4">Restaurant not found</p>
        <Button asChild variant="outline">
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
    <div className="pb-20">
      <div 
        className="h-48 bg-cover bg-center relative"
        style={{ 
          backgroundImage: establishment.imageUrl 
            ? `url(${establishment.imageUrl})` 
            : 'linear-gradient(to right, var(--primary), var(--primary-foreground))' 
        }}
      >
        <div className="absolute inset-0 bg-black/40 flex items-end">
          <div className="p-4 text-white">
            <Link href="/">
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 mb-2">
                <FaArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {/* Restaurant Name as Title */}
        <h1 className="text-2xl font-bold mb-2">{establishment.name}</h1>
        
        {/* Happy Hours Section with active indicator */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <FaClock className="text-primary" />
            <h3 className="text-lg font-semibold">Happy Hours</h3>
            {happyHour.isActive && (
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1"></div>
                <span className="text-xs text-green-600 font-medium">Active now</span>
              </div>
            )}
          </div>
          <div className="pl-6 text-sm text-gray-600">
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
        
        <h2 className="text-xl font-bold mb-4">Active Deals</h2>
        
        {activeDeals.length === 0 ? (
          <p className="text-gray-500">No active deals at this time.</p>
        ) : (
          <div className="grid gap-4">
            {activeDeals.map(deal => (
              <Card key={deal.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-bold">{deal.drink_name}</h3>
                      <p className="text-sm text-gray-500">{deal.alcohol_category} {deal.alcohol_subcategory}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 line-through">${deal.standard_price.toFixed(2)}</p>
                      <p className="font-bold text-primary">${deal.happy_hour_price.toFixed(2)}</p>
                      <p className="text-xs text-green-600">Save {deal.savings_percentage}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        <h2 className="text-xl font-bold mt-6 mb-4">Contact & Location</h2>
        <div className="grid gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FaMapMarkerAlt className="text-primary h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-sm text-gray-600">{establishment.address}</p>
                    <p className="text-sm text-gray-600">{establishment.city} {establishment.postalCode}</p>
                  </div>
                </div>
                
                {establishment.phone && (
                  <div className="flex items-center gap-2">
                    <FaPhone className="text-primary h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <a 
                        href={`tel:${establishment.phone}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {establishment.phone}
                      </a>
                    </div>
                  </div>
                )}
                
                {establishment.website && (
                  <div className="flex items-center gap-2">
                    <FaGlobe className="text-primary h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Website</p>
                      <a 
                        href={establishment.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all"
                      >
                        {establishment.website}
                      </a>
                    </div>
                  </div>
                )}
                
                {establishment.latitude && establishment.longitude && (
                  <div className="flex items-center gap-2">
                    <FaMapMarkedAlt className="text-primary h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Directions</p>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${establishment.latitude},${establishment.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Open in Google Maps
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {establishment.latitude && establishment.longitude && (
          <div className="rounded-lg overflow-hidden h-48 bg-gray-100 mb-6">
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${establishment.latitude},${establishment.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full h-full bg-gray-50 text-gray-700"
            >
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <FaMapMarkedAlt size={32} />
                </div>
                <span className="text-sm font-medium">View on Google Maps</span>
              </div>
            </a>
          </div>
        )}
      </div>
      
      <Navigation />
    </div>
  );
}