import { useRef, useMemo } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import SquareDealCard from "@/components/deals/square-deal-card";
import { motion } from "framer-motion";

interface CollectionRowProps {
  title: string;
  deals: any[];
  description?: string;
  userLocation?: { lat: number; lng: number };
  onViewAllClick?: () => void;
}

export default function CollectionRow({ title, deals, description, userLocation, onViewAllClick }: CollectionRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // First sort deals by active status, then distribute so same drinks aren't adjacent
  const distributedDeals = useMemo(() => {
    // If no deals or just one deal, return as is
    if (!deals || deals.length <= 1) return deals;
    
    // CRITICAL FIX: Force sorting by active status before distribution
    // This ensures active deals always appear first, regardless of any other sorting
    console.log(`CollectionRow [${title}]: Sorting ${deals.length} deals to prioritize active deals first`);
    
    // Helper function to check if a deal is active now
    const isDealActiveNow = (deal: any): boolean => {
      // Check day first
      const now = new Date();
      const sgOptions = { timeZone: 'Asia/Singapore' };
      const sgTime = new Date(now.toLocaleString('en-US', sgOptions));
      const currentDay = sgTime.getDay();
      const daysMap = {
        0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 
        4: 'thursday', 5: 'friday', 6: 'saturday'
      };
      const currentDayName = daysMap[currentDay as keyof typeof daysMap];
      
      // Check for day matches in valid_days
      const validDaysLower = deal.valid_days.toLowerCase();
      let dayMatches = false;
      
      if (validDaysLower === 'all days' || validDaysLower.includes('everyday') || validDaysLower.includes('all')) {
        dayMatches = true;
      } else if (validDaysLower.includes(currentDayName)) {
        dayMatches = true;
      } else if (validDaysLower.includes('-')) {
        const dayParts = validDaysLower.split('-');
        if (dayParts.length === 2) {
          const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
          const startDayValue = days.findIndex(d => dayParts[0].trim().toLowerCase().startsWith(d));
          const endDayValue = days.findIndex(d => dayParts[1].trim().toLowerCase().startsWith(d));
          if (startDayValue !== -1 && endDayValue !== -1) {
            dayMatches = currentDay >= startDayValue && currentDay <= endDayValue;
          }
        }
      }
      
      if (!dayMatches) return false;
      
      // Check time
      const currentHours = sgTime.getHours();
      const currentMinutes = sgTime.getMinutes();
      const currentTimeValue = currentHours * 100 + currentMinutes;
      
      // Parse start time
      let startTimeValue = 0;
      try {
        if (deal.hh_start_time.includes(':')) {
          const [startHours, startMinutes] = deal.hh_start_time.split(':').map(Number);
          startTimeValue = startHours * 100 + startMinutes;
        } else {
          startTimeValue = parseInt(deal.hh_start_time, 10);
        }
      } catch (e) {
        return false;
      }
      
      // Parse end time
      let endTimeValue = 0;
      try {
        if (deal.hh_end_time.includes(':')) {
          const [endHours, endMinutes] = deal.hh_end_time.split(':').map(Number);
          endTimeValue = endHours * 100 + endMinutes;
        } else {
          endTimeValue = parseInt(deal.hh_end_time, 10);
        }
      } catch (e) {
        return false;
      }
      
      // Check if current time is within happy hour time range
      const isActive = currentTimeValue >= startTimeValue && currentTimeValue <= endTimeValue;
      return isActive;
    };
    
    // First, split deals into active and inactive
    const activeDeals = deals.filter(isDealActiveNow);
    const inactiveDeals = deals.filter(deal => !isDealActiveNow(deal));
    
    console.log(`CollectionRow [${title}]: Found ${activeDeals.length} active deals and ${inactiveDeals.length} inactive deals`);
    
    // Now start distribution with active deals first
    const dealsToDistribute = [...activeDeals, ...inactiveDeals];
    const result: any[] = [];
    
    // Keep track of the last drink name to avoid identical adjacent drinks
    let lastDrinkName: string | null = null;
    
    // While we still have deals to distribute
    while (dealsToDistribute.length > 0) {
      // Find index of a deal with a drink name different from the last one
      let selectedIndex = -1;
      
      // If this is the first deal, or we only have one deal left, just take the first one
      if (lastDrinkName === null || dealsToDistribute.length === 1) {
        selectedIndex = 0;
      } else {
        // Try to find a deal with a different drink name
        selectedIndex = dealsToDistribute.findIndex(deal => {
          // Find a drink with a different name than the last one
          return deal.drink_name !== lastDrinkName;
        });
        
        // If we couldn't find a different drink, just take the first one
        if (selectedIndex === -1) {
          selectedIndex = 0;
        }
      }
      
      // Add the selected deal to the result
      const selectedDeal = dealsToDistribute[selectedIndex];
      result.push(selectedDeal);
      
      // Update the last drink name
      lastDrinkName = selectedDeal.drink_name;
      
      // Remove the selected deal from the list
      dealsToDistribute.splice(selectedIndex, 1);
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

  // Animation variants for the collection row container
  const rowVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
        delayChildren: 0.2
      } 
    }
  };

  // Animation variants for the title
  const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        duration: 0.6
      }
    }
  };

  // Animation variants for the container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  // Animation variants for the deal card wrapper
  const cardWrapperVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 300
      }
    }
  };

  return (
    <motion.div 
      className="mb-4"
      initial="hidden"
      animate="visible"
      variants={rowVariants}
    >
      <div className="flex items-center justify-between mb-3">
        <motion.h2 
          className="text-lg font-semibold text-[#F4F4F9]"
          variants={titleVariants}
        >
          {title}
        </motion.h2>
      </div>
      
      <div className="relative">
        {/* Left scroll button */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <Button 
            variant="outline" 
            size="icon" 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full shadow-md hover:bg-gray-100 border-none h-8 w-8"
            onClick={() => scroll('left')}
          >
            <FiChevronLeft className="h-4 w-4" />
          </Button>
        </motion.div>
        
        {/* Scrollable container */}
        <motion.div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide py-4 px-4 gap-x-4 sm:gap-x-3 md:gap-x-3 lg:gap-x-2 xl:gap-x-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          variants={containerVariants}
        >
          {distributedDeals.map((deal, index) => (
            <motion.div 
              key={deal.id} 
              className="flex-shrink-0 w-[150px] xs:w-[155px] sm:w-[175px] md:w-[180px] lg:w-[190px] xl:w-[200px] h-[220px]"
              variants={cardWrapperVariants}
              custom={index}
            >
              <SquareDealCard deal={deal} userLocation={userLocation} />
            </motion.div>
          ))}
        </motion.div>
        
        {/* Right scroll button */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <Button 
            variant="outline" 
            size="icon" 
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full shadow-md hover:bg-gray-100 border-none h-8 w-8"
            onClick={() => scroll('right')}
          >
            <FiChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
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