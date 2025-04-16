import { useMemo } from "react";
import { FiClock, FiMapPin } from "react-icons/fi";
import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <Card className="overflow-hidden h-full shadow-md hover:shadow-lg transition-shadow w-[175px] rounded-2xl">
      <div className="relative h-[245px]">
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
        
        {/* Overlay with all information - covering ~45% of the card from bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-black via-black/80 to-transparent px-3 py-2.5">
          {/* Deal headline using Fredoka One font - extra bold */}
          <h2 className="font-['Fredoka_One'] text-base text-white leading-5 mb-1.5 line-clamp-2">
            {dealHeadline}
          </h2>
          
          {/* Original price with strikethrough in red */}
          {originalPrice && (
            <p className="text-xs text-red-400 line-through opacity-90 font-medium mb-1.5">
              {originalPrice}
            </p>
          )}
          
          {/* Restaurant name - Manrope font */}
          <h3 className="font-['Manrope'] text-xs text-white/95 line-clamp-1 border-t border-white/20 pt-1.5 mb-1">
            {deal.establishment?.name || 'Restaurant Name'}
          </h3>
          
          {/* Time and distance with Manrope font */}
          <div className="flex items-center justify-between text-[9px] text-white font-['Manrope']">
            {/* Happy hour time */}
            <div className="flex items-center">
              <FiClock className="h-2.5 w-2.5 mr-0.5 text-white" />
              <span className="text-white">{deal.hh_start_time?.substring(0, 5)} - {deal.hh_end_time?.substring(0, 5)}</span>
            </div>
            
            {/* Distance */}
            {distance && (
              <div className="flex items-center">
                <FiMapPin className="h-2.5 w-2.5 mr-0.5 text-white" />
                <span className="text-white">{distance}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}