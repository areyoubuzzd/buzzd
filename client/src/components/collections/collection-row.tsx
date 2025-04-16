import { useRef, useMemo } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import SquareDealCard from "@/components/deals/square-deal-card";

interface CollectionRowProps {
  title: string;
  deals: any[];
  description?: string;
  userLocation?: { lat: number; lng: number };
  onViewAllClick?: () => void;
}

export default function CollectionRow({ title, deals, description, userLocation, onViewAllClick }: CollectionRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Distribute deals so same restaurants aren't adjacent
  const distributedDeals = useMemo(() => {
    // If no deals or just one deal, return as is
    if (!deals || deals.length <= 1) return deals;
    
    // Create a map of establishment IDs to their deals
    const establishmentDeals = new Map<number, any[]>();
    
    // Group deals by establishment
    deals.forEach(deal => {
      const estId = deal.establishment?.id;
      if (!estId) return; // Skip if no establishment id
      
      if (!establishmentDeals.has(estId)) {
        establishmentDeals.set(estId, []);
      }
      establishmentDeals.get(estId)?.push(deal);
    });
    
    // If only one establishment, return original list
    if (establishmentDeals.size === 1) return deals;
    
    // Distribute deals from different establishments
    const result: any[] = [];
    const remainingDeals = new Map(establishmentDeals);
    
    // Keep track of the last establishment ID to avoid adjacent deals from same place
    let lastEstId: number | null = null;
    
    while (remainingDeals.size > 0) {
      // Find an establishment that's different from the last one
      let nextEstId: number | null = null;
      
      // If we have more than one establishment left, pick one different from last
      if (remainingDeals.size > 1 && lastEstId !== null) {
        // Array approach to avoid Map iteration issues
        const estIds = Array.from(remainingDeals.keys());
        for (const estId of estIds) {
          if (estId !== lastEstId) {
            nextEstId = estId;
            break;
          }
        }
      } else {
        // Just take the first one
        nextEstId = Array.from(remainingDeals.keys())[0];
      }
      
      if (nextEstId === null) break;
      
      // Get deals for this establishment
      const estDeals = remainingDeals.get(nextEstId) || [];
      if (estDeals.length > 0) {
        // Add one deal from this establishment
        result.push(estDeals.shift());
        
        // If no more deals for this establishment, remove it
        if (estDeals.length === 0) {
          remainingDeals.delete(nextEstId);
        } else {
          // Update the remaining deals
          remainingDeals.set(nextEstId, estDeals);
        }
        
        // Update last establishment ID
        lastEstId = nextEstId;
      }
    }
    
    return result;
  }, [deals]);

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
          {distributedDeals.map((deal) => (
            <div key={deal.id} className="flex-shrink-0 w-[150px] xs:w-[155px] sm:w-[175px] md:w-[180px] lg:w-[190px] xl:w-[200px] h-[220px]">
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