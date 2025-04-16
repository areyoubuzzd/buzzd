import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FaStar, FaWalking } from 'react-icons/fa';
import { calculateDistance, formatDistance, getCurrentPosition, DEFAULT_POSITION } from '@/lib/distance-utils';

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
}

interface RestaurantCardProps {
  establishment: EstablishmentData;
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
  } = establishment;

  // State for user distance
  const [userDistance, setUserDistance] = useState<number | null>(null);
  
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
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg line-clamp-1">{name}</h3>
            {rating && (
              <div className="flex items-center gap-1 text-yellow-500">
                <FaStar />
                <span>{rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          
          <div className="mt-2 flex flex-wrap gap-2 items-center">
            <Badge variant="outline" className="bg-primary/10">{cuisine}</Badge>
            
            {userDistance !== null && (
              <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
                <FaWalking className="h-3 w-3" />
                {formatDistance(userDistance)}
              </Badge>
            )}
          </div>
          
          {shouldShowDescription && (
            <p className="mt-3 text-sm text-gray-600 line-clamp-2">{description}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export function RestaurantCardSkeleton() {
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="aspect-square bg-gray-200 animate-pulse w-full" />
      <CardContent className="p-4 flex-grow">
        <div className="h-6 bg-gray-200 animate-pulse w-3/4 rounded-md mb-2" />
        <div className="h-4 bg-gray-200 animate-pulse w-full rounded-md mb-3" />
        <div className="h-6 bg-gray-200 animate-pulse w-1/3 rounded-md mb-3" />
        <div className="h-4 bg-gray-200 animate-pulse w-full rounded-md" />
      </CardContent>
    </Card>
  );
}