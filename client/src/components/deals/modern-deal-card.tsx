import { cn } from "@/lib/utils";
import { Clock, Heart, MapPin } from "lucide-react";
import { getBackgroundImageUrl, getHeroImageUrl } from "@/lib/cloudinaryImages";

export interface ModernDealCardProps {
  id: number;
  dealType: string; // e.g., "$6 BEER", "1-FOR-1", "$3 MARGARITA"
  discount: number; // percentage discount, e.g., 30
  category: string; // beer, wine, cocktail, etc.
  subcategory?: string;
  brand?: string;
  servingStyle?: 'bottle' | 'glass';
  endTime: string; // e.g., "6:00 PM"
  distance: number; // kilometers, e.g., 0.7
  onClick?: () => void;
  isSaved?: boolean;
  onSaveToggle?: () => void;
}

export function ModernDealCard({
  id,
  dealType,
  discount,
  category,
  subcategory,
  brand,
  servingStyle = 'glass',
  endTime,
  distance,
  onClick,
  isSaved = false,
  onSaveToggle,
}: ModernDealCardProps) {
  // Get images from Cloudinary
  const backgroundImageUrl = getBackgroundImageUrl(category);
  const heroImageUrl = getHeroImageUrl(category, brand, servingStyle);
  
  // Format distance for display (e.g., "07 KM" or "1.3 KM")
  const formattedDistance = distance < 10 ? 
    `0${distance.toFixed(1)}`.replace('.0', '') : 
    `${distance.toFixed(1)}`.replace('.0', '');
  
  return (
    <div 
      className="relative rounded-xl overflow-hidden w-full cursor-pointer transition-transform hover:scale-105 shadow-lg"
      onClick={onClick}
      style={{
        backgroundImage: `url(${backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Card Content */}
      <div className="flex flex-col h-full">
        {/* Top section with hero image and discount */}
        <div className="relative p-4 flex justify-center items-center">
          {/* Discount badge */}
          <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-lg font-bold">
            +{discount}%
          </div>
          
          {/* Save button */}
          {onSaveToggle && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onSaveToggle();
              }}
              className="absolute top-2 left-2 p-1 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
            >
              <Heart 
                className={cn(
                  "w-5 h-5 transition-colors", 
                  isSaved ? "fill-red-500 text-red-500" : "text-white"
                )} 
              />
            </button>
          )}
          
          {/* Hero image - centered */}
          <div className="h-40 py-2 flex items-center justify-center">
            <img 
              src={heroImageUrl} 
              alt={brand || subcategory || category}
              className="h-full object-contain" 
              onError={(e) => {
                // If image fails to load, add a fallback class that uses a colored background
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>
        
        {/* Bottom section with deal name and details */}
        <div className="p-4 pt-2 bg-black/20 flex flex-col items-center mt-auto">
          {/* Deal name in large text */}
          <h3 className="font-bold text-white text-center text-3xl font-fredoka leading-tight tracking-wide">
            {dealType}
          </h3>
          
          {/* Time and distance */}
          <div className="flex items-center gap-2 text-white/90 text-sm mt-1">
            <Clock size={14} className="text-white/80" />
            <span>Until {endTime}</span>
            <span>•</span>
            <span>{formattedDistance} KM</span>
          </div>
        </div>
      </div>
    </div>
  );
}