import { useEffect, useState, useMemo } from "react";
import { Clock, Heart, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

// Get a semi-random number based on a seed value (deterministic randomness)
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Abstract SVG accent patterns with randomized positions and sizes
function getAccentPattern(drinkType: string | undefined, id?: number): string {
  // If no drink type, return empty
  if (!drinkType) return '';
  
  // Use ID for deterministic randomness, or fallback to 1
  const seedId = id || 1;
  const opacity = '0.4'; // 40% opacity as requested (increased from 30%)
  
  // Function to get a random position
  const randomPos = (min: number, max: number, seed: number): number => {
    return min + seededRandom(seed) * (max - min);
  };
  
  // Function to get a random scale - Increased minimum and maximum scale values
  const randomScale = (min: number, max: number, seed: number): number => {
    return min + seededRandom(seed) * (max - min);
  };
  
  // Create several instances of a pattern with random positions and sizes
  const createRandomInstances = (pattern: string, count: number, baseSeed: number): string => {
    let result = '';
    
    for (let i = 0; i < count; i++) {
      const seed = baseSeed + i * 0.1;
      const x = randomPos(5, 85, seed);
      const y = randomPos(5, 85, seed + 0.1);
      const scale = randomScale(0.4, 0.8, seed + 0.2); // Increased scale range (40% to 80%)
      
      result += `<g transform="translate(${x}, ${y}) scale(${scale})">${pattern}</g>`;
    }
    
    return result;
  };
  
  // Define base patterns (smaller, single elements)
  const basePatterns = [
    // Pattern 1: Wavy lines (based on Screenshot 2025-04-09 at 12.46.08 AM.png)
    `<path d="M0,0 Q5,-5 10,0 Q15,5 20,0" stroke="white" stroke-width="1.5" fill="none" opacity="${opacity}"/>`,
    
    // Pattern 2: Circle of dashes (based on Screenshot 2025-04-09 at 12.46.19 AM.png)
    `<g>
      ${Array.from({length: 12}, (_, i) => {
        const angle = (i * Math.PI * 2) / 12;
        const x1 = 10 * Math.cos(angle);
        const y1 = 10 * Math.sin(angle);
        return `<line x1="${x1}" y1="${y1}" x2="${x1*1.2}" y2="${y1*1.2}" stroke="white" stroke-width="1" stroke-linecap="round" opacity="${opacity}"/>`;
      }).join('')}
    </g>`,
    
    // Pattern 3: Tapered spike (based on Screenshot 2025-04-09 at 12.46.25 AM.png)
    `<path d="M0,0 L5,15" stroke="white" stroke-width="2 0.5" stroke-linecap="round" opacity="${opacity}"/>`,
    
    // Pattern 4: Curved leaf shape (based on Screenshot 2025-04-09 at 12.46.34 AM.png)
    `<path d="M0,0 Q5,2 2,8" stroke="white" stroke-width="1.5 0" fill="white" opacity="${opacity}"/>`,
    
    // Pattern 5: Ornamental dot with leaves (based on Screenshot 2025-04-09 at 12.46.42 AM.png)
    `<g>
      <circle cx="0" cy="0" r="1" fill="white" opacity="${opacity}"/>
      <path d="M-4,-2 Q-2,0 -4,2" stroke="white" stroke-width="1" fill="white" opacity="${opacity}"/>
      <path d="M4,-2 Q2,0 4,2" stroke="white" stroke-width="1" fill="white" opacity="${opacity}"/>
    </g>`,
  ];
  
  // Use ID to deterministically select a pattern type for this card
  const patternIndex = seedId % basePatterns.length;
  const selectedPattern = basePatterns[patternIndex];
  
  // Create SVG with multiple instances of the pattern
  return `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    ${createRandomInstances(selectedPattern, 8, seedId)}
  </svg>`;
}

// Helper function to get gradient background by drink type - SOFTER CONTRAST (center brightness reduced by 30%)
function getGradientBackground(drinkType: string | undefined, id?: number) {
  // If category is undefined or null, return a default gradient
  if (!drinkType) return 'radial-gradient(circle at center, #9bc3a5 0%, #22C55E 50%, #14532D 100%)';
  
  const type = drinkType.toLowerCase();
  
  // For beer, select one of three gradient options based on the id
  if (type.includes("beer")) {
    const beerGradients = [
      'radial-gradient(circle at center, #b0a589 0%, #F59E0B 50%, #B45309 100%)',  // Orange gradient - FURTHER SOFTENED
      'radial-gradient(circle at center, #ada8a3 0%, #FB923C 50%, #C2410C 100%)',  // Lighter orange gradient - FURTHER SOFTENED
      'radial-gradient(circle at center, #8aaca5 0%, #14B8A6 50%, #134E4A 100%)',  // Teal gradient - FURTHER SOFTENED
    ];
    
    // Use the id to deterministically select a gradient
    if (id === undefined || id === null) {
      return beerGradients[0]; // Default to first gradient if no id
    }
    
    // Use modulo to select one of the gradients based on id
    const gradientIndex = id % beerGradients.length;
    return beerGradients[gradientIndex];
  }
  
  // Define even softer radial gradients for each category (30% reduction from original)
  if (type.includes("wine")) return 'radial-gradient(circle at center, #ac9999 0%, #EF4444 50%, #7F1D1D 100%)';
  if (type.includes("cocktail")) return 'radial-gradient(circle at center, #9bc3a5 0%, #22C55E 50%, #14532D 100%)';
  if (type.includes("whisky") || type.includes("whiskey")) return 'radial-gradient(circle at center, #a79eb0 0%, #A855F7 50%, #581C87 100%)';
  if (type.includes("gin")) return 'radial-gradient(circle at center, #8aaca6 0%, #14B8A6 50%, #0F766E 100%)';
  if (type.includes("vodka")) return 'radial-gradient(circle at center, #a79eb0 0%, #A855F7 50%, #581C87 100%)';
  if (type.includes("rum")) return 'radial-gradient(circle at center, #a79eb0 0%, #A855F7 50%, #581C87 100%)';
  
  // Default gradient if no match
  return 'radial-gradient(circle at center, #9bc3a5 0%, #22C55E 50%, #14532D 100%)';
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
  if (type.includes("wine")) return "bg-rose-600";
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
  
  // Get the deal name with optional brand
  const dealName = useMemo(() => {
    let name = priceDisplay;
    if (deal.drinkType) {
      name += ` ${deal.drinkType.toUpperCase()}`;
    }
    if (deal.brand) {
      name += ` ${deal.brand.toUpperCase()}`;
    }
    return name;
  }, [deal, priceDisplay]);
  
  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(deal.id);
    }
  };
  
  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSave) {
      onToggleSave(deal.id);
    }
  };
  
  return (
    <div 
      className={cn(
        "relative overflow-hidden cursor-pointer transition-transform hover:scale-105 shadow-lg w-full mb-0",
        isGrayedOut && "opacity-50"
      )}
      onClick={handleCardClick}
      style={{
        // Credit card aspect ratio (1.586:1) - Width to height ratio
        aspectRatio: '1.586/1',
        borderRadius: '8px', // Slightly smaller radius
        background: getGradientBackground(deal.drinkType, deal.id),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        maxWidth: '100%', // Ensure it doesn't overflow its container
        height: 0, // This forces the aspect ratio to be respected
        paddingBottom: 'calc(100% / 1.586)', // 1/1.586 ≈ 63% - makes it landscape!
        marginBottom: '4px', // Small but noticeable margin
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
        <div className="relative p-4 flex-grow">
          {/* Discount badge */}
          {savingsAmount && (
            <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded-lg font-bold">
              {savingsAmount}
            </div>
          )}
          
          {/* Save button */}
          {onToggleSave && (
            <button 
              onClick={handleSaveClick}
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
        </div>
        
        {/* Bottom section with deal name and details */}
        <div className="p-3 pt-1 bg-black/20 flex flex-col items-center mt-auto">
          {/* Deal name */}
          <h3 className="font-bold text-white text-center text-xl font-fredoka leading-tight tracking-wide">
            {dealName}
          </h3>
          
          {/* Time and establishment */}
          <div className="flex items-center gap-1 text-white/90 text-xs mt-1">
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
        </div>
      </div>
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