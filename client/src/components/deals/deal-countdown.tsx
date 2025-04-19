import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface DealCountdownProps {
  endTime: string; // Format: "HH:MM" or "HH:MM:SS" or "HH:MM AM/PM"
  isActive: boolean;
  variant?: 'default' | 'compact' | 'card' | 'featured';
}

export function DealCountdown({ 
  endTime,
  isActive,
  variant = 'default'
}: DealCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    percentage: number;
  }>({ hours: 0, minutes: 0, seconds: 0, percentage: 100 });
  
  const [urgencyLevel, setUrgencyLevel] = useState<'low' | 'medium' | 'high'>('low');
  
  // Parse the end time into hours and minutes
  useEffect(() => {
    // Parse the end time into hours and minutes
    let endHours = 0;
    let endMinutes = 0;
    
    console.log(`Start time raw: "${endTime}", parsed: ${endHours * 60 + endMinutes}`);
    
    if (endTime.includes(':')) {
      const [hoursStr, minutesStr] = endTime.split(':');
      endHours = parseInt(hoursStr);
      endMinutes = parseInt(minutesStr);
    } else {
      // Format like "1700"
      if (endTime.length <= 2) {
        // Just hours like "9" or "17"
        endHours = parseInt(endTime);
        endMinutes = 0;
      } else if (endTime.length === 3) {
        // Format like "930" (9:30)
        endHours = parseInt(endTime.substring(0, 1));
        endMinutes = parseInt(endTime.substring(1));
      } else {
        // Format like "0930" or "1700"
        endHours = parseInt(endTime.substring(0, 2));
        endMinutes = parseInt(endTime.substring(2));
      }
    }
    
    console.log(`End time raw: "${endTime}", parsed: ${endHours * 60 + endMinutes}`);
    
    // Function to update countdown
    const updateCountdown = () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentSeconds = now.getSeconds();
      
      // Calculate total seconds in current time and end time
      const currentTimeValue = currentHours * 60 + currentMinutes;
      
      console.log(`Current time value: ${currentTimeValue}`);
      
      // Calculate end time in minutes since midnight
      const endTimeValue = endHours * 60 + endMinutes;
      
      // Calculate time remaining (in seconds)
      let remainingMinutes = endTimeValue - currentTimeValue;
      
      // Handle overnight case (if end time is tomorrow)
      if (remainingMinutes < 0) {
        remainingMinutes += 24 * 60; // Add 24 hours
      }
      
      // Convert to hours, minutes
      const hours = Math.floor(remainingMinutes / 60);
      const minutes = Math.floor(remainingMinutes % 60);
      const seconds = 60 - currentSeconds;
      
      // Calculate percentage of time remaining (assuming most happy hours are ~4 hours)
      // So we'll use 4 hours as the baseline for a "full" deal
      const totalMinutesInFullDeal = 4 * 60; // 4 hours
      const percentageRemaining = Math.min(100, Math.max(0, (remainingMinutes / totalMinutesInFullDeal) * 100));
      
      // Set urgency level based on time remaining
      let newUrgencyLevel: 'low' | 'medium' | 'high' = 'low';
      if (remainingMinutes <= 30) newUrgencyLevel = 'high';
      else if (remainingMinutes <= 60) newUrgencyLevel = 'medium';
      
      setTimeRemaining({
        hours,
        minutes,
        seconds,
        percentage: percentageRemaining
      });
      
      setUrgencyLevel(newUrgencyLevel);
    };
    
    // Initial update
    updateCountdown();
    
    // Set up interval to update every second
    const interval = setInterval(updateCountdown, 1000);
    
    // Clean up interval
    return () => clearInterval(interval);
  }, [endTime]);
  
  // Shortcut if deal is not active
  if (!isActive) {
    return null;
  }
  
  // Get variant-specific styles
  const variantClasses = {
    default: "bg-black/70 text-white px-2 py-1 rounded-md",
    compact: "inline-flex items-center gap-0.5",
    card: "bg-black/50 text-white px-1.5 py-0.5 rounded-md text-xs",
    featured: "bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold px-3 py-1.5 rounded-md shadow-md"
  };
  
  const textSizeClasses = {
    default: "text-sm",
    compact: "text-xs",
    card: "text-xs",
    featured: "text-base"
  };
  
  // Colors based on urgency
  const urgencyColors = {
    low: "text-green-400",
    medium: "text-amber-400",
    high: "text-red-400"
  };
  
  // Format display time
  const formattedHours = timeRemaining.hours > 0 ? `${timeRemaining.hours}h ` : '';
  const formattedMinutes = `${timeRemaining.minutes.toString().padStart(2, '0')}m`;
  const formattedSeconds = variant === 'featured' ? `:${timeRemaining.seconds.toString().padStart(2, '0')}s` : '';
  
  const displayTime = `${formattedHours}${formattedMinutes}${formattedSeconds}`;
  
  // Construct classNames based on variant and urgency
  const containerClasses = cn(
    variantClasses[variant],
    urgencyLevel === 'high' && "animate-pulse"
  );
  
  const timeClasses = cn(
    textSizeClasses[variant],
    urgencyColors[urgencyLevel],
    "font-mono font-medium"
  );
  
  // Animations for compact and card variants
  if (variant === 'compact') {
    return (
      <div className={containerClasses}>
        <Clock size={10} className={urgencyColors[urgencyLevel]} />
        <span className={timeClasses}>{displayTime}</span>
      </div>
    );
  }
  
  // Animation for default and featured variants
  return (
    <div className={containerClasses}>
      <div className="flex items-center gap-1.5">
        <Clock size={variant === 'featured' ? 18 : 14} className={urgencyColors[urgencyLevel]} />
        <div className="flex flex-col">
          <span className={timeClasses}>{displayTime}</span>
          {variant === 'featured' && (
            <span className="text-xs text-white/80">remaining</span>
          )}
        </div>
      </div>
      
      {/* Progress bar */}
      {variant === 'default' || variant === 'card' || variant === 'featured' ? (
        <motion.div 
          className="h-1 bg-gray-700 rounded-full mt-1 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className={cn(
              "h-full rounded-full",
              urgencyLevel === 'high' ? "bg-red-500" : 
              urgencyLevel === 'medium' ? "bg-amber-500" : "bg-green-500"
            )}
            initial={{ width: '100%' }}
            animate={{ 
              width: `${timeRemaining.percentage}%`,
              transition: { duration: 0.5 }
            }}
          />
        </motion.div>
      ) : null}
    </div>
  );
}