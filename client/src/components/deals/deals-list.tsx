import { useState, useMemo } from "react";
import DealCard from "./deal-card";
import PremiumPrompt from "../premium/premium-prompt";
import PremiumUpgrade from "../premium/premium-upgrade";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import type { DealWithEstablishment } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface DealsListProps {
  location: { lat: number; lng: number } | null;
  activeFilter: string;
}

export default function DealsList({ location, activeFilter }: DealsListProps) {
  const { user } = useAuth();
  const [showAllPremiumContent, setShowAllPremiumContent] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/deals/nearby", { lat: location?.lat, lng: location?.lng }],
    queryFn: async ({ queryKey }) => {
      const [, { lat, lng }] = queryKey as [string, { lat?: number, lng?: number }];
      if (!lat || !lng) return { active: [], upcoming: [], future: [], subscription: { tier: 'free' } };
      
      const response = await fetch(`/api/deals/nearby?lat=${lat}&lng=${lng}&radius=1`);
      return await response.json();
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
    
    if (activeFilter === 'all') return safeData;
    
    const filterDeals = (deals: DealWithEstablishment[]) => {
      if (!deals || !Array.isArray(deals)) return [];
      
      switch (activeFilter) {
        case 'drinks':
          return deals.filter(deal => deal && deal.type === 'drink');
        case 'food':
          return deals.filter(deal => deal && deal.type === 'food');
        case 'active':
          return safeData.active;
        case 'upcoming':
          return safeData.upcoming;
        case 'weekend':
          // Filter for deals that occur on weekend days (0 = Sunday, 6 = Saturday)
          return deals.filter(deal => {
            if (!deal || !deal.daysOfWeek) return false;
            const daysOfWeek = Array.isArray(deal.daysOfWeek) ? deal.daysOfWeek : [];
            return daysOfWeek.includes(0) || daysOfWeek.includes(6);
          });
        default:
          return deals;
      }
    };
    
    return {
      active: filterDeals(safeData.active),
      upcoming: filterDeals(safeData.upcoming),
      future: filterDeals(safeData.future),
      subscription: safeData.subscription
    };
  }, [data, activeFilter]);

  // Check if user is on free tier with limited views
  const isFreeWithLimits = useMemo(() => {
    if (!data?.subscription) return false;
    return data.subscription.tier === 'free' && typeof data.subscription.remaining === 'number';
  }, [data]);

  // Count of all available deals for premium upsell
  const totalAvailableDeals = useMemo(() => {
    if (!data) return 0;
    return (data.active?.length || 0) + (data.upcoming?.length || 0) + (data.future?.length || 0);
  }, [data]);

  // Count of visible deals for free tier
  const visibleDealsCount = useMemo(() => {
    if (!data?.subscription) return 0;
    if (data.subscription.tier === 'premium') return totalAvailableDeals;
    return filteredDeals.active?.length || 0;
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

  return (
    <main className="flex-1 bg-gray-100">
      <div className="container mx-auto px-4 py-5 pb-20">
        {/* Premium Prompt for Free Users */}
        {isFreeWithLimits && data.subscription && (
          <PremiumPrompt 
            viewedDeals={data.subscription.viewed || 0} 
            maxDeals={data.subscription.limit || 3} 
          />
        )}
        
        {/* Active Deals Section */}
        {filteredDeals.active && filteredDeals.active.length > 0 && (
          <>
            <h2 className="text-lg font-semibold mb-4">Active Happy Hour Deals</h2>
            <div className="space-y-4">
              {filteredDeals.active.map((deal: DealWithEstablishment) => deal && (
                <DealCard 
                  key={deal.id} 
                  deal={deal} 
                  userLocation={location}
                />
              ))}
            </div>
          </>
        )}
        
        {/* Upcoming Deals Section */}
        {filteredDeals.upcoming && filteredDeals.upcoming.length > 0 && (
          <>
            <h2 className="text-lg font-semibold mt-8 mb-4">Upcoming Happy Hour Deals</h2>
            <div className="space-y-4">
              {filteredDeals.upcoming.map((deal: DealWithEstablishment) => deal && (
                <DealCard 
                  key={deal.id} 
                  deal={deal} 
                  userLocation={location} 
                />
              ))}
            </div>
          </>
        )}
        
        {/* Tomorrow's Deals Section */}
        {filteredDeals.future && filteredDeals.future.length > 0 && (
          <>
            <h2 className="text-lg font-semibold mt-8 mb-4">Tomorrow's Happy Hour Deals</h2>
            <div className="space-y-4">
              {filteredDeals.future.map((deal: DealWithEstablishment) => deal && (
                <DealCard 
                  key={deal.id} 
                  deal={deal} 
                  userLocation={location} 
                />
              ))}
            </div>
          </>
        )}

        {/* No deals found message */}
        {(!filteredDeals.active || filteredDeals.active.length === 0) && 
         (!filteredDeals.upcoming || filteredDeals.upcoming.length === 0) && 
         (!filteredDeals.future || filteredDeals.future.length === 0) && (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-800">No deals found</h2>
            <p className="mt-2 text-gray-600">Try changing your filters or location</p>
          </div>
        )}
        
        {/* Premium upgrade teaser */}
        {!user?.subscriptionTier || user.subscriptionTier === 'free' ? (
          <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden border-2 border-dashed border-gray-300 p-6">
            <PremiumUpgrade
              totalDeals={totalAvailableDeals}
              visibleDeals={visibleDealsCount}
            />
          </div>
        ) : (
          // Additional content for premium users if needed
          <div className="mt-8 p-4">
            <p className="text-center text-sm text-gray-500">
              You're viewing all available deals with your premium account.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
