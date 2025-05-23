import { useEffect, useState, useMemo } from "react";
import { Clock, Heart, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { heroes, getHeroImage } from "@/assets/heroes";
import { useLocation } from "wouter";
import { DealCountdown } from "./deal-countdown";
import { RestaurantHeatMap } from "../restaurants/restaurant-heat-map";

// Create a safe fallback SVG as data URI - guaranteed to work in all browsers
// even if imports and Cloudinary fail completely
function createFallbackSvg(category: string, isGlass: boolean = true): string {
  // Get color based on drink category
  let color = '%233090C7'; // Default blue
  
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('beer') || lowerCategory.includes('pint')) {
    color = '%23D4A017'; // Amber/gold for beer
  } else if (lowerCategory.includes('wine')) {
    color = '%23800000'; // Burgundy for wine
  } else if (lowerCategory.includes('cocktail')) {
    color = '%234863A0'; // Blue for cocktails
  } else if (lowerCategory.includes('whisky')) {
    color = '%23C35817'; // Whisky brown
  } else if (lowerCategory.includes('vodka') || lowerCategory.includes('gin')) {
    color = '%23C0C0C0'; // Silver for clear spirits
  } else if (lowerCategory.includes('rum')) {
    color = '%23C68E17'; // Dark rum color
  }
  
  // Create a simple SVG with gradient background that looks like a glass/bottle shape
  if (isGlass) {
    // Glass SVG with appropriate color
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:${color};stop-opacity:0.9' /%3E%3Cstop offset='100%25' style='stop-color:${color};stop-opacity:0.6' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M80,40 L120,40 L140,120 L140,250 A20,20 0 0 1 120,270 L80,270 A20,20 0 0 1 60,250 L60,120 Z' fill='url(%23grad)' stroke='white' stroke-width='3' /%3E%3C/svg%3E`;
  } else {
    // Bottle SVG with appropriate color
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:${color};stop-opacity:0.9' /%3E%3Cstop offset='100%25' style='stop-color:${color};stop-opacity:0.6' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M85,20 L115,20 L115,60 L130,90 L130,270 A10,10 0 0 1 120,280 L80,280 A10,10 0 0 1 70,270 L70,90 L85,60 Z' fill='url(%23grad)' stroke='white' stroke-width='3' /%3E%3C/svg%3E`;
  }
}

// Legacy function (not used anymore, using the imported getHeroImage instead)
function _getDemoHeroImage(drinkType: string | undefined, brand?: string): string {
  // Default images based on category - using publicly accessible image URLs
  const defaultImages = {
    beer: 'https://www.pngall.com/wp-content/uploads/2016/04/Beer-PNG-HD.png',
    wine: 'https://www.pngall.com/wp-content/uploads/2016/06/Wine-Free-Download-PNG.png',
    whisky: 'https://www.pngall.com/wp-content/uploads/12/Whiskey-Bottle-PNG-Picture.png',
    vodka: 'https://www.pngall.com/wp-content/uploads/12/Alcohol-Bottle-PNG-Picture.png',
    gin: 'https://www.pngall.com/wp-content/uploads/12/Gin-PNG-Image-HD.png',
    rum: 'https://www.pngall.com/wp-content/uploads/12/Alcohol-Bottle-Transparent-PNG.png',
    tequila: 'https://www.pngall.com/wp-content/uploads/12/Tequila-PNG-Images-HD.png',
    cocktail: 'https://www.pngall.com/wp-content/uploads/2016/05/Cocktail-Download-PNG.png',
  };
  
  // Brand-specific images (could expand based on actual brand data)
  const brandImages: {[key: string]: {[key: string]: string}} = {
    beer: {
      'heineken': 'https://www.pngall.com/wp-content/uploads/2016/04/Heineken-Beer-PNG.png',
      'corona': 'https://www.pngall.com/wp-content/uploads/2016/04/Corona-Beer-PNG.png',
      'stella artois': 'https://www.pngall.com/wp-content/uploads/2016/04/Beer-PNG-HD.png',
    },
    whisky: {
      'jameson': 'https://www.pngall.com/wp-content/uploads/12/Whiskey-Bottle-PNG-Clipart.png',
      'jack daniels': 'https://www.pngall.com/wp-content/uploads/12/Jack-Daniels-PNG-Picture.png',
    }
  };
  
  // Normalize drink type to lower case
  const normalizedType = drinkType?.toLowerCase() || '';
  const normalizedBrand = brand?.toLowerCase() || '';
  
  // First try to match by brand if available
  if (brand && brandImages[normalizedType]?.[normalizedBrand]) {
    return brandImages[normalizedType][normalizedBrand];
  }
  
  // Fall back to default image for the drink type
  if (defaultImages[normalizedType as keyof typeof defaultImages]) {
    return defaultImages[normalizedType as keyof typeof defaultImages];
  }
  
  // Ultimate fallback
  return defaultImages.beer;
}

