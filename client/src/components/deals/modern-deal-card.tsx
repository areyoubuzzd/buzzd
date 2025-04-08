import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PriceTag } from "./price-tag";
import { Clock, MapPin } from "lucide-react";
import { getBackgroundImage } from "@/assets/backgrounds";
import { getHeroImage } from "@/assets/heroes";

export interface DealCardProps {
  id: number;
  name: string;
  description: string;
  originalPrice: number;
  dealPrice: number;
  dayOfWeek: string;
  timeStart: string;
  timeEnd: string;
  category: string;
  subcategory?: string;
  brand?: string;
  isPremiumDeal: boolean;
  servingStyle?: 'bottle' | 'glass';
  establishment: {
    name: string;
    address: string;
    distance?: number;
    logoUrl?: string;
  };
  onClick?: () => void;
}

export const ModernDealCard = ({
  id,
  name,
  description,
  originalPrice,
  dealPrice,
  dayOfWeek,
  timeStart,
  timeEnd,
  category,
  subcategory,
  brand,
  isPremiumDeal,
  servingStyle = 'glass',
  establishment,
  onClick,
}: DealCardProps) => {
  // Calculate savings
  const savings = originalPrice - dealPrice;
  const savingsPercentage = Math.round((savings / originalPrice) * 100);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  // Get background and hero images based on category
  const backgroundImage = getBackgroundImage(category);
  const heroImage = getHeroImage(category, servingStyle);
  
  // Format time
  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      return `${hours}:${minutes}`;
    } catch (e) {
      return time;
    }
  };

  return (
    <Card 
      className="overflow-hidden relative group cursor-pointer transition-all duration-300 hover:shadow-xl"
      onClick={onClick}
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: `url(${backgroundImage})` }}>
        {/* Semi-transparent overlay to ensure text readability */}
        <div className="absolute inset-0 bg-black/50"></div>
      </div>
      
      {/* Premium Deal Indicator */}
      {isPremiumDeal && (
        <Badge variant="outline" className="absolute top-2 right-2 z-20 bg-amber-400/80 text-black border-amber-500">
          Premium Deal
        </Badge>
      )}
      
      <CardContent className="p-4 relative z-10 text-white">
        <div className="flex items-start gap-3">
          {/* Hero/Product Image */}
          <div className="flex-shrink-0 w-24 h-36 relative">
            <img 
              src={heroImage} 
              alt={brand || category} 
              className="w-full h-full object-contain"
            />
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {/* Deal Title */}
            <h3 className="font-bold text-lg truncate mb-1">{name}</h3>
            
            {/* Brand & Category */}
            <div className="text-sm text-white/80 mb-2">
              {brand && <span className="font-medium">{brand} · </span>}
              <span className="capitalize">{subcategory || category}</span>
            </div>
            
            {/* Deal Description - limited to 2 lines */}
            <p className="text-sm mb-2 line-clamp-2">{description}</p>
            
            {/* Establishment (Hidden for non-premium deals) */}
            {(isPremiumDeal || true) && (
              <div className="flex items-center text-xs text-white/90 mb-1">
                <MapPin size={12} className="mr-1" />
                <span className="truncate">
                  {establishment.name} 
                  {establishment.distance && ` · ${establishment.distance.toFixed(1)} km`}
                </span>
              </div>
            )}
            
            {/* Deal Time */}
            <div className="flex items-center text-xs text-white/90 mb-2">
              <Clock size={12} className="mr-1" />
              <span>
                {dayOfWeek} · {formatTime(timeStart)} - {formatTime(timeEnd)}
              </span>
            </div>
            
            {/* Pricing */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex flex-col">
                <span className="text-xs text-white/70 line-through">
                  {formatCurrency(originalPrice)}
                </span>
                <PriceTag price={dealPrice} />
              </div>
              
              {/* Savings */}
              <Badge variant="outline" className="bg-green-600/80 border-green-700 text-white">
                Save {savingsPercentage}%
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};