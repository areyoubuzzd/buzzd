import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FiSearch, FiFilter, FiX, FiClock } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useLocation as useWouterLocation } from 'wouter';
import { Link } from 'wouter';

import { Button } from '@/components/ui/button';
import Navigation from '@/components/layout/navigation';
import { LocationHeader } from '@/components/location/location-header';
import { useLocation } from '@/contexts/location-context';
import { Input } from '@/components/ui/input';
import SquareDealCard from '@/components/deals/square-deal-card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isDealActiveNow } from '@/lib/time-utils';
import logoBlack from '@/assets/logo_black.png';

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

export default function WineSpiritsPage() {
  const queryClient = useQueryClient();
  const [location, setLocation] = useState<{ lat: number; lng: number }>({ 
    // Default to Singapore
    lat: 1.3521, 
    lng: 103.8198 
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [userPostalCode, setUserPostalCode] = useState('');
  const [userRoadName, setUserRoadName] = useState('Singapore');
  const [categoryTab, setCategoryTab] = useState('all');
  const [, setLocation_] = useLocation();

  // Fetch all deals from the API
  const { data: dealsData, isLoading } = useQuery({
    queryKey: ['/api/deals/collections/all', { lat: location.lat, lng: location.lng }],
    enabled: !!location.lat,
  });

  // Filter to only wine & spirits deals and add active status
  const wineAndSpiritDeals = React.useMemo(() => {
    if (!dealsData) return [];

    // Filter to wine and spirits deals
    let deals = dealsData.filter((deal: Deal) => 
      deal.alcohol_category.toLowerCase() === 'wine' || 
      deal.alcohol_category.toLowerCase() === 'spirits'
    );

    // Add isActive flag based on current time
    deals = deals.map((deal: Deal) => ({
      ...deal,
      isActive: isDealActiveNow(deal),
    }));

    // Filter by selected category if needed
    if (categoryTab === 'wine') {
      deals = deals.filter((deal: Deal) => 
        deal.alcohol_category.toLowerCase() === 'wine'
      );
    } else if (categoryTab === 'spirits') {
      deals = deals.filter((deal: Deal) => 
        deal.alcohol_category.toLowerCase() === 'spirits'
      );
    }

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
  }, [dealsData, searchQuery, activeOnly, categoryTab]);

  useEffect(() => {
    // Try to get user's location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          // Default to Singapore
        }
      );
    }
    
    // Listen for postal code and road name updates
    const handlePostalCodeUpdate = (event: CustomEvent) => {
      if (event.detail) {
        if (event.detail.postalCode) {
          setUserPostalCode(event.detail.postalCode);
        }
        if (event.detail.roadName) {
          setUserRoadName(event.detail.roadName);
        }
      }
    };
    
    window.addEventListener('postalCodeUpdated', handlePostalCodeUpdate as EventListener);
    
    return () => {
      window.removeEventListener('postalCodeUpdated', handlePostalCodeUpdate as EventListener);
    };
  }, []);

  const handleLocationChange = (newLocation: { lat: number; lng: number }) => {
    setLocation(newLocation);
    
    // Invalidate query to refetch with new location
    queryClient.invalidateQueries({ 
      queryKey: ['/api/deals/collections/all', { lat: newLocation.lat, lng: newLocation.lng }]
    });
  };

  const handleSearchClear = () => {
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Header />
      
      <LocationBar 
        onLocationChange={handleLocationChange}
        onOpenFilters={() => {}} 
      />
      
      {/* Wine & Spirits Page Heading */}
      <div className="bg-purple-50 px-4 py-6 border-b border-purple-100">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-purple-900">Wine & Spirits</h1>
          <p className="text-purple-700 mt-1">Discover wine and spirits deals near you</p>
        </div>
      </div>
      
      {/* Tabs to switch between all/wine/spirits */}
      <div className="bg-white px-4 pt-3 border-b border-gray-200">
        <Tabs
          value={categoryTab}
          onValueChange={setCategoryTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 mb-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="wine">Wine</TabsTrigger>
            <TabsTrigger value="spirits">Spirits</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by name, type or bar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 py-2 w-full rounded-lg border-gray-300"
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
              <FiClock className="h-4 w-4 text-purple-600" />
              <Label htmlFor="active-toggle" className="text-sm font-medium text-gray-700">
                Show active deals only
              </Label>
            </div>
            <Switch
              id="active-toggle"
              checked={activeOnly}
              onCheckedChange={setActiveOnly}
            />
          </div>
        </div>
      </div>
      
      {/* Results Count */}
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <div className="container mx-auto">
          <p className="text-sm text-gray-600">
            {wineAndSpiritDeals.length} {categoryTab === 'wine' ? 'wine' : categoryTab === 'spirits' ? 'spirits' : 'wine & spirits'} {wineAndSpiritDeals.length === 1 ? 'deal' : 'deals'} found
            {activeOnly ? ' (active now)' : ''}
            {searchQuery ? ` for "${searchQuery}"` : ''}
          </p>
        </div>
      </div>
      
      {/* Wine & Spirits Deals List */}
      <div className="flex-1 bg-gray-100">
        <div className="container mx-auto px-4 py-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-8 w-8 bg-purple-300 rounded-full mb-2"></div>
                <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : wineAndSpiritDeals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="bg-purple-100 p-4 rounded-full mb-4">
                <FiFilter className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No {categoryTab === 'wine' ? 'wine' : categoryTab === 'spirits' ? 'spirits' : 'wine & spirits'} deals found</h3>
              <p className="text-gray-500 max-w-md">
                {activeOnly 
                  ? `There are no active ${categoryTab === 'wine' ? 'wine' : categoryTab === 'spirits' ? 'spirits' : 'wine & spirits'} deals right now. Try turning off the 'active only' filter.`
                  : searchQuery 
                    ? `No ${categoryTab === 'wine' ? 'wine' : categoryTab === 'spirits' ? 'spirits' : 'wine & spirits'} deals match "${searchQuery}". Try a different search term.`
                    : `We couldn't find any ${categoryTab === 'wine' ? 'wine' : categoryTab === 'spirits' ? 'spirits' : 'wine & spirits'} deals in this area. Try changing your location.`}
              </p>
              {(activeOnly || searchQuery || categoryTab !== 'all') && (
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {activeOnly && (
                    <Badge 
                      variant="outline" 
                      className="flex items-center gap-1 cursor-pointer hover:bg-purple-50"
                      onClick={() => setActiveOnly(false)}
                    >
                      Active only <FiX className="h-3 w-3" />
                    </Badge>
                  )}
                  {searchQuery && (
                    <Badge 
                      variant="outline" 
                      className="flex items-center gap-1 cursor-pointer hover:bg-purple-50"
                      onClick={handleSearchClear}
                    >
                      "{searchQuery}" <FiX className="h-3 w-3" />
                    </Badge>
                  )}
                  {categoryTab !== 'all' && (
                    <Badge 
                      variant="outline" 
                      className="flex items-center gap-1 cursor-pointer hover:bg-purple-50"
                      onClick={() => setCategoryTab('all')}
                    >
                      {categoryTab === 'wine' ? 'Wine only' : 'Spirits only'} <FiX className="h-3 w-3" />
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
                {wineAndSpiritDeals.map((deal: Deal) => (
                  <SquareDealCard 
                    key={deal.id}
                    deal={deal}
                    userLocation={location}
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