// Abstract SVG accent patterns for cards based on provided examples
function getAccentPattern(drinkType: string | undefined, id?: number): string {
  // If no drink type, return empty
  if (!drinkType) return '';
  
  const opacity = '0.3'; // 30% opacity as requested
  
  // Collection of accent patterns based on the provided examples
  const patterns = [
    // Pattern 1: Wavy lines (based on Screenshot 2025-04-09 at 12.46.08 AM.png)
    `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <path d="M10,30 Q20,20 30,30 Q40,40 50,30 Q60,20 70,30 Q80,40 90,30" stroke="white" stroke-width="1.5" fill="none" opacity="${opacity}"/>
      <path d="M10,45 Q20,35 30,45 Q40,55 50,45 Q60,35 70,45 Q80,55 90,45" stroke="white" stroke-width="1.5" fill="none" opacity="${opacity}"/>
      <path d="M10,60 Q20,50 30,60 Q40,70 50,60 Q60,50 70,60 Q80,70 90,60" stroke="white" stroke-width="1.5" fill="none" opacity="${opacity}"/>
      <path d="M10,75 Q20,65 30,75 Q40,85 50,75 Q60,65 70,75 Q80,85 90,75" stroke="white" stroke-width="1.5" fill="none" opacity="${opacity}"/>
    </svg>`,
    
    // Pattern 2: Circle of dashes (based on Screenshot 2025-04-09 at 12.46.19 AM.png)
    `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(50, 50)">
        ${Array.from({length: 32}, (_, i) => {
          const angle = (i * Math.PI * 2) / 32;
          const x1 = 35 * Math.cos(angle);
          const y1 = 35 * Math.sin(angle);
          return `<line x1="${x1}" y1="${y1}" x2="${x1*1.2}" y2="${y1*1.2}" stroke="white" stroke-width="2" stroke-linecap="round" opacity="${opacity}"/>`;
        }).join('')}
      </g>
    </svg>`,
    
    // Pattern 3: Tapered spikes (based on Screenshot 2025-04-09 at 12.46.25 AM.png)
    `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <path d="M20,30 L30,80" stroke="white" stroke-width="4 1" stroke-linecap="round" opacity="${opacity}"/>
      <path d="M40,20 L50,60" stroke="white" stroke-width="4 1" stroke-linecap="round" opacity="${opacity}"/>
      <path d="M60,25 L65,75" stroke="white" stroke-width="4 1" stroke-linecap="round" opacity="${opacity}"/>
      <path d="M80,35 L90,85" stroke="white" stroke-width="4 1" stroke-linecap="round" opacity="${opacity}"/>
    </svg>`,
    
    // Pattern 4: Curved leaf/wing shapes (based on Screenshot 2025-04-09 at 12.46.34 AM.png)
    `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <path d="M20,30 Q40,35 25,60" stroke="white" stroke-width="2 0" fill="white" opacity="${opacity}"/>
      <path d="M50,25 Q65,45 45,55" stroke="white" stroke-width="2 0" fill="white" opacity="${opacity}"/>
      <path d="M70,35 Q90,40 75,65" stroke="white" stroke-width="2 0" fill="white" opacity="${opacity}"/>
      <path d="M30,70 Q50,60 60,80" stroke="white" stroke-width="2 0" fill="white" opacity="${opacity}"/>
    </svg>`,
    
    // Pattern 5: Ornamental divider (based on Screenshot 2025-04-09 at 12.46.42 AM.png)
    `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(50, 50)">
        <path d="M-35,0 L-15,0" stroke="white" stroke-width="2" opacity="${opacity}"/>
        <path d="M15,0 L35,0" stroke="white" stroke-width="2" opacity="${opacity}"/>
        <circle cx="0" cy="0" r="1.5" fill="white" opacity="${opacity}"/>
        <path d="M-8,-4 Q-4,0 -8,4" stroke="white" stroke-width="2" fill="white" opacity="${opacity}"/>
        <path d="M8,-4 Q4,0 8,4" stroke="white" stroke-width="2" fill="white" opacity="${opacity}"/>
      </g>
    </svg>`,
    
    // Additional patterns inspired by the provided examples
    
    // Pattern 6: Double wavy lines (variation of example 1)
    `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <path d="M10,35 Q25,25 40,35 Q55,45 70,35 Q85,25 100,35" stroke="white" stroke-width="1.5" fill="none" opacity="${opacity}"/>
      <path d="M10,45 Q25,35 40,45 Q55,55 70,45 Q85,35 100,45" stroke="white" stroke-width="1.5" fill="none" opacity="${opacity}"/>
      <path d="M10,65 Q25,55 40,65 Q55,75 70,65 Q85,55 100,65" stroke="white" stroke-width="1.5" fill="none" opacity="${opacity}"/>
      <path d="M10,75 Q25,65 40,75 Q55,85 70,75 Q85,65 100,75" stroke="white" stroke-width="1.5" fill="none" opacity="${opacity}"/>
    </svg>`,
    
    // Pattern 7: Dotted arc (variation of example 2)
    `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(50, 50)">
        ${Array.from({length: 16}, (_, i) => {
          const angle = (i * Math.PI) / 16;
          const x = 35 * Math.cos(angle);
          const y = 35 * Math.sin(angle);
          return `<circle cx="${x}" cy="${y}" r="1.5" fill="white" opacity="${opacity}"/>`;
        }).join('')}
      </g>
    </svg>`,
    
    // Pattern 8: Multiple ornamental dividers (variation of example 5)
    `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(50, 30)">
        <path d="M-35,0 L-15,0" stroke="white" stroke-width="2" opacity="${opacity}"/>
        <path d="M15,0 L35,0" stroke="white" stroke-width="2" opacity="${opacity}"/>
        <circle cx="0" cy="0" r="1.5" fill="white" opacity="${opacity}"/>
        <path d="M-8,-4 Q-4,0 -8,4" stroke="white" stroke-width="2" fill="white" opacity="${opacity}"/>
        <path d="M8,-4 Q4,0 8,4" stroke="white" stroke-width="2" fill="white" opacity="${opacity}"/>
      </g>
      <g transform="translate(50, 70)">
        <path d="M-35,0 L-15,0" stroke="white" stroke-width="2" opacity="${opacity}"/>
        <path d="M15,0 L35,0" stroke="white" stroke-width="2" opacity="${opacity}"/>
        <circle cx="0" cy="0" r="1.5" fill="white" opacity="${opacity}"/>
        <path d="M-8,-4 Q-4,0 -8,4" stroke="white" stroke-width="2" fill="white" opacity="${opacity}"/>
        <path d="M8,-4 Q4,0 8,4" stroke="white" stroke-width="2" fill="white" opacity="${opacity}"/>
      </g>
    </svg>`,
  ];
  
  // Use ID to deterministically select a pattern
  let patternIndex = 0;
  
  if (id !== undefined && id !== null) {
    patternIndex = id % patterns.length;
  } else {
    // As a fallback, choose based on drink type
    const type = drinkType.toLowerCase();
    if (type.includes("beer")) patternIndex = 0;
    // Wine pattern selection based on subcategories
    else if (type.includes("wine")) {
      // Check if it's white wine by various subcategories
      const isWhiteWine = type.includes("white") || 
                         type.includes("sauvignon") || 
                         type.includes("blanc") || 
                         type.includes("pinot gris") || 
                         type.includes("chardonnay") || 
                         type.includes("riesling");
      
      // Check if it's red wine by various subcategories
      const isRedWine = type.includes("red") || 
                       type.includes("cabernet") || 
                       type.includes("merlot") || 
                       type.includes("syrah") || 
                       type.includes("shiraz") || 
                       type.includes("pinot noir") || 
                       type.includes("malbec");
      
      if (isWhiteWine) patternIndex = 0; // Wavy pattern for white wines
      else if (isRedWine) patternIndex = 1; // Dotted arc for red wines
      else patternIndex = 7; // Ornamental pattern for generic wines
    }
    else if (type.includes("cocktail")) patternIndex = 2;
    else if (type.includes("whisky") || type.includes("whiskey")) patternIndex = 3;
    else if (type.includes("gin")) patternIndex = 4;
    else if (type.includes("vodka")) patternIndex = 5;
    else if (type.includes("rum")) patternIndex = 6;
    else patternIndex = 7;
  }
  
  return patterns[patternIndex];
}

