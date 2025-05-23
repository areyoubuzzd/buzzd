import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FiSearch, FiFilter, FiX, FiClock } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useLocation as useWouterLocation } from 'wouter';

import { Button } from '@/components/ui/button';
import Navigation from '@/components/layout/navigation';
import AppHeader from '@/components/layout/app-header';

import { useLocation } from '@/contexts/location-context';
import { Input } from '@/components/ui/input';
import SquareDealCard from '@/components/deals/square-deal-card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { isDealActiveNow } from '@/lib/time-utils';

type Deal = {
  id: number;
  establishmentId: number;
  alcohol_category: string;
  alcohol_subcategory?: string | null;
  alcohol_subcategory2?: string | null;
  drink_name?: string | null;
  standard_price: number;
  happy_hour_price: number;
  savings?: number;
  savings_percentage?: number;
  valid_days: string;
  hh_start_time: string;
  hh_end_time: string;
  collections?: string | null;
  description?: string | null;
  distance?: number;
  isActive?: boolean;
  establishment?: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    [key: string]: any;
  }
};

export default function BeerPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOnly, setActiveOnly] = useState(false); // Default to show all deals
  const [, navigate] = useWouterLocation();
  
  // Get user's device location from context
  const { userPosition } = useLocation();

  // Fetch all deals from the API with 10km radius - using device location only
  const { data: dealsData, isLoading } = useQuery({
    queryKey: ['/api/deals/collections/all', { lat: userPosition.lat, lng: userPosition.lng, radius: 10 }],
    enabled: !!userPosition.lat,
  });

  // Show ALL deals within 10km (not just beer)
  const allNearbyDeals = React.useMemo(() => {
    if (!dealsData) return [];
    
    // Cast dealsData to Deal[] to fix TypeScript error
    const deals_array = (dealsData as Deal[]);

    // No filter by alcohol_category - we want ALL deals
    let deals = deals_array;

    // Add isActive flag based on current time
    deals = deals.map((deal: Deal) => ({
      ...deal,
      isActive: isDealActiveNow(deal),
    }));

    // Filter by search query if present
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      deals = deals.filter((deal: Deal) => 
        (deal.drink_name && deal.drink_name.toLowerCase().includes(query)) ||
        (deal.alcohol_subcategory && deal.alcohol_subcategory.toLowerCase().includes(query)) ||
        (deal.establishment?.name && deal.establishment.name.toLowerCase().includes(query))
      );
    }

    // Filter to only active deals if the toggle is on
    if (activeOnly) {
      deals = deals.filter((deal: Deal) => deal.isActive);
    }

    // Sort by: active status first, then distance
    return deals.sort((a: Deal, b: Deal) => {
      // First by active status
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      
      // Then by distance
      return (a.distance || 999) - (b.distance || 999);
    });
  }, [dealsData, searchQuery, activeOnly]);

  // Store the current page in sessionStorage and ensure we have the latest device location
  useEffect(() => {
    sessionStorage.setItem('lastVisitedPage', '/beer');
    console.log('Set lastVisitedPage to /beer in sessionStorage');
    
    // Try to get a fresh GPS reading when this page loads
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('BeerPage: Got fresh GPS position');
          // No need to update here, the context's userPosition will be updated automatically
        },
        (error) => {
          console.error('BeerPage: Error getting GPS position:', error);
        }
      );
    }
  }, []);

  const handleSearchClear = () => {
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-[#232946]">
      {/* App Header with User Greeting */}
      <AppHeader />
      
      {/* Page Heading */}
      <div className="bg-[#232946] px-4 py-6 border-b border-[#353e6b]">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-white">Deals around you</h1>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-[#282f57] px-4 py-3 border-b border-[#353e6b] sticky top-[4.5rem] z-10">
        <div className="container mx-auto">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search deals by name, type or bar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 py-2 w-full rounded-lg border-[#353e6b]"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSearchClear}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 rounded-full"
              >
                <FiX />
              </Button>
            )}
          </div>
          
          {/* Active Only Toggle */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-2">
              <FiClock className="h-4 w-4 text-amber-400" />
              <Label htmlFor="active-toggle" className="text-sm font-medium text-gray-200">
                Show active deals only
              </Label>
            </div>
            <Switch
              id="active-toggle"
              checked={activeOnly}
              onCheckedChange={setActiveOnly}
              className={activeOnly ? "bg-green-500 data-[state=checked]:bg-green-500" : ""}
            />
          </div>
        </div>
      </div>
      
      {/* Deals List */}
      <div className="flex-1 bg-[#232946]">
        <div className="container mx-auto px-4 py-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-8 w-8 bg-amber-300 rounded-full mb-2"></div>
                <div className="h-4 w-32 bg-[#353e6b] rounded mb-2"></div>
                <div className="h-3 w-24 bg-[#353e6b] rounded"></div>
              </div>
            </div>
          ) : allNearbyDeals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="bg-[#353e6b] p-4 rounded-full mb-4">
                <FiFilter className="h-8 w-8 text-amber-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-1">No deals found</h3>
              <p className="text-gray-300 max-w-md">
                {activeOnly 
                  ? "There are no active deals right now. Try turning off the 'active only' filter."
                  : searchQuery 
                    ? `No deals match "${searchQuery}". Try a different search term.`
                    : "We couldn't find any deals in this area. Try changing your location."}
              </p>
              {(activeOnly || searchQuery) && (
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {activeOnly && (
                    <Badge 
                      variant="outline" 
                      className="flex items-center gap-1 cursor-pointer hover:bg-[#353e6b] border-amber-400 text-amber-400"
                      onClick={() => setActiveOnly(false)}
                    >
                      Active only <FiX className="h-3 w-3" />
                    </Badge>
                  )}
                  {searchQuery && (
                    <Badge 
                      variant="outline" 
                      className="flex items-center gap-1 cursor-pointer hover:bg-[#353e6b] border-amber-400 text-amber-400"
                      onClick={handleSearchClear}
                    >
                      "{searchQuery}" <FiX className="h-3 w-3" />
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allNearbyDeals.map((deal: Deal) => (
                  <SquareDealCard 
                    key={deal.id}
                    deal={deal}
                    userLocation={userPosition}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
      
      <Navigation />
    </div>
  );
}