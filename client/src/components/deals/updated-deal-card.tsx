import React from "react";
import { cn } from "@/lib/utils";
import { Clock, Heart } from "lucide-react";

export interface DealCardProps {
  id: number;
  dealType: string; // e.g., "$6 BEER", "1-FOR-1", "$3 MARGARITA"
  discount: number; // percentage discount, e.g., 30
  category: string; // beer, wine, cocktail, etc.
  subcategory?: string;
  brand?: string;
  servingStyle?: 'bottle' | 'glass';
  endTime: string; // e.g., "6:00 PM"
  distance: number; // kilometers, e.g., 0.7
  backgroundImageUrl?: string;
  heroImageUrl?: string;
  onClick?: () => void;
  isSaved?: boolean;
  onSaveToggle?: () => void;
}

/**
 * Card component for displaying drink deals with background and hero images
 * Uses exact credit card aspect ratio (1.586:1)
 */
function DealCard({
  id,
  dealType,
  discount,
  category,
  subcategory,
  brand,
  servingStyle = 'glass',
  endTime,
  distance,
  backgroundImageUrl,
  heroImageUrl,
  onClick,
  isSaved = false,
  onSaveToggle,
}: DealCardProps) {
  // Default background colors when no image is available
  const bgColorClass = getBgColorForCategory(category);
  
  // Format distance for display (e.g., "0.7 mi" or "1.3 mi")
  const formattedDistance = distance ? 
    `${distance.toFixed(1)}`.replace(/\.0$/, '') + ' mi' : 
    '';
  
  return (
    <div 
      className="relative overflow-hidden cursor-pointer transition-transform hover:scale-105 shadow-lg w-full mb-0"
      onClick={onClick}
      style={{
        // Credit card aspect ratio (1.586:1) - Width to height ratio
        aspectRatio: '1.586/1',
        borderRadius: '8px', // Slightly smaller radius
        background: getGradientBackground(category, id),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        maxWidth: '100%', // Ensure it doesn't overflow its container
        height: 0, // This forces the aspect ratio to be respected
        paddingBottom: 'calc(100% / 1.586)', // 1/1.586 ≈ 63% - makes it landscape!
        marginBottom: '4px', // Small but noticeable margin
      }}
    >
      {/* Card Content */}
      <div className="absolute inset-0 flex flex-col h-full">
        {/* Top section with hero image and discount */}
        <div className="relative p-4 flex-grow flex justify-center items-center">
          {/* Discount badge - positioned in top left with minus sign */}
          <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded-lg font-bold">
            -{discount}%
          </div>
          
          {/* Save button (if provided) */}
          {onSaveToggle && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onSaveToggle();
              }}
              className="absolute top-3 right-3 p-1 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
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
          <div className="h-24 w-full flex items-center justify-center">
            {heroImageUrl ? (
              <img 
                src={heroImageUrl} 
                alt={dealType}
                className="h-full max-h-24 object-contain" 
                onError={(e) => {
                  console.error(`Failed to load hero image: ${heroImageUrl}`);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              // Placeholder with category name when no image
              <div className="text-white text-opacity-70 text-lg">
                {category}
              </div>
            )}
          </div>
        </div>
        
        {/* Bottom section with deal name and details */}
        <div className="p-3 pt-1 bg-black/20 flex flex-col items-center">
          {/* Deal name in large text with Fredoka font */}
          <h3 className="font-bold text-white text-center text-xl font-fredoka leading-tight tracking-wide">
            {dealType}
          </h3>
          
          {/* Time and distance */}
          <div className="flex items-center gap-2 text-white/90 text-xs mt-1">
            <Clock size={12} className="text-white/80" />
            <span>Until {endTime}</span>
            <span>•</span>
            <span>{formattedDistance}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions to maintain consistent styling

function getBgColorForCategory(category?: string, id?: number): string {
  // Default to 'default' if category is undefined or null
  if (!category) return "bg-emerald-600";
  
  // For beer, we'll use one of three color options based on the id
  if (category.toLowerCase() === 'beer') {
    const beerColors = [
      "bg-amber-600", // Orange - #E67E30
      "bg-orange-500", // Lighter orange - #F78E3D
      "bg-teal-700", // Teal - #14655F
    ];
    
    // Debug info
    console.log(`DealCard: Beer card with ID: ${id}, using color index: ${id ? id % beerColors.length : 'none'}`);
    
    // Use the id to deterministically select a color
    // If id is undefined or null, use a fixed color
    if (id === undefined || id === null) {
      return beerColors[0]; // Default to first color if no id
    }
    
    // Use modulo to select one of the colors based on id
    const colorIndex = id % beerColors.length;
    return beerColors[colorIndex];
  }
  
  // For other drink types
  const colorMap: Record<string, string> = {
    wine: "bg-rose-600",
    red_wine: "bg-rose-600",
    white_wine: "bg-rose-600",
    cocktail: "bg-emerald-600",
    whisky: "bg-purple-700",
    vodka: "bg-purple-700",
    rum: "bg-purple-700",
    gin: "bg-teal-600",
  };
  
  return colorMap[category.toLowerCase()] || "bg-emerald-600";
}

function getBgColorHex(category?: string, id?: number): string {
  // For gradient backgrounds, we'll return 'none' and use the gradient in the style
  return 'none';
}

function getGradientBackground(category?: string, id?: number): string {
  // Default to emerald if category is undefined or null
  if (!category) {
    return 'radial-gradient(circle at center, #6ee7b7 0%, #059669 60%, #065f46 100%)';
  }
  
  // For beer, select one of three gradient options based on the id
  if (category.toLowerCase() === 'beer') {
    const beerGradients = [
      'radial-gradient(circle at center, #FDBA74 0%, #E67E30 60%, #C2410C 100%)',  // Orange gradient - more contrast
      'radial-gradient(circle at center, #FED7AA 0%, #F78E3D 60%, #EA580C 100%)',  // Lighter orange gradient - more contrast
      'radial-gradient(circle at center, #5EEAD4 0%, #14655F 60%, #064E3B 100%)',  // Teal gradient - more contrast
    ];
    
    // Use the id to deterministically select a gradient
    // If id is undefined or null, use a fixed gradient
    if (id === undefined || id === null) {
      return beerGradients[0]; // Default to first gradient if no id
    }
    
    // Use modulo to select one of the gradients based on id
    const gradientIndex = id % beerGradients.length;
    return beerGradients[gradientIndex];
  }
  
  // Define radial gradients for each category - with central highlight and more contrast
  const gradientMap: Record<string, string> = {
    wine: 'radial-gradient(circle at center, #fda4af 0%, #e11d48 60%, #9f1239 100%)',
    red_wine: 'radial-gradient(circle at center, #fda4af 0%, #e11d48 60%, #9f1239 100%)',
    white_wine: 'radial-gradient(circle at center, #fda4af 0%, #e11d48 60%, #9f1239 100%)',
    cocktail: 'radial-gradient(circle at center, #6ee7b7 0%, #059669 60%, #065f46 100%)',
    whisky: 'radial-gradient(circle at center, #c4b5fd 0%, #7e22ce 60%, #581c87 100%)',
    vodka: 'radial-gradient(circle at center, #c4b5fd 0%, #7e22ce 60%, #581c87 100%)', 
    rum: 'radial-gradient(circle at center, #c4b5fd 0%, #7e22ce 60%, #581c87 100%)',
    gin: 'radial-gradient(circle at center, #5eead4 0%, #0d9488 60%, #0f766e 100%)',
  };
  
  return gradientMap[category.toLowerCase()] || 'radial-gradient(circle at center, #6ee7b7 0%, #059669 60%, #065f46 100%)';
}

export default DealCard;