// Helper function to get gradient background by drink type - EVEN SOFTER CONTRAST (center brightness reduced by 50%)
function getGradientBackground(drinkType: string | undefined, id?: number) {
  // If category is undefined or null, return a default gradient
  if (!drinkType) return 'radial-gradient(circle at center, #aac8b1 0%, #22C55E 65%, #14532D 100%)';
  
  const type = drinkType.toLowerCase();
  
  // For beer, select one of three gradient options based on the id
  if (type.includes("beer")) {
    const beerGradients = [
      'radial-gradient(circle at center, #c5b99e 0%, #F59E0B 65%, #B45309 100%)',  // Orange gradient - FURTHER SOFTENED
      'radial-gradient(circle at center, #c2bcb7 0%, #FB923C 65%, #C2410C 100%)',  // Lighter orange gradient - FURTHER SOFTENED
      'radial-gradient(circle at center, #9ebfb8 0%, #14B8A6 65%, #134E4A 100%)',  // Teal gradient - FURTHER SOFTENED
    ];
    
    // Use the id to deterministically select a gradient
    if (id === undefined || id === null) {
      return beerGradients[0]; // Default to first gradient if no id
    }
    
    // Use modulo to select one of the gradients based on id
    const gradientIndex = id % beerGradients.length;
    return beerGradients[gradientIndex];
  }
  
  // Define even softer radial gradients for wine types - handle subcategories
  if (type.includes("wine")) {
    // Check if it's white wine by various subcategories
    const isWhiteWine = type.includes("white") || 
                       type.includes("sauvignon") || 
                       type.includes("blanc") || 
                       type.includes("pinot gris") || 
                       type.includes("chardonnay") || 
                       type.includes("riesling");
    
    // Check if it's red wine by various subcategories
    const isRedWine = type.includes("red") || 
                     type.includes("cabernet") || 
                     type.includes("merlot") || 
                     type.includes("syrah") || 
                     type.includes("shiraz") || 
                     type.includes("pinot noir") || 
                     type.includes("malbec");
  
    if (isWhiteWine) {
      // For white wine, use a golden/cream gradient
      return 'radial-gradient(circle at center, #fff0c0 0%, #f5d78b 55%, #daa520 100%)';
    } 
    else if (isRedWine) {
      // For red wine, use deep red gradient 50% of the time
      const useRedGradient = (id || 0) % 2 === 0; // Use ID to deterministically choose
      
      if (useRedGradient) {
        return 'radial-gradient(circle at center, #e80000 0%, #cc0000 50%, #990000 100%)'; // Deep rich red
      } else {
        return 'radial-gradient(circle at center, #c2adad 0%, #EF4444 65%, #7F1D1D 100%)'; // Original red gradient
      }
    }
    else {
      // Generic wine (house pour wine), use the standard burgundy gradient
      return 'radial-gradient(circle at center, #e8c0c0 0%, #a02c2c 55%, #7F1D1D 100%)';
    }
  }
  if (type.includes("cocktail")) return 'radial-gradient(circle at center, #aac8b1 0%, #22C55E 65%, #14532D 100%)';
  if (type.includes("whisky") || type.includes("whiskey")) return 'radial-gradient(circle at center, #bbb3c4 0%, #A855F7 65%, #581C87 100%)';
  if (type.includes("gin")) return 'radial-gradient(circle at center, #9ebfb8 0%, #14B8A6 65%, #0F766E 100%)';
  if (type.includes("vodka")) return 'radial-gradient(circle at center, #bbb3c4 0%, #A855F7 65%, #581C87 100%)';
  if (type.includes("rum")) return 'radial-gradient(circle at center, #bbb3c4 0%, #A855F7 65%, #581C87 100%)';
  
  // Default gradient if no match
  return 'radial-gradient(circle at center, #aac8b1 0%, #22C55E 65%, #14532D 100%)';
}

