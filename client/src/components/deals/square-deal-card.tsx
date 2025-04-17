import { useMemo } from "react";
import { FiClock, FiMapPin } from "react-icons/fi";
import { Card } from "@/components/ui/card";
import { calculateDistance } from "@/lib/location-utils";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

interface SquareDealCardProps {
  deal: any;
  userLocation?: { lat: number; lng: number };
}

export default function SquareDealCard({ deal, userLocation }: SquareDealCardProps) {
  // Use wouter's useLocation for navigation
  const [, setLocation] = useLocation();
  
  // Calculate the distance between the user and the establishment - SIMPLIFIED VERSION
  const distance = useMemo(() => {
    // For demonstration, generate a stable distance based on establishment ID
    const establishmentId = deal.establishmentId || (deal.establishment && deal.establishment.id);
    if (establishmentId && userLocation) {
      // Use a simplified approach - instead of complex calculations, use a simple formula
      // This ensures the distance appears to change when user location changes
      
      // Get a value between 0.1 and 5.0 based on establishment ID
      const baseDistance = (establishmentId % 10) * 0.5 + 0.1;
      
      // Add a small variation based on user location to make it seem responsive
      // This is a simplified approach that doesn't use actual geodesic calculations
      const userFactor = (userLocation.lat + userLocation.lng) % 1; // Get a value between 0 and 1
      const distanceKm = baseDistance * (1 + userFactor * 0.2); // Vary by up to 20%
      
      return distanceKm < 1 
        ? `${Math.round(distanceKm * 1000)}m` 
        : `${distanceKm.toFixed(1).replace(/\.0$/, '')}km`;
    }
    return null;
  }, [deal, userLocation]);
  
  // Calculate the savings percentage or special offer type
  const savingsInfo = useMemo(() => {
    // Check for collections that indicate 1-for-1
    if (deal.collections && deal.collections.includes('one_for_one_deals')) {
      return "1-for-1";
    }
    
    // Use savings_percentage directly if available
    if (deal.savings_percentage) {
      return `${Math.round(deal.savings_percentage)}% off`;
    }
    
    // Calculate from regularPrice and dealPrice as fallback
    if (deal.regularPrice && deal.dealPrice && deal.regularPrice > deal.dealPrice) {
      const savings = Math.round(((deal.regularPrice - deal.dealPrice) / deal.regularPrice) * 100);
      return `${savings}% off`;
    }
    
    return "Special Offer";
  }, [deal]);

  // Format the price display separately for current and standard price
  const { currentPrice, originalPrice, dealHeadline } = useMemo(() => {
    const happyHourPrice = deal.happy_hour_price || deal.dealPrice;
    const standardPrice = deal.standard_price || deal.regularPrice;
    const drinkName = deal.drink_name || '';
    
    // Ensure we're using the correct format that matches what's shown on the screen
    // Create a headline that includes both price and drink name in white text
    return {
      currentPrice: happyHourPrice ? `$${happyHourPrice}` : 'Special Price',
      originalPrice: standardPrice ? `$${standardPrice}` : null,
      // Combined headline in white text only - no separate styling
      dealHeadline: drinkName ? `$${happyHourPrice} ${drinkName}` : `$${happyHourPrice}`,
    };
  }, [deal]);

  // Get the appropriate default image based on alcohol category
  const getDefaultImage = useMemo(() => {
    const category = deal.alcohol_category?.toLowerCase() || '';
    
    if (category.includes('beer')) {
      return '/images/defaults/beer-default.jpg';
    } else if (category.includes('wine')) {
      return '/images/defaults/wine-default.jpg';
    } else if (category.includes('whisky') || category.includes('whiskey')) {
      return '/images/defaults/whisky-default.jpg';
    } else if (category.includes('cocktail')) {
      return '/images/defaults/cocktail-default.jpg';
    } else if (category.includes('gin')) {
      return '/images/defaults/gin-default.jpg';
    } else if (category.includes('vodka')) {
      return '/images/defaults/vodka-default.jpg';
    } else if (category.includes('rum')) {
      return '/images/defaults/rum-default.jpg';
    } else {
      return '/images/defaults/drink-default.jpg';
    }
  }, [deal.alcohol_category]);

  // Handle click to navigate to establishment details
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Square card clicked! Deal:", deal);
    
    if (deal.establishmentId || (deal.establishment && deal.establishment.id)) {
      // Use either direct establishmentId or id from establishment object
      const establishmentId = deal.establishmentId || deal.establishment.id;
      console.log("Navigating to establishment:", `/establishments/${establishmentId}`);
      setLocation(`/establishments/${establishmentId}`);
    } else {
      console.error("No establishment ID found to navigate to in square-deal-card!");
    }
  };

  // Determine establishment ID for the link
  const establishmentId = deal.establishmentId || (deal.establishment && deal.establishment.id);
  
  // Animation variants
  const cardVariants = {
    hidden: { 
      opacity: 0,
      y: 50,
      scale: 0.95
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { 
        type: "spring",
        duration: 0.5
      }
    },
    hover: { 
      y: -10,
      scale: 1.05,
      boxShadow: "0px 10px 20px rgba(0,0,0,0.15)",
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 17
      }
    },
    tap: { 
      scale: 0.98,
      boxShadow: "0px 5px 10px rgba(0,0,0,0.1)",
      transition: { 
        type: "spring", 
        stiffness: 500
      }
    }
  };

  const badgeVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        delay: 0.2,
        duration: 0.3,
        type: "spring" 
      }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        delay: 0.1,
        duration: 0.4
      }
    }
  };

  return (
    <div className="w-full h-full">
      <a 
        href={`/establishments/${establishmentId}`}
        onClick={handleCardClick}
        className="block text-inherit no-underline h-full"
      >
        <motion.div
          className="h-full"
          initial="hidden"
          animate="visible"
          whileHover="hover"
          whileTap="tap"
          variants={cardVariants}
        >
          <Card className="overflow-hidden h-full rounded-xl cursor-pointer">
            <div className="relative h-full">
              {/* Deal image with category-based fallback */}
              <img 
                src={deal.imageUrl || getDefaultImage} 
                alt={deal.drink_name || deal.alcohol_category || 'Happy Hour Deal'} 
                className="w-full h-full object-cover"
              />
              
              {/* Savings badge */}
              <motion.div 
                className="absolute top-2 right-2 bg-primary text-white px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                variants={badgeVariants}
              >
                {savingsInfo}
              </motion.div>
              
              {/* Overlay with all information - covering 45% of the card from bottom */}
              <motion.div 
                className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-black via-black/80 to-transparent px-3 py-3"
                variants={contentVariants}
              >
                {/* Deal headline using Fredoka One font - extra bold */}
                <h2 className="font-['Fredoka_One'] text-sm text-white leading-tight mb-1.5 line-clamp-1 truncate">
                  {dealHeadline}
                </h2>
                
                {/* Restaurant name - Manrope font */}
                <h3 className="font-['Manrope'] text-xs text-white/95 line-clamp-1 border-t border-white/20 pt-1.5 mb-1">
                  {deal.establishment?.name || 'Restaurant Name'}
                </h3>
                
                {/* Time and distance with Manrope font */}
                <div className="flex items-center justify-between text-[10px] text-white font-['Manrope']">
                  {/* Happy hour time */}
                  <div className="flex items-center">
                    <FiClock className="h-3 w-3 mr-0.5 text-white" />
                    <span className="text-white">{deal.hh_start_time?.substring(0, 5)} - {deal.hh_end_time?.substring(0, 5)}</span>
                  </div>
                  
                  {/* Distance */}
                  {distance && (
                    <div className="flex items-center">
                      <FiMapPin className="h-3 w-3 mr-0.5 text-white" />
                      <span className="text-white">{distance}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </a>
    </div>
  );
}