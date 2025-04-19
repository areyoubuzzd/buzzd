import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
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
  popularity: explicitPopularity,
  size = 'md',
  showLabel = false,
  className = ''
}: RestaurantHeatMapProps) {
  // Calculate heat level based on number of deals and their discount percentage
  const { heatLevel, popularityLabel, gradient } = useMemo(() => {
    // If explicit popularity is provided, use that
    if (typeof explicitPopularity === 'number') {
      const heatLevel = Math.max(0, Math.min(10, explicitPopularity));
      
      // Generate appropriate label
      let popularityLabel = 'Regular';
      if (heatLevel >= 9) popularityLabel = 'Hot Spot!';
      else if (heatLevel >= 7) popularityLabel = 'Very Popular';
      else if (heatLevel >= 5) popularityLabel = 'Popular';
      else if (heatLevel >= 3) popularityLabel = 'Trending';
      
      // Generate appropriate gradient
      const gradient = getGradientForHeatLevel(heatLevel);
      
      return { heatLevel, popularityLabel, gradient };
    }
    
    // Otherwise calculate based on deals
    if (!deals || deals.length === 0) {
      return {
        heatLevel: 0,
        popularityLabel: 'New',
        gradient: 'from-gray-200 to-gray-300'
      };
    }
    
    // Count deals with good discounts (savings > 20%)
    const goodDeals = deals.filter(deal => deal.savings_percentage >= 20).length;
    const totalDeals = deals.length;
    
    // Calculate heat level (0-10)
    // Formula: Base score from number of deals + bonus for good deals percentage
    const baseScore = Math.min(5, totalDeals / 2); // Up to 5 points for number of deals
    const goodDealsRatio = goodDeals / totalDeals;
    const discountBonus = goodDealsRatio * 5; // Up to 5 points for good deals ratio
    
    const calculatedHeatLevel = baseScore + discountBonus;
    const finalHeatLevel = Math.min(10, calculatedHeatLevel);
    
    // Generate appropriate label
    let label = 'Regular';
    if (finalHeatLevel >= 9) label = 'Hot Spot!';
    else if (finalHeatLevel >= 7) label = 'Very Popular';
    else if (finalHeatLevel >= 5) label = 'Popular';
    else if (finalHeatLevel >= 3) label = 'Trending';
    else if (totalDeals === 0) label = 'New';
    
    // Get appropriate gradient
    const calculatedGradient = getGradientForHeatLevel(finalHeatLevel);
    
    return {
      heatLevel: finalHeatLevel,
      popularityLabel: label,
      gradient: calculatedGradient
    };
  }, [deals, explicitPopularity]);
  
  // Size classes
  const sizeClasses = {
    sm: 'h-1 w-full',
    md: 'h-1.5 w-full',
    lg: 'h-2 w-full'
  };
  
  // Label size
  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm'
  };
  
  // Return empty div if heat level is 0 and not showing label
  if (heatLevel === 0 && !showLabel) {
    return null;
  }
  
  return (
    <div className={`flex flex-col ${className}`}>
      {showLabel && (
        <motion.div 
          className={`text-center ${labelSizeClasses[size]} font-medium mb-1`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {popularityLabel}
        </motion.div>
      )}
      
      <motion.div 
        className={`relative overflow-hidden rounded-full ${sizeClasses[size]}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Base background */}
        <div className="absolute inset-0 bg-gray-200"></div>
        
        {/* Heat gradient with animation */}
        <motion.div
          className={`absolute h-full bg-gradient-to-r ${gradient}`}
          initial={{ width: '0%' }}
          animate={{ width: `${heatLevel * 10}%` }}
          transition={{ 
            duration: 0.8, 
            ease: "easeOut"
          }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-white opacity-0"
            animate={{
              opacity: [0, 0.1, 0],
              x: ['0%', '100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 1
            }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

// Helper function to get gradient colors based on heat level
function getGradientForHeatLevel(level: number): string {
  if (level >= 9) {
    return 'from-red-500 to-orange-500'; // Hot!
  } else if (level >= 7) {
    return 'from-orange-400 to-yellow-500'; // Very popular
  } else if (level >= 5) {
    return 'from-yellow-400 to-lime-500'; // Popular
  } else if (level >= 3) {
    return 'from-blue-400 to-cyan-500'; // Trending
  } else if (level > 0) {
    return 'from-gray-400 to-gray-500'; // Some activity
  }
  
  return 'from-gray-200 to-gray-300'; // No activity
}