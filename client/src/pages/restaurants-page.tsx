import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RestaurantCard, RestaurantCardSkeleton } from '@/components/restaurants/restaurant-card';
import Navigation from '@/components/layout/navigation';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

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
}

export default function RestaurantsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const { 
    data: establishments, 
    isLoading, 
    error 
  } = useQuery<Establishment[]>({
    queryKey: ['/api/establishments'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

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

  return (
    <div className="pb-20">
      <div className="bg-primary text-white py-4 px-4 sticky top-0 z-10">
        <h1 className="text-2xl font-bold mb-2">Restaurants</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            className="bg-white/10 border-0 focus-visible:ring-1 text-white pl-10"
            placeholder="Search restaurants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <RestaurantCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center p-8 text-red-500">
            <p>Error loading restaurants.</p>
            <p className="text-sm">{(error as Error).message}</p>
          </div>
        ) : filteredEstablishments?.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <p>No restaurants found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredEstablishments?.map((establishment: Establishment) => (
              <RestaurantCard 
                key={establishment.id} 
                establishment={establishment} 
              />
            ))}
          </div>
        )}
      </div>
      
      <Navigation />
    </div>
  );
}