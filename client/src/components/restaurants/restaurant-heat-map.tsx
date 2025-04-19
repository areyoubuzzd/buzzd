import React from 'react';
import { cn } from '@/lib/utils';
import { Deal } from '@/types/api-types';

interface RestaurantHeatMapProps {
  deals: Deal[];
  popularity?: number; // Optional explicit popularity value (0-10)
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function RestaurantHeatMap({
  deals,
  popularity,
  size = 'md',
  showLabel = true,
  className
}: RestaurantHeatMapProps) {
  // Calculate popularity level (0-10) if not explicitly provided
  const heatLevel = popularity !== undefined ? popularity : Math.min(10, Math.ceil(deals.length / 2));
  
  // Get responsive sizing based on size prop
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };
  
  // Determine heat level label
  let heatLabel = 'Low Popularity';
  if (heatLevel >= 7) heatLabel = 'High Popularity';
  else if (heatLevel >= 4) heatLabel = 'Medium Popularity';
  
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
            heatLevel >= 7 ? "text-orange-500" : 
            heatLevel >= 4 ? "text-yellow-500" : "text-green-500"
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
function getGradientForHeatLevel(level: number): string {
  if (level >= 8) {
    return 'linear-gradient(90deg, #FFB347 0%, #FF3A3A 100%)'; // Hot
  } else if (level >= 5) {
    return 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)'; // Medium-hot
  } else if (level >= 3) {
    return 'linear-gradient(90deg, #CCFF00 0%, #FFD700 100%)'; // Warm
  } else {
    return 'linear-gradient(90deg, #00FF7F 0%, #ADFF2F 100%)'; // Cool
  }
}