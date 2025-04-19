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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [categoryTab, setCategoryTab] = useState('all');
  const [, navigate] = useWouterLocation();
  
  // Get location from context
  const { location, updateLocation } = useLocation();

  // Fetch all deals from the API
  const { data: dealsData, isLoading } = useQuery({
    queryKey: ['/api/deals/collections/all', { lat: location.lat, lng: location.lng }],
    enabled: !!location.lat,
  });

  // Filter to only wine & spirits deals and add active status
  const wineAndSpiritDeals = React.useMemo(() => {
    if (!dealsData) return [];
    
    // Cast dealsData to Deal[] to fix TypeScript error
    const deals_array = (dealsData as Deal[]);

    // Filter to wine and spirits deals
    let deals = deals_array.filter((deal: Deal) => 
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

  // Store the current page in sessionStorage for proper back navigation
  useEffect(() => {
    sessionStorage.setItem('lastVisitedPage', '/wine-spirits');
    console.log('Set lastVisitedPage to /wine-spirits in sessionStorage');
  }, []);

  const handleSearchClear = () => {
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-[#232946]">
      {/* Header with Logo */}
      <header className="sticky top-0 z-50 bg-[#EAE6E1] shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-[4.5rem]">
            <div className="flex items-center">
              <Link href="/">
                <div className="flex items-center cursor-pointer" style={{ marginLeft: "-12px" }}>
                  <img 
                    src={logoBlack} 
                    alt="Buzzd Logo" 
                    className="h-[4rem]"
                  />
                </div>
              </Link>
            </div>
            
            {/* Search bar */}
            <div className="relative w-40">
              <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 rounded-md border-gray-300 text-sm"
              />
            </div>
          </div>
        </div>
      </header>
      
      {/* Location Header */}
      <LocationHeader onOpenFilters={() => console.log("Open filters")} />
      
      {/* Wine & Spirits Page Heading */}
      <div className="bg-[#232946] px-4 py-6 border-b border-[#353e6b]">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-white">Wine & Spirits</h1>
          <p className="text-gray-300 mt-1">Discover wine and spirits deals near you</p>
        </div>
      </div>
      
      {/* Tabs to switch between all/wine/spirits */}
      <div className="bg-[#282f57] px-4 pt-3 border-b border-[#353e6b]">
        <Tabs
          value={categoryTab}
          onValueChange={setCategoryTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 mb-2 bg-[#353e6b] text-white">
            <TabsTrigger value="all" className="data-[state=active]:bg-amber-400 data-[state=active]:text-[#232946]">All</TabsTrigger>
            <TabsTrigger value="wine" className="data-[state=active]:bg-amber-400 data-[state=active]:text-[#232946]">Wine</TabsTrigger>
            <TabsTrigger value="spirits" className="data-[state=active]:bg-amber-400 data-[state=active]:text-[#232946]">Spirits</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-[#282f57] px-4 py-3 border-b border-[#353e6b] sticky top-[4.5rem] z-10">
        <div className="container mx-auto">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by name, type or bar..."
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
            />
          </div>
        </div>
      </div>
      
      {/* Results Count */}
      <div className="bg-[#232946] px-4 py-2 border-b border-[#353e6b]">
        <div className="container mx-auto">
          <p className="text-sm text-gray-300">
            {wineAndSpiritDeals.length} {categoryTab === 'wine' ? 'wine' : categoryTab === 'spirits' ? 'spirits' : 'wine & spirits'} {wineAndSpiritDeals.length === 1 ? 'deal' : 'deals'} found
            {activeOnly ? ' (active now)' : ''}
            {searchQuery ? ` for "${searchQuery}"` : ''}
          </p>
        </div>
      </div>
      
      {/* Wine & Spirits Deals List */}
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
          ) : wineAndSpiritDeals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="bg-[#353e6b] p-4 rounded-full mb-4">
                <FiFilter className="h-8 w-8 text-amber-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-1">No {categoryTab === 'wine' ? 'wine' : categoryTab === 'spirits' ? 'spirits' : 'wine & spirits'} deals found</h3>
              <p className="text-gray-300 max-w-md">
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
                  {categoryTab !== 'all' && (
                    <Badge 
                      variant="outline" 
                      className="flex items-center gap-1 cursor-pointer hover:bg-[#353e6b] border-amber-400 text-amber-400"
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