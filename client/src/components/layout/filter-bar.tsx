import { Button } from '@/components/ui/button';
import { FiClock, FiPercent, FiUsers } from 'react-icons/fi';
import { FaBeer, FaWineGlassAlt, FaGlassWhiskey } from 'react-icons/fa';

// Updated FilterTypes based on the new requirements
export type FilterType = 'active' | 'one-for-one' | 'high-savings' | 'beer' | 'wine' | 'whisky';

export interface FilterBarProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export default function FilterBar({ activeFilter, onFilterChange }: FilterBarProps) {

  const handleFilterClick = (filter: FilterType) => {
    onFilterChange(filter);
  };

  return (
    <div className="bg-[#f8f7f5] shadow-sm">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center space-x-3 overflow-x-auto pb-1 scrollbar-hide">
          <Button
            variant={activeFilter === 'active' ? 'default' : 'outline'}
            className={`flex-shrink-0 px-4 py-1 rounded-full text-sm h-auto ${
              activeFilter === 'active' ? 'bg-primary text-white' : 'bg-[#f8f7f5] border border-gray-200 text-[#191632]'
            }`}
            onClick={() => handleFilterClick('active')}
          >
            <FiClock className="mr-1 h-4 w-4" />
            Active Now
          </Button>
          <Button
            variant={activeFilter === 'one-for-one' ? 'default' : 'outline'}
            className={`flex-shrink-0 px-4 py-1 rounded-full text-sm h-auto ${
              activeFilter === 'one-for-one' ? 'bg-primary text-white' : 'bg-[#f8f7f5] border border-gray-200 text-[#191632]'
            }`}
            onClick={() => handleFilterClick('one-for-one')}
          >
            <FiUsers className="mr-1 h-4 w-4" />
            1-for-1
          </Button>
          <Button
            variant={activeFilter === 'high-savings' ? 'default' : 'outline'}
            className={`flex-shrink-0 px-4 py-1 rounded-full text-sm h-auto ${
              activeFilter === 'high-savings' ? 'bg-primary text-white' : 'bg-[#f8f7f5] border border-gray-200 text-[#191632]'
            }`}
            onClick={() => handleFilterClick('high-savings')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 h-4 w-4">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
              <path d="M12 18V6"></path>
            </svg>
            Big Savings
          </Button>
          <Button
            variant={activeFilter === 'beer' ? 'default' : 'outline'}
            className={`flex-shrink-0 px-4 py-1 rounded-full text-sm h-auto ${
              activeFilter === 'beer' ? 'bg-primary text-white' : 'bg-[#f8f7f5] border border-gray-200 text-[#191632]'
            }`}
            onClick={() => handleFilterClick('beer')}
          >
            <FaBeer className="mr-1 h-4 w-4" />
            Beer
          </Button>
          <Button
            variant={activeFilter === 'wine' ? 'default' : 'outline'}
            className={`flex-shrink-0 px-4 py-1 rounded-full text-sm h-auto ${
              activeFilter === 'wine' ? 'bg-primary text-white' : 'bg-[#f8f7f5] border border-gray-200 text-[#191632]'
            }`}
            onClick={() => handleFilterClick('wine')}
          >
            <FaWineGlassAlt className="mr-1 h-4 w-4" />
            Wine
          </Button>
          <Button
            variant={activeFilter === 'whisky' ? 'default' : 'outline'}
            className={`flex-shrink-0 px-4 py-1 rounded-full text-sm h-auto ${
              activeFilter === 'whisky' ? 'bg-primary text-white' : 'bg-[#f8f7f5] border border-gray-200 text-[#191632]'
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
