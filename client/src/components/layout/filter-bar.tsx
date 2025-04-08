import { useState } from 'react';
import { Button } from '@/components/ui/button';

type FilterType = 'all' | 'drinks' | 'food' | 'active' | 'upcoming' | 'weekend';

interface FilterBarProps {
  onFilterChange: (filter: FilterType) => void;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const handleFilterClick = (filter: FilterType) => {
    setActiveFilter(filter);
    onFilterChange(filter);
  };

  return (
    <div className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center space-x-3 overflow-x-auto pb-1 scrollbar-hide">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            className={`flex-shrink-0 px-4 py-1 rounded-full text-sm h-auto ${
              activeFilter === 'all' ? 'bg-primary text-white' : 'bg-white border border-gray-300'
            }`}
            onClick={() => handleFilterClick('all')}
          >
            All Deals
          </Button>
          <Button
            variant={activeFilter === 'drinks' ? 'default' : 'outline'}
            className={`flex-shrink-0 px-4 py-1 rounded-full text-sm h-auto ${
              activeFilter === 'drinks' ? 'bg-primary text-white' : 'bg-white border border-gray-300'
            }`}
            onClick={() => handleFilterClick('drinks')}
          >
            Drinks
          </Button>
          <Button
            variant={activeFilter === 'food' ? 'default' : 'outline'}
            className={`flex-shrink-0 px-4 py-1 rounded-full text-sm h-auto ${
              activeFilter === 'food' ? 'bg-primary text-white' : 'bg-white border border-gray-300'
            }`}
            onClick={() => handleFilterClick('food')}
          >
            Food
          </Button>
          <Button
            variant={activeFilter === 'active' ? 'default' : 'outline'}
            className={`flex-shrink-0 px-4 py-1 rounded-full text-sm h-auto ${
              activeFilter === 'active' ? 'bg-primary text-white' : 'bg-white border border-gray-300'
            }`}
            onClick={() => handleFilterClick('active')}
          >
            Active Now
          </Button>
          <Button
            variant={activeFilter === 'upcoming' ? 'default' : 'outline'}
            className={`flex-shrink-0 px-4 py-1 rounded-full text-sm h-auto ${
              activeFilter === 'upcoming' ? 'bg-primary text-white' : 'bg-white border border-gray-300'
            }`}
            onClick={() => handleFilterClick('upcoming')}
          >
            Upcoming
          </Button>
          <Button
            variant={activeFilter === 'weekend' ? 'default' : 'outline'}
            className={`flex-shrink-0 px-4 py-1 rounded-full text-sm h-auto ${
              activeFilter === 'weekend' ? 'bg-primary text-white' : 'bg-white border border-gray-300'
            }`}
            onClick={() => handleFilterClick('weekend')}
          >
            Weekend
          </Button>
        </div>
      </div>
    </div>
  );
}
