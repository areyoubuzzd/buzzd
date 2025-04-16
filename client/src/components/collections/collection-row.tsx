import { useRef } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import SquareDealCard from "@/components/deals/square-deal-card";

interface CollectionRowProps {
  title: string;
  deals: any[];
  userLocation: { lat: number; lng: number };
  onViewAllClick?: () => void;
}

export default function CollectionRow({ title, deals, userLocation, onViewAllClick }: CollectionRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8; // Scroll 80% of the visible width
    
    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        <Button 
          variant="link" 
          className="text-primary font-medium"
          onClick={onViewAllClick}
        >
          View all
        </Button>
      </div>
      
      <div className="relative">
        {/* Left scroll button */}
        <Button 
          variant="outline" 
          size="icon" 
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full shadow-md hover:bg-gray-100 border-none h-8 w-8"
          onClick={() => scroll('left')}
        >
          <FiChevronLeft className="h-4 w-4" />
        </Button>
        
        {/* Scrollable container */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide py-4 px-4 gap-x-4 sm:gap-x-3 md:gap-x-3 lg:gap-x-2 xl:gap-x-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {deals.map((deal) => (
            <div key={deal.id} className="flex-shrink-0 w-[150px] xs:w-[155px] sm:w-[175px] md:w-[180px] lg:w-[190px] xl:w-[200px]">
              <SquareDealCard deal={deal} userLocation={userLocation} />
            </div>
          ))}
        </div>
        
        {/* Right scroll button */}
        <Button 
          variant="outline" 
          size="icon" 
          className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full shadow-md hover:bg-gray-100 border-none h-8 w-8"
          onClick={() => scroll('right')}
        >
          <FiChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Add a CSS class to hide scrollbars
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;
document.head.appendChild(styleSheet);