// Keeping the old function for backward compatibility
function getCardBackgroundColor(drinkType: string | undefined) {
  // Now just returns 'none' since we're using gradients instead
  return "none";
}

// Helper to get background color class
function getBackgroundClass(drinkType: string | undefined) {
  // If category is undefined or null, return a default color class
  if (!drinkType) return "bg-emerald-600";
  
  const type = drinkType.toLowerCase();
  
  if (type.includes("beer")) return "bg-orange-500";
  
  // Wine color detection - check for subcategories
  if (type.includes("wine")) {
    // Check if it's white wine by various subcategories
    const isWhiteWine = type.includes("white") || 
                        type.includes("sauvignon") || 
                        type.includes("blanc") || 
                        type.includes("pinot gris") || 
                        type.includes("chardonnay") || 
                        type.includes("riesling");
    
    // Check if it's red wine by various subcategories
    const isRedWine = type.includes("red") || 
                      type.includes("cabernet") || 
                      type.includes("merlot") || 
                      type.includes("syrah") || 
                      type.includes("shiraz") || 
                      type.includes("pinot noir") || 
                      type.includes("malbec");
    
    if (isWhiteWine) return "bg-amber-500"; // Golden color for white wine
    if (isRedWine) return "bg-red-700"; // Deeper red for red wine
    return "bg-rose-700"; // Standard wine color for generic wine
  }
  if (type.includes("cocktail")) return "bg-emerald-600";
  if (type.includes("whisky") || type.includes("whiskey")) return "bg-purple-700";
  if (type.includes("gin")) return "bg-cyan-600";
  if (type.includes("vodka")) return "bg-indigo-600";
  if (type.includes("rum")) return "bg-amber-700";
  
  // Default class if no match
  return "bg-emerald-600";
}

