import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FiClock, FiPercent, FiUsers } from 'react-icons/fi';
import { FaBeer, FaWineGlassAlt, FaGlassWhiskey } from 'react-icons/fa';

// Updated FilterTypes based on the new requirements
type FilterType = 'active' | 'one-for-one' | 'high-savings' | 'beer' | 'wine' | 'whisky';

interface FilterBarProps {
  onFilterChange: (filter: FilterType) => void;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('active');

  const handleFilterClick = (filter: FilterType) => {
    setActiveFilter(filter);
    onFilterChange(filter);
  };

  return (
    <div className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center space-x-3 overflow-x-auto pb-1 scrollbar-hide">
          <Button
            variant={activeFilter === 'active' ? 'default' : 'outline'}
            className={`flex-shrink-0 px-4 py-1 rounded-full text-sm h-auto ${
              activeFilter === 'active' ? 'bg-primary text-white' : 'bg-white border border-gray-300'
            }`}
            onClick={() => handleFilterClick('active')}
          >
            <FiClock className="mr-1 h-4 w-4" />
            Active Now
          </Button>
          <Button
            variant={activeFilter === 'one-for-one' ? 'default' : 'outline'}
            className={`flex-shrink-0 px-4 py-1 rounded-full text-sm h-auto ${
              activeFilter === 'one-for-one' ? 'bg-primary text-white' : 'bg-white border border-gray-300'
            }`}
            onClick={() => handleFilterClick('one-for-one')}
          >
            <FiUsers className="mr-1 h-4 w-4" />
            1-for-1
          </Button>
          <Button
            variant={activeFilter === 'high-savings' ? 'default' : 'outline'}
            className={`flex-shrink-0 px-4 py-1 rounded-full text-sm h-auto ${
              activeFilter === 'high-savings' ? 'bg-primary text-white' : 'bg-white border border-gray-300'
            }`}
            onClick={() => handleFilterClick('high-savings')}
          >
            <FiPercent className="mr-1 h-4 w-4" />
            &gt;30% Savings
          </Button>
          <Button
            variant={activeFilter === 'beer' ? 'default' : 'outline'}
            className={`flex-shrink-0 px-4 py-1 rounded-full text-sm h-auto ${
              activeFilter === 'beer' ? 'bg-primary text-white' : 'bg-white border border-gray-300'
            }`}
            onClick={() => handleFilterClick('beer')}
          >
            <FaBeer className="mr-1 h-4 w-4" />
            Beer
          </Button>
          <Button
            variant={activeFilter === 'wine' ? 'default' : 'outline'}
            className={`flex-shrink-0 px-4 py-1 rounded-full text-sm h-auto ${
              activeFilter === 'wine' ? 'bg-primary text-white' : 'bg-white border border-gray-300'
            }`}
            onClick={() => handleFilterClick('wine')}
          >
            <FaWineGlassAlt className="mr-1 h-4 w-4" />
            Wine
          </Button>
          <Button
            variant={activeFilter === 'whisky' ? 'default' : 'outline'}
            className={`flex-shrink-0 px-4 py-1 rounded-full text-sm h-auto ${
              activeFilter === 'whisky' ? 'bg-primary text-white' : 'bg-white border border-gray-300'
            }`}
            onClick={() => handleFilterClick('whisky')}
          >
            <FaGlassWhiskey className="mr-1 h-4 w-4" />
            Whisky
          </Button>
        </div>
      </div>
    </div>
  );
}
