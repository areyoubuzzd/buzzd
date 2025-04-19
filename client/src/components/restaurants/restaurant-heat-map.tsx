import React from 'react';
import { cn } from '@/lib/utils';

// Define a simplified Deal interface to avoid import issues
interface Deal {
  id?: number;
  valid_days?: string;
  hh_start_time?: string;
  hh_end_time?: string;
  happy_hour_price?: number;
  savings_percentage?: number;
  alcohol_category?: string;
}

interface RestaurantHeatMapProps {
  deals: Deal[];
  popularity?: number; // Optional explicit popularity value (0-10)
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * Restaurant Heat Map Component
 * 
 * Displays a visual representation of the popularity/activity level of a restaurant
 * based on its active deals.
 * 
 * Current popularity calculation:
 * - By default, popularity is based on the number of deals (1 deal = Trending, 2-3 deals = Hot, 4+ deals = Top Rated)
 * - The calculation can be refined in the future to include:
 *   - User check-ins (via the suggested check-in feature)
 *   - Deal savings/discounts amount
 *   - User likes/ratings
 *   - Deal engagement metrics
 */
export function RestaurantHeatMap({
  deals,
  popularity,
  size = 'md',
  showLabel = true,
  className
}: RestaurantHeatMapProps) {
  // Calculate popularity level (0-10) if not explicitly provided
  // Formula: deals.length / 2, with min 0 and max 10
  // This means: 2 deals = level 1, 4 deals = level 2, etc.
  const heatLevel = popularity !== undefined ? popularity : Math.min(10, Math.ceil(deals.length / 2));
  
  // Get responsive sizing based on size prop
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };
  
  // Determine heat level label with more positive wording
  let heatLabel = 'Trending';
  if (heatLevel >= 7) heatLabel = 'Top Rated';
  else if (heatLevel >= 4) heatLabel = 'Hot';
  
  // Gradient background based on heat level
  const gradientStyle = {
    background: getGradientForHeatLevel(heatLevel)
  };
  
  return (
    <div className={cn("w-full flex flex-col gap-1", className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs">
          <span className={cn(
            "font-medium",
            heatLevel >= 7 ? "text-green-600" : 
            heatLevel >= 4 ? "text-green-500" : "text-yellow-500"
          )}>
            {heatLabel}
          </span>
          <span className="text-gray-500 text-[10px]">{deals.length} deals</span>
        </div>
      )}
      
      <div className={cn("w-full rounded-full overflow-hidden relative", sizeClasses[size])}>
        {/* Animated pulse effect */}
        <div
          className={cn(
            "absolute inset-0 rounded-full opacity-30",
            heatLevel >= 7 ? "animate-pulse" : ""
          )}
          style={gradientStyle}
        />
        
        {/* Main gradient */}
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{
            ...gradientStyle,
            width: `${Math.max(5, (heatLevel / 10) * 100)}%`,
          }}
        />
      </div>
    </div>
  );
}

// Generate appropriate gradient based on heat level
// Now using yellow-green to green color scheme as requested
function getGradientForHeatLevel(level: number): string {
  if (level >= 8) {
    return 'linear-gradient(90deg, #2E8B57 0%, #006400 100%)'; // Top Rated - Dark Green
  } else if (level >= 5) {
    return 'linear-gradient(90deg, #32CD32 0%, #2E8B57 100%)'; // Hot - Medium Green
  } else if (level >= 3) {
    return 'linear-gradient(90deg, #9ACD32 0%, #32CD32 100%)'; // Trending - Light Green
  } else {
    return 'linear-gradient(90deg, #FFFF00 0%, #9ACD32 100%)'; // Yellow to Light Green
  }
}