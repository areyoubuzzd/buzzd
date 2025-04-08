import { cn } from "@/lib/utils";
import { Clock, MapPin } from "lucide-react";
import { getBackgroundImage, getHeroImage } from "@/lib/imageUtils";

export interface SimpleDealCardProps {
  id: number;
  name: string;
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
}

const BACKGROUND_COLORS: Record<string, string> = {
  beer: "bg-orange-500",
  red_wine: "bg-rose-600",
  white_wine: "bg-rose-600",
  wine: "bg-rose-600",
  bubbly: "bg-rose-600",
  cocktail: "bg-emerald-600",
  whisky: "bg-purple-700",
  vodka: "bg-purple-700",
  rum: "bg-purple-700",
  gin: "bg-purple-700",
};

export function SimpleDealCard({
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
}: SimpleDealCardProps) {
  const bgColor = BACKGROUND_COLORS[category.toLowerCase()] || "bg-emerald-600";
  const heroImage = getHeroImage(category, servingStyle);
  
  // Format distance
  const formattedDistance = distance < 10 ? 
    `0${distance.toFixed(1)}`.replace('.0', '') : 
    `${distance.toFixed(1)}`.replace('.0', '');
  
  return (
    <div 
      className={cn(
        "rounded-xl overflow-hidden w-full cursor-pointer transition-transform hover:scale-105",
        bgColor
      )}
      onClick={onClick}
    >
      {/* Top section with hero image and discount */}
      <div className="relative p-4">
        {/* Decorative elements */}
        <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-yellow-300/60"></div>
        <div className="absolute bottom-12 right-4 w-10 h-2 rounded-full bg-yellow-300/60 rotate-45"></div>
        <div className="absolute top-1/2 left-10 w-12 h-2 rounded-full bg-yellow-300/60 -rotate-45"></div>
        
        {/* Discount badge */}
        <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-lg font-bold">
          +{discount}%
        </div>
        
        {/* Hero image - centered */}
        <div className="flex justify-center items-center h-40 py-2">
          <img 
            src={heroImage} 
            alt={subcategory || category} 
            className="h-full object-contain"
          />
        </div>
      </div>
      
      {/* Bottom section with deal name and details */}
      <div className="p-4 pt-2 bg-black/20 flex flex-col items-center">
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
  );
}