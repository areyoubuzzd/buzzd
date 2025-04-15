import { useMemo } from "react";
import { FiClock, FiMap } from "react-icons/fi";
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

  // Format the price display
  const priceDisplay = useMemo(() => {
    const happyHourPrice = deal.happy_hour_price || deal.dealPrice;
    const standardPrice = deal.standard_price || deal.regularPrice;
    
    if (happyHourPrice && standardPrice) {
      return `$${happyHourPrice} (U.P. $${standardPrice})`;
    } else if (happyHourPrice) {
      return `$${happyHourPrice}`;
    } else {
      return 'Special Price';
    }
  }, [deal]);

  // Format drink name
  const drinkName = useMemo(() => {
    return deal.drink_name || `${deal.alcohol_category || 'Drink'} Special`;
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
        
        {/* Overlay with drink name and price */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-2">
          <h3 className="font-medium text-xs text-white line-clamp-2">
            {drinkName}
          </h3>
          <p className="text-xs font-bold text-white mt-1">
            {priceDisplay}
          </p>
        </div>
        
        {/* Savings badge */}
        <div className="absolute top-2 right-2 bg-primary text-white px-2 py-0.5 rounded-full text-xs font-medium">
          {savingsInfo}
        </div>
      </div>
      
      <CardContent className="p-2">
        {/* Restaurant name */}
        <h3 className="font-semibold text-xs line-clamp-1">
          {deal.establishment?.name || 'Restaurant Name'}
        </h3>
        
        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
          {/* Happy hour time */}
          <div className="flex items-center">
            <FiClock className="h-3 w-3 mr-1" />
            <span>{deal.hh_start_time?.substring(0, 5)} - {deal.hh_end_time?.substring(0, 5)}</span>
          </div>
          
          {/* Distance */}
          {distance && (
            <div className="flex items-center">
              <FiMap className="h-3 w-3 mr-1" />
              <span>{distance}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}