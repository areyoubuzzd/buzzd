import React from "react";
import { cn } from "@/lib/utils";
import { Clock, Heart } from "lucide-react";

// Define background colors for different alcohol categories
const BG_COLORS: Record<string, string> = {
  beer: "bg-orange-500",
  wine: "bg-rose-600",
  red_wine: "bg-rose-600",
  white_wine: "bg-rose-600",
  cocktail: "bg-emerald-600",
  whisky: "bg-purple-700",
  vodka: "bg-purple-700",
  rum: "bg-purple-700",
  gin: "bg-purple-700",
};

// Define decorative elements for each category
const DECORATIVE_ELEMENTS: Record<string, React.ReactNode> = {
  beer: (
    <>
      <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-yellow-300/60"></div>
      <div className="absolute bottom-12 right-4 w-10 h-2 rounded-full bg-yellow-300/60 rotate-45"></div>
      <div className="absolute top-1/2 left-10 w-12 h-2 rounded-full bg-yellow-300/60 -rotate-45"></div>
    </>
  ),
  wine: (
    <>
      <div className="absolute top-4 right-8 w-6 h-6 rounded-full bg-pink-300/30"></div>
      <div className="absolute bottom-16 left-4 w-10 h-10 rounded-full bg-pink-300/30"></div>
      <div className="absolute top-1/3 left-1/3 w-8 h-8 rounded-full bg-pink-300/30"></div>
    </>
  ),
  cocktail: (
    <>
      <div className="absolute top-6 left-5 w-8 h-2 rounded-full bg-teal-300/40 rotate-45"></div>
      <div className="absolute bottom-14 right-6 w-12 h-3 rounded-full bg-teal-300/40 -rotate-12"></div>
      <div className="absolute top-1/3 left-2 w-3 h-12 rounded-full bg-teal-300/40 rotate-30"></div>
    </>
  ),
  gin: (
    <>
      <div className="absolute top-5 right-6 w-8 h-2 rounded-full bg-indigo-300/40 rotate-45"></div>
      <div className="absolute bottom-16 left-4 w-12 h-3 rounded-full bg-indigo-300/40 -rotate-25"></div>
      <div className="absolute top-1/4 right-4 w-3 h-12 rounded-full bg-indigo-300/40 rotate-30"></div>
    </>
  ),
  whisky: (
    <>
      <div className="absolute top-5 right-6 w-8 h-2 rounded-full bg-indigo-300/40 rotate-45"></div>
      <div className="absolute bottom-16 left-4 w-12 h-3 rounded-full bg-indigo-300/40 -rotate-25"></div>
      <div className="absolute top-1/4 right-4 w-3 h-12 rounded-full bg-indigo-300/40 rotate-30"></div>
    </>
  ),
};

// Common decorative elements for any category not specifically defined
const DEFAULT_DECORATIVE = (
  <>
    <div className="absolute top-5 right-6 w-8 h-2 rounded-full bg-gray-300/40 rotate-45"></div>
    <div className="absolute bottom-16 left-4 w-12 h-3 rounded-full bg-gray-300/40 -rotate-25"></div>
    <div className="absolute top-1/4 right-4 w-3 h-12 rounded-full bg-gray-300/40 rotate-30"></div>
  </>
);

// Placeholder image component that shows a container where
// the drink image would appear
function PlaceholderHeroImage({ 
  category,
  brand,
  servingStyle
}: { 
  category: string;
  brand?: string;
  servingStyle: 'bottle' | 'glass';
}) {
  // Different shapes for different drink types
  const shapes: Record<string, React.ReactNode> = {
    beer: (
      <div className="h-28 w-20 bg-yellow-300 rounded-t-3xl relative mx-auto">
        <div className="absolute -bottom-1 left-0 right-0 h-12 bg-yellow-400 rounded-t-xl"></div>
      </div>
    ),
    wine: (
      <div className="h-32 w-24 relative mx-auto">
        <div className="absolute bottom-0 left-0 right-0 h-20 w-16 bg-red-700 rounded-b-full mx-auto"></div>
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 h-12 w-2 bg-red-700"></div>
        <div className="absolute -bottom-0 left-1/2 -translate-x-1/2 h-4 w-12 bg-red-700 rounded-t"></div>
      </div>
    ),
    cocktail: (
      <div className="h-32 w-24 relative mx-auto">
        <div className="absolute bottom-0 left-0 right-0 h-16 w-24 bg-green-300 rounded-t-full mx-auto"></div>
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 h-16 w-2 bg-green-300"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-4 w-16 bg-green-300 rounded"></div>
      </div>
    ),
    gin: (
      <div className="h-36 w-16 bg-blue-200 rounded-md relative mx-auto">
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 h-4 w-8 bg-blue-400 rounded-t-lg"></div>
      </div>
    ),
    whisky: (
      <div className="h-32 w-20 bg-amber-700 rounded-md relative mx-auto">
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-3 w-10 bg-amber-900 rounded"></div>
      </div>
    ),
  };

  // Get the appropriate placeholder shape
  const shape = shapes[category.toLowerCase()] || (
    <div className="h-32 w-24 bg-gray-300 rounded-md flex items-center justify-center">
      <span className="text-gray-500 text-xs text-center">
        {brand || category}<br/>{servingStyle}
      </span>
    </div>
  );

  return (
    <div className="flex items-center justify-center h-40">
      {shape}
    </div>
  );
}

export interface DrinkDealCardProps {
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

export function DrinkDealCard({
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
}: DrinkDealCardProps) {
  // Get the appropriate background color based on category
  const bgColorClass = BG_COLORS[category.toLowerCase()] || "bg-emerald-600";
  
  // Get decorative elements based on category
  const decorativeElements = DECORATIVE_ELEMENTS[category.toLowerCase()] || DEFAULT_DECORATIVE;
  
  // Format distance for display (e.g., "07 KM" or "1.3 KM")
  const formattedDistance = distance < 10 ? 
    `0${distance.toFixed(1)}`.replace('.0', '') : 
    `${distance.toFixed(1)}`.replace('.0', '');
  
  return (
    <div 
      className={cn(
        "relative rounded-xl overflow-hidden w-full cursor-pointer transition-transform hover:scale-105 shadow-lg",
        bgColorClass
      )}
      onClick={onClick}
    >
      {/* Card Content */}
      <div className="flex flex-col h-full">
        {/* Top section with hero image and discount */}
        <div className="relative p-4">
          {/* Decorative elements */}
          {decorativeElements}
          
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
          
          {/* Placeholder for Hero image */}
          <PlaceholderHeroImage 
            category={category}
            brand={brand}
            servingStyle={servingStyle}
          />
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