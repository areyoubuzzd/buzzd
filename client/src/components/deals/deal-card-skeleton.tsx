import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DealCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
      className="w-full"
    >
      <Card className="overflow-hidden rounded-xl relative h-[175px]">
        {/* Skeleton background with shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#353e6b] to-[#232946] animate-pulse">
          {/* Decorative elements */}
          <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-gray-300/20"></div>
          <div className="absolute bottom-12 right-4 w-8 h-2 rounded-full bg-gray-300/20 rotate-45"></div>
        </div>
        
        {/* Savings badge skeleton */}
        <div className="absolute top-2 right-2 w-12 h-5 rounded-full bg-gray-300/20"></div>
        
        {/* Hero image skeleton */}
        <div className="absolute inset-0 flex items-center justify-center pt-4">
          <div className="w-20 h-20 rounded-full bg-gray-300/20"></div>
        </div>
        
        {/* Content overlay skeleton */}
        <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-black via-black/80 to-transparent px-3 py-3">
          {/* Deal headline */}
          <Skeleton className="h-5 w-3/4 mb-2 bg-gray-300/20" />
          
          {/* Restaurant name */}
          <Skeleton className="h-4 w-2/3 mt-2 bg-gray-300/20" />
          
          {/* Distance and time info */}
          <div className="flex justify-between mt-2">
            <Skeleton className="h-3 w-16 bg-gray-300/20" />
            <Skeleton className="h-3 w-12 bg-gray-300/20" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function DealCardSkeletonRow() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-6">
      {[...Array(4)].map((_, i) => (
        <DealCardSkeleton key={i} />
      ))}
    </div>
  );
}