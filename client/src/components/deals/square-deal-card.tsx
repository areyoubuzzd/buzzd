import { useMemo } from "react";
import { FiClock, FiMapPin } from "react-icons/fi";
import { Card } from "@/components/ui/card";
import { calculateDistance } from "@/lib/location-utils";
import { useLocation } from "wouter";

interface SquareDealCardProps {
  deal: any;
  userLocation: { lat: number; lng: number };
}

export default function SquareDealCard({ deal, userLocation }: SquareDealCardProps) {
  // Use wouter's useLocation for navigation
  const [, setLocation] = useLocation();
  
  // Calculate the distance between the user and the establishment
  const distance = useMemo(() => {
    if (deal.establishment?.latitude && deal.establishment?.longitude && userLocation) {
      const distanceKm = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        deal.establishment.latitude,
        deal.establishment.longitude
      );
      
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
    
    return {
      currentPrice: happyHourPrice ? `$${happyHourPrice}` : 'Special Price',
      originalPrice: standardPrice ? `$${standardPrice}` : null,
      dealHeadline: drinkName ? `$${happyHourPrice} ${drinkName}` : `$${happyHourPrice} Special`
    };
  }, [deal]);

  // Format drink name - only use specific drink names, not generic ones
  const drinkName = useMemo(() => {
    // Only use drink_name if it's a specific drink (not ending with "Special")
    return deal.drink_name && !deal.drink_name.endsWith("Special") 
      ? deal.drink_name 
      : null;
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
  
  return (
    <div className="w-full h-full">
      <a 
        href={`/establishments/${establishmentId}`}
        onClick={handleCardClick}
        className="block text-inherit no-underline h-full"
      >
        <Card className="overflow-hidden h-full shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200 rounded-xl cursor-pointer">
          <div className="relative h-full">
            {/* Deal image with category-based fallback */}
            <img 
              src={deal.imageUrl || getDefaultImage} 
              alt={drinkName || deal.alcohol_category || 'Happy Hour Deal'} 
              className="w-full h-full object-cover"
            />
            
            {/* Savings badge */}
            <div className="absolute top-3 right-3 bg-primary text-white px-2 py-0.5 rounded-full text-xs font-medium">
              {savingsInfo}
            </div>
            
            {/* Overlay with all information - covering ~30% of the taller card from bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-black via-black/80 to-transparent px-3 py-4">
              {/* Deal headline using Fredoka One font - extra bold */}
              <h2 className="font-['Fredoka_One'] text-2xl text-white leading-7 mb-3 line-clamp-2">
                {dealHeadline}
              </h2>
              
              {/* Original price with strikethrough in red */}
              {originalPrice && (
                <p className="text-base text-red-400 line-through opacity-90 font-medium mb-3">
                  {originalPrice}
                </p>
              )}
              
              {/* Restaurant name - Manrope font */}
              <h3 className="font-['Manrope'] text-base text-white/95 line-clamp-1 border-t border-white/20 pt-2 mb-2">
                {deal.establishment?.name || 'Restaurant Name'}
              </h3>
              
              {/* Time and distance with Manrope font */}
              <div className="flex items-center justify-between text-sm text-white font-['Manrope']">
                {/* Happy hour time */}
                <div className="flex items-center">
                  <FiClock className="h-4 w-4 mr-1 text-white" />
                  <span className="text-white">{deal.hh_start_time?.substring(0, 5)} - {deal.hh_end_time?.substring(0, 5)}</span>
                </div>
                
                {/* Distance */}
                {distance && (
                  <div className="flex items-center">
                    <FiMapPin className="h-4 w-4 mr-1 text-white" />
                    <span className="text-white">{distance}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </a>
    </div>
  );
}