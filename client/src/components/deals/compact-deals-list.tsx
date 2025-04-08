import { useState, useMemo } from "react";
import DealCard from "./deal-card";
import { useAuth } from "@/hooks/use-auth";
import type { DealWithEstablishment } from "@shared/schema";

// Updated FilterType to match the new filter-bar component
type FilterType = 'active' | 'one-for-one' | 'high-savings' | 'beer' | 'wine' | 'whisky';

interface CompactDealsListProps {
  location: { lat: number; lng: number };
  activeFilter: FilterType;
  fullDealsCount?: number;
  deals: any[];
}

export function CompactDealsList({ 
  location, 
  activeFilter,
  fullDealsCount = 5,
  deals
}: CompactDealsListProps) {
  const { user } = useAuth();
  const [savedDeals, setSavedDeals] = useState<number[]>([]);

  // Calculate which deals to show based on premium status
  const isPremium = user?.subscriptionTier === 'premium';
  const realFullDealsCount = isPremium ? deals.length : fullDealsCount;
  
  // Placeholder toggle save
  const handleToggleSave = (id: number) => {
    setSavedDeals(prev => prev.includes(id) 
      ? prev.filter(dealId => dealId !== id) 
      : [...prev, id]
    );
  };
  
  return (
    <div className="w-full">
      {/* Full deals (shown normally) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 gap-y-0">
        {deals.slice(0, realFullDealsCount).map((deal: any) => deal && (
          <div className="w-full mb-0 pb-0" key={deal.id}>
            <DealCard 
              key={deal.id} 
              deal={deal} 
              userLocation={location}
              isGrayedOut={false}
              onToggleSave={handleToggleSave}
              isSaved={savedDeals.includes(deal.id)}
            />
          </div>
        ))}
        
        {/* Grayed out deals (the rest - only for non-premium) */}
        {!isPremium && deals.slice(realFullDealsCount).map((deal: any) => deal && (
          <div className="w-full mb-0 pb-0" key={`gray-${deal.id}`}>
            <DealCard 
              key={deal.id} 
              deal={deal} 
              userLocation={location}
              isGrayedOut={true}
              onToggleSave={handleToggleSave}
              isSaved={savedDeals.includes(deal.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default CompactDealsList;