interface DealCardProps {
  deal: any;
  userLocation: { lat: number; lng: number };
  isGrayedOut?: boolean;
  onToggleSave?: (id: number) => void;
  onViewDetails?: (id: number) => void;
  isSaved?: boolean;
}

function DealCard({ 
  deal, 
  userLocation, 
  isGrayedOut = false,
  onToggleSave,
  onViewDetails,
  isSaved = false
}: DealCardProps) {
  
  const [distance, setDistance] = useState<string | null>(null);
  
  // Calculate distance when deal or userLocation changes
  useEffect(() => {
    if (deal.establishment?.latitude && deal.establishment?.longitude && userLocation) {
      const distanceKm = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        deal.establishment.latitude,
        deal.establishment.longitude
      );
      
      // Format distance for display
      setDistance(
        distanceKm < 1 
          ? `${Math.round(distanceKm * 1000)}m` 
          : `${distanceKm.toFixed(1).replace(/\.0$/, '')}km`
      );
    }
  }, [deal, userLocation]);
  
  // Format start/end time
  const formattedTimeRange = useMemo(() => {
    if (!deal.startTime || !deal.endTime) return "All day";
    
    const start = new Date(deal.startTime);
    const end = new Date(deal.endTime);
    
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    
    return `${formatTime(start)} - ${formatTime(end)}`;
  }, [deal.startTime, deal.endTime]);
  
  // Calculate savings amount
  const savingsAmount = useMemo(() => {
    if (deal.isOneForOne) return "1-for-1";
    if (deal.regularPrice && deal.dealPrice) {
      const savings = Math.round(((deal.regularPrice - deal.dealPrice) / deal.regularPrice) * 100);
      return `-${savings}%`;
    }
    return null;
  }, [deal]);
  
  // Format price display
  const priceDisplay = useMemo(() => {
    if (deal.isOneForOne) return "1-FOR-1";
    if (deal.dealPrice) return `$${deal.dealPrice}`;
    return "";
  }, [deal]);
  
  // Get the deal name using happy_hour_price and drink_name
  const dealName = useMemo(() => {
    if (deal.isOneForOne) return "1-FOR-1";
    
    // Use the happy_hour_price and drink_name
    if (deal.happy_hour_price && deal.drink_name) {
      return `$${deal.happy_hour_price} ${deal.drink_name.toUpperCase()}`;
    }
    
    // Fallback to old logic if needed
    let name = priceDisplay;
    
    // If brand is available, use that
    if (deal.brand) {
      name += ` ${deal.brand.toUpperCase()}`;
    } 
    // If no brand but subcategory exists, use that
    else if (deal.subCategory) {
      name += ` ${deal.subCategory.toUpperCase()}`;
    }
    
    return name;
  }, [deal, priceDisplay]);
  
  const [, setLocation] = useLocation();

  const handleCardClick = () => {
    // Log for debugging
    console.log("Card clicked! Deal:", deal);
    
    // If onViewDetails callback is provided, call it
    if (onViewDetails) {
      console.log("Calling onViewDetails");
      onViewDetails(deal.id);
    }
    
    // Navigate to the establishment details page if establishmentId is available
    if (deal.establishmentId) {
      console.log("Navigating to:", `/establishments/${deal.establishmentId}`);
      setLocation(`/establishments/${deal.establishmentId}`);
    } else if (deal.establishment && deal.establishment.id) {
      console.log("Navigating to establishment from nested property:", `/establishments/${deal.establishment.id}`);
      setLocation(`/establishments/${deal.establishment.id}`);
    } else {
      console.error("No establishment ID found to navigate to!");
    }
  };
  
  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSave) {
      onToggleSave(deal.id);
    }
  };
  
  return (
    <div className="w-full">
      <a 
        href={`/establishments/${deal.establishmentId || (deal.establishment && deal.establishment.id)}`}
        className={cn(
          "relative block overflow-hidden cursor-pointer transition-transform hover:scale-105 shadow-lg rounded-lg",
          isGrayedOut && "opacity-50"
        )}
        onClick={(e) => {
          e.preventDefault();
          handleCardClick();
        }}
        style={{
          width: 'calc(100% - 2px)', 
          maxWidth: '155px',
          height: '175px',
          background: getGradientBackground(deal.drinkType, deal.id),
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          marginBottom: '8px',
          margin: '0 auto',
        }}
      >
        {/* SVG Accent Pattern - Position absolute to overlay on background */}
        <div 
          className="absolute inset-0 pointer-events-none"
          dangerouslySetInnerHTML={{ __html: getAccentPattern(deal.drinkType, deal.id) }}
        />
        
        {/* Card Content */}
        <div className="absolute inset-0 flex flex-col h-full">
          {/* Top section with discount badge */}
          <div className="relative p-4 flex-grow flex justify-center items-center">
            {/* Hero Image - centered bottle/glass image */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden" style={{ zIndex: 1 }}>
              <img 
                src={createFallbackSvg(deal.drinkType || 'beer', true)}
                alt={`${deal.brand || deal.drinkType} hero image`}
                onError={(e) => {
                  console.log(`Image load error for ${deal.brand || deal.drinkType}, trying SVG fallback first`);
                  
                  // Create a multi-step fallback system
                  const tryFallbacks = async () => {
                    try {
                      // Step 1: Try SVG image from the assets folder based on category
                      const drinkName = deal.brand || deal.drinkType;
                      const drinkType = deal.drinkType?.toLowerCase() || '';
                      
                      // Import local SVG assets dynamically instead of Cloudinary
                      const { images, getBrandImage } = await import('@/assets/images');
                      
                      // Map the drink type to a category that has SVG files
                      let category = 'beer'; // Default fallback
                      if (drinkType.includes('wine')) {
                        category = 'wine';
                      } else if (drinkType.includes('cocktail')) {
                        category = 'cocktail';
                      } else if (['whisky', 'gin', 'vodka', 'rum'].some(s => drinkType.includes(s))) {
                        category = drinkType.includes('whisky') ? 'whisky' : 'spirits';
                      } else if (drinkType.includes('beer') || drinkType.includes('pint')) {
                        category = 'beer';
                      }
                      
                      // Use the SVG image for the glass or bottle depending on context
                      const servingStyle = drinkName?.toLowerCase().includes('bottle') ? 'bottle' : 'glass';
                      const svgImage = getBrandImage(category, servingStyle);
                      
                      // Use a cache-busting timestamp to avoid caching issues
                      e.currentTarget.src = `${svgImage}?v=${Date.now()}`;
                      
                      // If the SVG fails, try known Cloudinary images
                      e.currentTarget.onerror = async () => {
                        console.log(`SVG fallback failed for ${drinkName}, trying verified Cloudinary images`);
                        try {
                          // Step 2: Try Cloudinary with only verified images
                          const { getRandomDrinkImageUrl } = await import('@/lib/cloudinary-utils');
                          
                          // Only try the specific known drinks
                          let cloudinaryCategory = '';
                          if (drinkName?.toLowerCase().includes('heineken pint')) cloudinaryCategory = 'heineken pint';
                          else if (drinkType?.toLowerCase().includes('wine')) cloudinaryCategory = 'red wine';
                          else if (drinkName?.toLowerCase().includes('margarita')) cloudinaryCategory = 'margarita';
                          else if (drinkName?.toLowerCase().includes('negroni')) cloudinaryCategory = 'negroni';
                          
                          if (cloudinaryCategory) {
                            const imageUrl = getRandomDrinkImageUrl(cloudinaryCategory);
                            // Add a cache buster to the URL
                            e.currentTarget.src = `${imageUrl}?v=${Date.now()}`;
                            
                            // Final fallback to default SVG
                            e.currentTarget.onerror = () => {
                              console.log('All dynamic images failed, using colored fallback SVG');
                              // Use our guaranteed-to-work data URL SVG
                              e.currentTarget.src = createFallbackSvg(drinkType || 'beer', true);
                              e.currentTarget.onerror = null; // Prevent infinite loop
                            };
                          } else {
                            // Skip to final default SVG if no specific category matches
                            console.log('No matching Cloudinary category, using colored fallback SVG');
                            e.currentTarget.src = createFallbackSvg(drinkType || 'beer', true);
                            e.currentTarget.onerror = null; // Prevent infinite loop
                          }
                        } catch (err) {
                          console.error('Error in Cloudinary fallback chain:', err);
                          // Fallback to beer glass SVG if everything else fails
                          try {
                            e.currentTarget.src = createFallbackSvg(drinkType || 'beer', true);
                            e.currentTarget.onerror = null; // Prevent infinite loop
                          } catch (innerErr) {
                            console.error('Critical error in all fallbacks', innerErr);
                          }
                        }
                      };
                    } catch (err) {
                      console.error('Failed in initial fallback chain:', err);
                    }
                  };
                  
                  tryFallbacks();
                }}
                className="h-[150%] object-contain"
                style={{ 
                  filter: 'brightness(1.2) contrast(1.0) drop-shadow(0 4px 3px rgba(0, 0, 0, 0.4))', 
                  transform: 'translateY(30px) scale(0.9)',
                  maxWidth: 'none',
                  opacity: 0.95
                }}
              />
            </div>
            
            {/* Discount badge */}
            {savingsAmount && (
              <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded-lg font-bold" style={{ zIndex: 20 }}>
                {savingsAmount}
              </div>
            )}
            
            {/* Save button */}
            {onToggleSave && (
              <button 
                onClick={handleSaveClick}
                className="absolute top-3 right-3 p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                style={{ zIndex: 20 }}
              >
                <Heart 
                  className={cn(
                    "w-5 h-5 transition-colors", 
                    isSaved ? "fill-red-500 text-red-500" : "text-white"
                  )} 
                />
              </button>
            )}
          </div>
          
          {/* Bottom section with deal name and details */}
          <div className="p-2 pt-1 bg-black/75 flex flex-col items-center mt-auto relative" style={{ zIndex: 10 }}>
            {/* Deal name */}
            <h3 className="font-black text-white text-center font-luckiest uppercase tracking-wide leading-none truncate w-full px-1" 
                style={{ 
                  fontSize: '1.5rem', /* 24px */
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
              {dealName}
            </h3>
            
            {/* Heat Map showing popularity */}
            {deal.establishment && (
              <div className="w-full mt-1 mb-0.5">
                <RestaurantHeatMap 
                  deals={deal.establishment.activeDeals || []}
                  size="sm"
                  showLabel={false}
                />
              </div>
            )}
            
            {/* Time and establishment */}
            <div className="flex items-center justify-between w-full text-white/90 text-xs mt-1">
              <div className="flex items-center gap-1">
                <Clock size={12} className="text-white/80" />
                <span>{formattedTimeRange}</span>
                {distance && (
                  <>
                    <span className="px-1">•</span>
                    <MapPin size={12} className="text-white/80" />
                    <span>{distance}</span>
                  </>
                )}
              </div>
              
              {/* Time display - simple end/start time as requested */}
              {deal.isActive && deal.hh_end_time && (
                <div className="flex items-center">
                  <Clock size={12} className="text-green-400 mr-1" />
                  <span className="text-green-400 text-xs font-medium">
                    Ends: {formattedTimeRange.split('–')[1].trim()}
                  </span>
                </div>
              )}
              {/* Only show start time for deals happening today but currently inactive */}
              {!deal.isActive && deal.hh_start_time && (
                <div className="flex items-center">
                  <Clock size={12} className="text-yellow-400 mr-1" />
                  <span className="text-yellow-400 text-xs font-medium">
                    Starts: {formattedTimeRange.split('–')[0].trim()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </a>
    </div>
  );
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

export default DealCard;