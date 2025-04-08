import { useState, useMemo } from "react";
import DealCard from "./deal-card";
import PremiumPrompt from "../premium/premium-prompt";
import PremiumUpgrade from "../premium/premium-upgrade";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import type { DealWithEstablishment } from "@shared/schema";
import { Button } from "@/components/ui/button";

// Updated FilterType to match the new filter-bar component
type FilterType = 'active' | 'one-for-one' | 'high-savings' | 'beer' | 'wine' | 'whisky';

interface DealsListProps {
  location: { lat: number; lng: number };
  activeFilter: FilterType;
}

// Sample Singapore establishments for demo
const SINGAPORE_ESTABLISHMENTS = [
  { id: 1, name: "Atlas Bar", type: "Cocktail Bar", neighborhood: "Bugis", rating: 4.8, latitude: 1.3002, longitude: 103.8559, imageUrl: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
  { id: 2, name: "Manhattan Bar", type: "Cocktail Bar", neighborhood: "Orchard", rating: 4.7, latitude: 1.3045, longitude: 103.8270, imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
  { id: 3, name: "Native", type: "Cocktail Bar", neighborhood: "Telok Ayer", rating: 4.6, latitude: 1.2803, longitude: 103.8452, imageUrl: "https://images.unsplash.com/photo-1561047029-3000c68339ca?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
  { id: 4, name: "28 HongKong Street", type: "Speakeasy", neighborhood: "Clarke Quay", rating: 4.6, latitude: 1.2890, longitude: 103.8463, imageUrl: "https://images.unsplash.com/photo-1525268323446-0505b6fe7778?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
  { id: 5, name: "Jigger & Pony", type: "Cocktail Bar", neighborhood: "Tanjong Pagar", rating: 4.7, latitude: 1.2758, longitude: 103.8454, imageUrl: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
  { id: 6, name: "Beer Basket", type: "Beer Bar", neighborhood: "Holland Village", rating: 4.5, latitude: 1.3112, longitude: 103.7958, imageUrl: "https://images.unsplash.com/photo-1512849934327-1cf5bf8a5ccc?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
  { id: 7, name: "Loof", type: "Rooftop Bar", neighborhood: "Bugis", rating: 4.4, latitude: 1.2989, longitude: 103.8562, imageUrl: "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
  { id: 8, name: "Level 33", type: "Brewery", neighborhood: "Marina Bay", rating: 4.5, latitude: 1.2830, longitude: 103.8509, imageUrl: "https://images.unsplash.com/photo-1555658636-6e4a36218be7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
  { id: 9, name: "The Other Room", type: "Speakeasy", neighborhood: "Orchard", rating: 4.6, latitude: 1.3061, longitude: 103.8300, imageUrl: "https://images.unsplash.com/photo-1559628129-67cf63b72248?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
  { id: 10, name: "Operation Dagger", type: "Cocktail Bar", neighborhood: "Boat Quay", rating: 4.5, latitude: 1.2866, longitude: 103.8499, imageUrl: "https://images.unsplash.com/photo-1546638012-f90f6649a70d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
  { id: 11, name: "Employees Only", type: "Cocktail Bar", neighborhood: "Boat Quay", rating: 4.6, latitude: 1.2873, longitude: 103.8494, imageUrl: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
  { id: 12, name: "Ah Sam Cold Drink Stall", type: "Cocktail Bar", neighborhood: "Boat Quay", rating: 4.4, latitude: 1.2876, longitude: 103.8491, imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
  { id: 13, name: "The Secret Mermaid", type: "Cocktail Bar", neighborhood: "Raffles Place", rating: 4.5, latitude: 1.2848, longitude: 103.8514, imageUrl: "https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
  { id: 14, name: "Tippling Club", type: "Cocktail Bar", neighborhood: "Tanjong Pagar", rating: 4.7, latitude: 1.2780, longitude: 103.8418, imageUrl: "https://images.unsplash.com/photo-1511920170033-f8396924c348?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
  { id: 15, name: "No.5 Emerald Hill", type: "Cocktail Bar", neighborhood: "Orchard", rating: 4.4, latitude: 1.3026, longitude: 103.8359, imageUrl: "https://images.unsplash.com/photo-1497644083578-611b798c60f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
  { id: 16, name: "The Single Cask", type: "Whisky Bar", neighborhood: "Bugis", rating: 4.8, latitude: 1.3005, longitude: 103.8565, imageUrl: "https://images.unsplash.com/photo-1527281400683-1aefee6bfcab?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
  { id: 17, name: "The Auld Alliance", type: "Whisky Bar", neighborhood: "Bugis", rating: 4.7, latitude: 1.2987, longitude: 103.8569, imageUrl: "https://images.unsplash.com/photo-1519502678520-b44a0fbbbc31?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
  { id: 18, name: "Wine Connection", type: "Wine Bar", neighborhood: "Robertson Quay", rating: 4.3, latitude: 1.2912, longitude: 103.8371, imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
  { id: 19, name: "La Terre", type: "Wine Bar", neighborhood: "Boat Quay", rating: 4.6, latitude: 1.2865, longitude: 103.8503, imageUrl: "https://images.unsplash.com/photo-1527862399980-b3846a5fde39?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
  { id: 20, name: "Bar Stories", type: "Cocktail Bar", neighborhood: "Haji Lane", rating: 4.4, latitude: 1.3020, longitude: 103.8593, imageUrl: "https://images.unsplash.com/photo-1508771400123-e194ad25c70c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
  { id: 21, name: "The Spiffy Dapper", type: "Cocktail Bar", neighborhood: "Amoy Street", rating: 4.5, latitude: 1.2814, longitude: 103.8466, imageUrl: "https://images.unsplash.com/photo-1571950006418-f226dc106482?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
  { id: 22, name: "Jekyll & Hyde", type: "Cocktail Bar", neighborhood: "Bugis", rating: 4.3, latitude: 1.2979, longitude: 103.8564, imageUrl: "https://images.unsplash.com/photo-1550426735-c33c7ce414ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
  { id: 23, name: "Sago House", type: "Cocktail Bar", neighborhood: "Chinatown", rating: 4.7, latitude: 1.2823, longitude: 103.8426, imageUrl: "https://images.unsplash.com/photo-1591243315780-978fd00ff9db?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
  { id: 24, name: "Junior The Pocket Bar", type: "Cocktail Bar", neighborhood: "Tanjong Pagar", rating: 4.6, latitude: 1.2774, longitude: 103.8456, imageUrl: "https://images.unsplash.com/photo-1590423451580-7a356fa6660f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
  { id: 25, name: "Live Twice", type: "Cocktail Bar", neighborhood: "Bukit Pasoh", rating: 4.7, latitude: 1.2795, longitude: 103.8407, imageUrl: "https://images.unsplash.com/photo-1586887362979-215a311241c3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" }
];

// Generate 30 sample deals using the establishments above
const generateDummyDeals = () => {
  const drinkTypes = ['Beer', 'Wine', 'Whisky', 'Gin', 'Cocktail', 'Spirits'];
  const beerBrands = ['Sapporo', 'Asahi', 'Tiger', 'Heineken', 'Carlsberg', 'Guinness'];
  const wineBrands = ['Merlot', 'Cabernet', 'Chardonnay', 'Pinot Noir', 'Sauvignon Blanc'];
  const whiskyBrands = ['Macallan', 'Glenfiddich', 'Johnnie Walker', 'Monkey Shoulder', 'Yamazaki'];
  const ginBrands = ['Hendrick\'s', 'Roku', 'Bombay Sapphire', 'Tanqueray', 'The Botanist'];
  
  const deals = [];

  // Create 30 deals distributed across the establishments
  for (let i = 0; i < 30; i++) {
    const establishment = SINGAPORE_ESTABLISHMENTS[i % SINGAPORE_ESTABLISHMENTS.length];
    
    // Determine drink type
    const drinkType = drinkTypes[Math.floor(Math.random() * drinkTypes.length)];
    let brand = '';
    
    switch (drinkType) {
      case 'Beer':
        brand = beerBrands[Math.floor(Math.random() * beerBrands.length)];
        break;
      case 'Wine':
        brand = wineBrands[Math.floor(Math.random() * wineBrands.length)];
        break;
      case 'Whisky':
        brand = whiskyBrands[Math.floor(Math.random() * whiskyBrands.length)];
        break;
      case 'Gin':
        brand = ginBrands[Math.floor(Math.random() * ginBrands.length)];
        break;
      default:
        brand = 'House';
    }
    
    // Create deal attributes
    const isOneForOne = Math.random() > 0.7; // 30% chance of 1-for-1 deal
    const savingsPercentage = Math.floor(Math.random() * 50) + 20; // 20% to 70% savings
    const regularPrice = Math.floor(Math.random() * 20) + 10; // $10 to $30
    const dealPrice = isOneForOne 
      ? regularPrice // same price but get 2
      : Math.round(regularPrice * (1 - savingsPercentage / 100));
    
    // Create deal
    deals.push({
      id: i + 1,
      establishmentId: establishment.id,
      title: isOneForOne 
        ? `1-for-1 ${brand} ${drinkType}`
        : `${savingsPercentage}% off ${brand} ${drinkType}`,
      description: isOneForOne
        ? `Buy one get one free on ${brand} ${drinkType.toLowerCase()}`
        : `Special happy hour price on ${brand} ${drinkType.toLowerCase()}`,
      type: drinkType.toLowerCase() === 'beer' ? 'drink' : 'drink',
      regularPrice,
      dealPrice,
      savingsPercentage,
      status: 'active',
      startTime: new Date(),
      endTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6].slice(0, Math.floor(Math.random() * 7) + 1),
      imageUrl: `https://source.unsplash.com/featured/?${drinkType.toLowerCase()},${brand.toLowerCase()}`,
      isOneForOne,
      drinkType: drinkType.toLowerCase(),
      brand,
      establishment
    });
  }
  
  return deals;
};

// Cache the generated deals to avoid regenerating on each render
const DUMMY_DEALS = generateDummyDeals();

export default function DealsList({ location, activeFilter }: DealsListProps) {
  const { user } = useAuth();
  const [showAllPremiumContent, setShowAllPremiumContent] = useState(false);

  // Simulate fetching from API, but use our static data
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/deals/nearby", { lat: location?.lat, lng: location?.lng, filter: activeFilter }],
    queryFn: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        active: DUMMY_DEALS,
        upcoming: [],
        future: [],
        subscription: { tier: user?.subscriptionTier || 'free', limit: 3, viewed: 0 }
      };
    },
    enabled: !!location?.lat && !!location?.lng,
  });
  
  // Default empty data structure if data is not available
  const defaultDeals = { active: [], upcoming: [], future: [], subscription: { tier: 'free' } };
  
  // Filter deals based on active filter
  const filteredDeals = useMemo(() => {
    if (!data) return defaultDeals;
    
    // Ensure data has the expected structure with fallbacks
    const safeData = {
      active: Array.isArray(data.active) ? data.active : [],
      upcoming: Array.isArray(data.upcoming) ? data.upcoming : [],
      future: Array.isArray(data.future) ? data.future : [],
      subscription: data.subscription || { tier: 'free' }
    };
    
    const filterDeals = (deals: any[]) => {
      if (!deals || !Array.isArray(deals)) return [];
      
      switch (activeFilter) {
        case 'one-for-one':
          return deals.filter(deal => deal && deal.isOneForOne);
        case 'high-savings':
          return deals.filter(deal => deal && deal.savingsPercentage >= 30);
        case 'beer':
          return deals.filter(deal => deal && deal.drinkType === 'beer');
        case 'wine':
          return deals.filter(deal => deal && deal.drinkType === 'wine');
        case 'whisky':
          return deals.filter(deal => deal && deal.drinkType === 'whisky');
        case 'active':
        default:
          return deals;
      }
    };
    
    // Apply the filters and return
    return {
      active: filterDeals(safeData.active),
      upcoming: [],
      future: [],
      subscription: safeData.subscription
    };
  }, [data, activeFilter]);

  // Check if user is on free tier with limited views
  const isFreeWithLimits = useMemo(() => {
    if (!data?.subscription) return false;
    return data.subscription.tier === 'free' && typeof data.subscription.limit === 'number';
  }, [data]);

  // Count of all available deals for premium upsell
  const totalAvailableDeals = useMemo(() => {
    if (!data) return 0;
    return (data.active?.length || 0);
  }, [data]);

  // Count of visible deals for free tier
  const visibleDealsCount = useMemo(() => {
    if (!data?.subscription) return 0;
    if (data.subscription.tier === 'premium') return totalAvailableDeals;
    return Math.min(filteredDeals.active?.length || 0, 2); // Show max 2 for free tier
  }, [data, filteredDeals, totalAvailableDeals]);

  if (isLoading) {
    return (
      <div className="flex-1 bg-gray-100 py-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 bg-gray-100 py-10">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800">Error loading deals</h2>
            <p className="mt-2 text-gray-600">Please try again later or check your connection</p>
          </div>
        </div>
      </div>
    );
  }

  // TEMPORARY: Show all deals as full deals for testing
  const isSignedIn = true; // Force signed in for now
  const isPremium = true;  // Force premium for now
  
  // Show all deals as full deals for testing
  const fullDealsCount = filteredDeals.active ? filteredDeals.active.length : 0;
  
  console.log("Filtered deals count:", filteredDeals.active ? filteredDeals.active.length : 0);
  console.log("Full deals count:", fullDealsCount);
  
  return (
    <main className="flex-1 bg-gray-50">
      <div className="px-2 sm:px-4 py-2 sm:py-4 pb-24">
        {/* Premium Prompt for Free Signed In Users */}
        {isSignedIn && !isPremium && (
          <PremiumPrompt 
            viewedDeals={data.subscription.viewed || 0} 
            maxDeals={data.subscription.limit || 3} 
          />
        )}
        
        {/* Debug message to confirm data */}
        <div className="mb-4 p-2 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
          <p className="font-bold">Debug info (remove in production):</p>
          <p>Total deals: {filteredDeals.active ? filteredDeals.active.length : 0}</p>
          <p>Full deals: {fullDealsCount}</p>
          <p>User status: {isSignedIn ? (isPremium ? 'Premium' : 'Free') : 'Not signed in'}</p>
        </div>
        
        {/* Deals Section - Show deals based on user tier */}
        {filteredDeals.active && filteredDeals.active.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {/* Full view deals (limited by user tier) */}
            {filteredDeals.active.slice(0, fullDealsCount).map((deal: any) => deal && (
              <div className="h-96 sm:h-[420px]" key={deal.id}>
                <DealCard 
                  key={deal.id} 
                  deal={deal} 
                  userLocation={location}
                  isGrayedOut={false}
                />
              </div>
            ))}
            
            {/* Grayed out deals (the rest) */}
            {filteredDeals.active.slice(fullDealsCount).map((deal: any) => deal && (
              <div className="h-96 sm:h-[420px]" key={`gray-${deal.id}`}>
                <DealCard 
                  key={deal.id} 
                  deal={deal} 
                  userLocation={location}
                  isGrayedOut={true}
                />
              </div>
            ))}
          </div>
        )}

        {/* No deals found message */}
        {(!filteredDeals.active || filteredDeals.active.length === 0) && (
          <div className="text-center py-12 bg-white rounded-lg shadow p-8">
            <h2 className="text-xl font-semibold text-gray-800">No deals found</h2>
            <p className="mt-2 text-gray-600">Try changing your filters or location</p>
          </div>
        )}
        
        {/* Premium upgrade teaser */}
        {!isPremium && (
          <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden border-2 border-dashed border-gray-300 p-4 sm:p-6">
            <PremiumUpgrade
              totalDeals={totalAvailableDeals}
              visibleDeals={visibleDealsCount}
            />
          </div>
        )}
      </div>
    </main>
  );
}
