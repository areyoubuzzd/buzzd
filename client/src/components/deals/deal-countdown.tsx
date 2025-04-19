import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { FaClock } from 'react-icons/fa';

interface DealCountdownProps {
  endTime: string; // Format: "HH:MM"
  isActive: boolean;
  variant?: 'default' | 'compact' | 'card' | 'featured';
}

export function DealCountdown({ 
  endTime, 
  isActive, 
  variant = 'default' 
}: DealCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });
  
  const [isUrgent, setIsUrgent] = useState<boolean>(false);
  const [isVeryUrgent, setIsVeryUrgent] = useState<boolean>(false);
  const [isCritical, setIsCritical] = useState<boolean>(false);
  
  const pulseAnimation = useAnimation();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Parse the end time into hours and minutes
  useEffect(() => {
    if (!isActive || !endTime) return;
    
    const calculateTimeLeft = () => {
      const now = new Date();
      const [hoursStr, minutesStr] = endTime.split(':');
      
      const endTimeDate = new Date();
      endTimeDate.setHours(parseInt(hoursStr));
      endTimeDate.setMinutes(parseInt(minutesStr));
      endTimeDate.setSeconds(0);
      
      // If end time is in the past for today, countdown is over
      if (endTimeDate <= now) {
        return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
      }
      
      const diffMs = endTimeDate.getTime() - now.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const hours = Math.floor(diffSec / 3600);
      const minutes = Math.floor((diffSec % 3600) / 60);
      const seconds = diffSec % 60;
      
      // Set urgency flags
      const newIsUrgent = diffSec <= 60 * 60; // Last hour
      const newIsVeryUrgent = diffSec <= 30 * 60; // Last 30 minutes
      const newIsCritical = diffSec <= 10 * 60; // Last 10 minutes
      
      setIsUrgent(newIsUrgent);
      setIsVeryUrgent(newIsVeryUrgent);
      setIsCritical(newIsCritical);
      
      return { hours, minutes, seconds, totalSeconds: diffSec };
    };
    
    // Initial calculation
    setTimeLeft(calculateTimeLeft());
    
    // Update every second
    intervalRef.current = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      // If countdown is over, clear interval
      if (newTimeLeft.totalSeconds <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 1000);
    
    // Clean up interval on unmount
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [endTime, isActive]);
  
  // Pulse animation effect
  useEffect(() => {
    if (isActive && timeLeft.totalSeconds > 0) {
      if (isCritical) {
        // Fast, intense pulsing for critical time
        pulseAnimation.start({
          scale: [1, 1.1, 1],
          opacity: [1, 0.7, 1],
          transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
        });
      } else if (isVeryUrgent) {
        // Medium-paced pulsing for very urgent time
        pulseAnimation.start({
          scale: [1, 1.05, 1],
          opacity: [1, 0.8, 1],
          transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
        });
      } else if (isUrgent) {
        // Slow, subtle pulsing for urgent time
        pulseAnimation.start({
          scale: [1, 1.03, 1],
          opacity: [1, 0.9, 1],
          transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        });
      } else {
        // No animation for normal time
        pulseAnimation.start({
          scale: 1,
          opacity: 1
        });
      }
    } else {
      // No animation if not active or time is up
      pulseAnimation.stop();
    }
  }, [isActive, isUrgent, isVeryUrgent, isCritical, timeLeft, pulseAnimation]);
  
  // Determine colors based on urgency
  const getColors = () => {
    if (!isActive || timeLeft.totalSeconds <= 0) {
      return {
        text: 'text-gray-500',
        bg: 'bg-gray-100',
        border: 'border-gray-200',
        icon: 'text-gray-400'
      };
    }
    
    if (isCritical) {
      return {
        text: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-500'
      };
    }
    
    if (isVeryUrgent) {
      return {
        text: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: 'text-orange-500'
      };
    }
    
    if (isUrgent) {
      return {
        text: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: 'text-yellow-500'
      };
    }
    
    return {
      text: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-500'
    };
  };
  
  const colors = getColors();
  
  // If not active or time is up, don't display countdown
  if (!isActive || timeLeft.totalSeconds <= 0) {
    return null;
  }
  
  // Different variants for different use cases
  switch (variant) {
    case 'compact':
      return (
        <motion.div
          animate={pulseAnimation}
          className={`flex items-center gap-1 text-xs ${colors.text}`}
        >
          <FaClock className={`h-3 w-3 ${colors.icon}`} />
          <span>
            {timeLeft.hours > 0 && `${timeLeft.hours}h `}
            {timeLeft.minutes}m
          </span>
        </motion.div>
      );
      
    case 'card':
      return (
        <motion.div
          animate={pulseAnimation}
          className={`flex items-center justify-center space-x-1 px-2 py-1 rounded-full ${colors.bg} ${colors.border} border`}
        >
          <FaClock className={`h-3 w-3 ${colors.icon}`} />
          <span className={`text-xs font-medium ${colors.text}`}>
            {timeLeft.hours > 0 ? `${timeLeft.hours}h ${timeLeft.minutes}m` : `${timeLeft.minutes}m ${timeLeft.seconds}s`}
          </span>
        </motion.div>
      );
      
    case 'featured':
      return (
        <motion.div
          animate={pulseAnimation}
          className={`flex flex-col items-center p-2 rounded-lg ${colors.bg} ${colors.border} border`}
        >
          <div className="text-sm font-medium mb-1">Ending In</div>
          <div className="flex items-center justify-center space-x-2">
            <AnimatePresence mode="wait">
              <motion.div 
                key={`h-${timeLeft.hours}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`flex flex-col items-center p-1.5 rounded ${colors.border} border`}
              >
                <span className={`text-xl font-bold ${colors.text}`}>
                  {timeLeft.hours.toString().padStart(2, '0')}
                </span>
                <span className="text-xs">hrs</span>
              </motion.div>
            </AnimatePresence>
            
            <span className={`text-xl font-bold ${colors.text}`}>:</span>
            
            <AnimatePresence mode="wait">
              <motion.div 
                key={`m-${timeLeft.minutes}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`flex flex-col items-center p-1.5 rounded ${colors.border} border`}
              >
                <span className={`text-xl font-bold ${colors.text}`}>
                  {timeLeft.minutes.toString().padStart(2, '0')}
                </span>
                <span className="text-xs">min</span>
              </motion.div>
            </AnimatePresence>
            
            <span className={`text-xl font-bold ${colors.text}`}>:</span>
            
            <AnimatePresence mode="wait">
              <motion.div 
                key={`s-${timeLeft.seconds}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`flex flex-col items-center p-1.5 rounded ${colors.border} border`}
              >
                <span className={`text-xl font-bold ${colors.text}`}>
                  {timeLeft.seconds.toString().padStart(2, '0')}
                </span>
                <span className="text-xs">sec</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      );
      
    default: // 'default'
      return (
        <motion.div
          animate={pulseAnimation}
          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full ${colors.bg} ${colors.border} border`}
        >
          <FaClock className={`h-3.5 w-3.5 ${colors.icon}`} />
          <span className={`text-sm font-medium ${colors.text}`}>
            {timeLeft.hours > 0 ? (
              `${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`
            ) : (
              `${timeLeft.minutes}m ${timeLeft.seconds}s`
            )}
          </span>
        </motion.div>
      );
  }
}