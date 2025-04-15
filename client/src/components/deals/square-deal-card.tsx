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
    if (deal.isOneForOne) return "1-for-1";
    if (deal.regularPrice && deal.dealPrice) {
      const savings = Math.round(((deal.regularPrice - deal.dealPrice) / deal.regularPrice) * 100);
      return `${savings}% off`;
    }
    return "Special Offer";
  }, [deal]);

  return (
    <Card className="overflow-hidden h-full shadow-md hover:shadow-lg transition-shadow">
      <div className="relative aspect-square">
        {/* Deal image */}
        <img 
          src={deal.imageUrl || 'https://placehold.co/400x400/e6f7ff/0099cc?text=Happy+Hour'} 
          alt={deal.description || 'Happy Hour Deal'} 
          className="w-full h-full object-cover"
        />
        
        {/* Savings badge */}
        <div className="absolute top-2 right-2 bg-primary text-white px-2.5 py-1 rounded-full text-xs font-medium">
          {savingsInfo}
        </div>
      </div>
      
      <CardContent className="p-3">
        {/* Restaurant name */}
        <h3 className="font-semibold text-sm line-clamp-1 mb-1">
          {deal.establishment?.name || 'Restaurant Name'}
        </h3>
        
        {/* Deal description */}
        <p className="text-xs text-gray-700 line-clamp-2 mb-2">
          {deal.description || `${deal.alcohol_category || 'Drink'} Special`}
        </p>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
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