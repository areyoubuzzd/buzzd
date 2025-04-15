import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import FilterBar from '@/components/layout/filter-bar';
import Navigation from '@/components/layout/navigation';
import SimpleDealCard from '@/components/deals/simple-deal-card';
import { Loader2 } from 'lucide-react';

export default function BeerPage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState('beer');
  
  // Fetch deals with beer category
  const { data: deals, isLoading, error } = useQuery({
    queryKey: ['/api/deals/search', { type: 'beer', status: 'active' }],
  });
  
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load beer deals. Please try again.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);
  
  return (
    <div className="container max-w-md mx-auto px-4 pb-20 pt-4">
      <h1 className="text-2xl font-bold mb-4">Beer Deals</h1>
      
      <div className="mb-4">
        <FilterBar activeFilter={filter} onFilterChange={setFilter} />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">Error loading deals</p>
        </div>
      ) : deals?.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No beer deals found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {deals?.map((deal: any) => (
            <SimpleDealCard
              key={deal.id}
              id={deal.id}
              title={deal.alcohol_category.charAt(0).toUpperCase() + deal.alcohol_category.slice(1)}
              subtitle={deal.alcohol_subcategory || 'Various types'}
              description={`${deal.brand || 'House'} - ${deal.happy_hour_price.toFixed(2)}`}
              imageUrl={deal.imageUrl}
              hh_start_time={deal.hh_start_time}
              hh_end_time={deal.hh_end_time}
              regularPrice={deal.standard_price}
              dealPrice={deal.happy_hour_price}
              establishment={deal.establishment?.name || 'Unknown venue'}
              distance={deal.distance || 1.5}
            />
          ))}
        </div>
      )}
      
      <Navigation />
    </div>
  );
}