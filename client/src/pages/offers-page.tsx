import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import FilterBar, { FilterType } from '@/components/layout/filter-bar';
import Navigation from '@/components/layout/navigation';
import { SimpleDealCard } from '@/components/deals/simple-deal-card';
import { Loader2 } from 'lucide-react';

export default function OffersPage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<FilterType>('one-for-one');
  
  // Fetch special deals like 1-for-1 and freeflow
  const { data: deals, isLoading, error } = useQuery({
    queryKey: ['/api/deals/search', { tags: ['one-for-one', 'freeflow', 'promo'], status: 'active' }],
  });
  
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load special offers. Please try again.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);
  
  return (
    <div className="container max-w-md mx-auto px-4 pb-20 pt-4">
      <h1 className="text-2xl font-bold mb-4">Special Offers</h1>
      
      <div className="mb-4">
        <FilterBar activeFilter={filter} onFilterChange={setFilter} />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">Error loading offers</p>
        </div>
      ) : deals?.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No special offers found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {deals?.map((deal: any) => (
            <SimpleDealCard
              key={deal.id}
              id={deal.id}
              name={deal.deal_type || 'Special Offer'}
              dealType={deal.deal_description || '1-for-1 Deal'}
              discount={Math.round(((deal.standard_price - deal.happy_hour_price) / deal.standard_price) * 100)}
              category={deal.alcohol_category}
              subcategory={deal.alcohol_subcategory || undefined}
              servingStyle="glass"
              endTime={deal.hh_end_time}
              distance={deal.distance || 1.5}
              imageUrl={deal.imageUrl}
            />
          ))}
        </div>
      )}
      
      <Navigation />
    </div>
  );
}