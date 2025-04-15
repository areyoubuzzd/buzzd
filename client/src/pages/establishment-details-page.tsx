import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { FaStar, FaMapMarkerAlt, FaArrowLeft, FaWalking } from 'react-icons/fa';
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
            <Link href="/restaurants">
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 mb-2">
                <FaArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{establishment.name}</h1>
            <div className="flex items-center mt-1">
              <FaMapMarkerAlt className="mr-1" />
              <span className="text-sm">{establishment.address}</span>
            </div>
            {establishment.rating && (
              <div className="flex items-center mt-1 text-yellow-400">
                <FaStar className="mr-1" />
                <span>{establishment.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge variant="outline" className="bg-primary/10">{establishment.cuisine}</Badge>
          
          {userDistance !== null && (
            <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
              <FaWalking className="h-3 w-3" />
              {formatDistance(userDistance)}
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
                  <div className="mt-2 text-sm">
                    <p>Valid: {deal.valid_days}</p>
                    <p>{deal.hh_start_time} - {deal.hh_end_time}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {establishment.latitude && establishment.longitude && (
          <>
            <h2 className="text-xl font-bold mt-6 mb-4">Location</h2>
            <div className="rounded-lg overflow-hidden h-48 bg-gray-100">
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${establishment.latitude},${establishment.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-full bg-center bg-cover"
                style={{
                  backgroundImage: `url(https://maps.googleapis.com/maps/api/staticmap?center=${establishment.latitude},${establishment.longitude}&zoom=15&size=600x300&maptype=roadmap&markers=color:red%7C${establishment.latitude},${establishment.longitude}&key=${process.env.GOOGLE_MAPS_API_KEY})`
                }}
              />
            </div>
          </>
        )}
      </div>
      
      <Navigation />
    </div>
  );
}