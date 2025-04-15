import React from 'react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FaStar } from 'react-icons/fa';

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
  } = establishment;

  // Default image if none provided
  const imageUrlToUse = imageUrl || 'https://via.placeholder.com/300x200?text=No+Image';

  return (
    <Link href={`/establishments/${id}`}>
      <Card className="overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
        <div 
          className="h-40 bg-cover bg-center w-full"
          style={{ backgroundImage: `url(${imageUrlToUse})` }}
        />
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg line-clamp-1">{name}</h3>
            {rating && (
              <div className="flex items-center gap-1 text-yellow-500">
                <FaStar />
                <span>{rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          
          <div className="mt-1 text-sm text-gray-500 line-clamp-1">{address}</div>
          
          <div className="mt-2 flex gap-2">
            <Badge variant="outline" className="bg-primary/10">{cuisine}</Badge>
          </div>
          
          {description && (
            <p className="mt-3 text-sm text-gray-600 line-clamp-2">{description}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export function RestaurantCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="h-40 bg-gray-200 animate-pulse w-full" />
      <CardContent className="p-4">
        <div className="h-6 bg-gray-200 animate-pulse w-3/4 rounded-md mb-2" />
        <div className="h-4 bg-gray-200 animate-pulse w-full rounded-md mb-3" />
        <div className="h-6 bg-gray-200 animate-pulse w-1/3 rounded-md mb-3" />
        <div className="h-4 bg-gray-200 animate-pulse w-full rounded-md" />
      </CardContent>
    </Card>
  );
}