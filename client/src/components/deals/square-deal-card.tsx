import { useMemo } from "react";
import { FiClock, FiMapPin } from "react-icons/fi";
import { Card, CardContent } from "@/components/ui/card";
import { calculateDistance } from "@/lib/location-utils";

interface SquareDealCardProps {
  deal: any;
  userLocation: { lat: number; lng: number };
}

export default function SquareDealCard({ deal, userLocation }: SquareDealCardProps) {
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
  const { currentPrice, originalPrice } = useMemo(() => {
    const happyHourPrice = deal.happy_hour_price || deal.dealPrice;
    const standardPrice = deal.standard_price || deal.regularPrice;
    
    return {
      currentPrice: happyHourPrice ? `$${happyHourPrice}` : 'Special Price',
      originalPrice: standardPrice ? `$${standardPrice}` : null
    };
  }, [deal]);

  // Format drink name - only use specific drink names, not generic ones
  const drinkName = useMemo(() => {
    // Only use drink_name if it's a specific drink (not ending with "Special")
    return deal.drink_name && !deal.drink_name.endsWith("Special") 
      ? deal.drink_name 
      : null;
  }, [deal]);

  return (
    <Card className="overflow-hidden h-full shadow-md hover:shadow-lg transition-shadow max-w-[170px]">
      <div className="relative aspect-square">
        {/* Deal image */}
        <img 
          src={deal.imageUrl || 'https://placehold.co/400x400/e6f7ff/0099cc?text=Happy+Hour'} 
          alt={drinkName} 
          className="w-full h-full object-cover"
        />
        
        {/* Savings badge */}
        <div className="absolute top-2 right-2 bg-primary text-white px-2 py-0.5 rounded-full text-xs font-medium">
          {savingsInfo}
        </div>
        
        {/* Overlay with all information - restricted to lower third */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-2 pb-1.5">
          {/* Price information at the top */}
          <div className="flex items-center gap-2 justify-between">
            <p className="text-xs font-bold text-white">
              {currentPrice}
            </p>
            {originalPrice && (
              <p className="text-xs text-red-400 line-through opacity-90">
                {originalPrice}
              </p>
            )}
          </div>
          
          {/* Restaurant name */}
          <h3 className="font-semibold text-xs text-white/95 line-clamp-1 mt-1">
            {deal.establishment?.name || 'Restaurant Name'}
          </h3>
          
          {/* Time and distance - smaller and more compact */}
          <div className="flex items-center justify-between text-[9px] text-white/90 mt-0.5">
            {/* Happy hour time */}
            <div className="flex items-center">
              <FiClock className="h-2 w-2 mr-0.5" />
              <span>{deal.hh_start_time?.substring(0, 5)} - {deal.hh_end_time?.substring(0, 5)}</span>
            </div>
            
            {/* Distance */}
            {distance && (
              <div className="flex items-center">
                <FiMapPin className="h-2 w-2 mr-0.5" />
                <span>{distance}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}