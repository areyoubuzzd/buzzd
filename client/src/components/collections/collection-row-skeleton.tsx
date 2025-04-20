import React from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { DealCardSkeleton } from '@/components/deals/deal-card-skeleton';

export function CollectionRowSkeleton() {
  // Generate a random width between 35% and 60% for the collection title
  const titleWidth = React.useMemo(() => {
    return `${Math.floor(Math.random() * 25) + 35}%`;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 25,
        delay: 0.1
      }}
      className="mb-8"
    >
      {/* Collection title skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <Skeleton
            className="h-8 mb-1 rounded-md"
            style={{ width: titleWidth }}
          />
          <Skeleton 
            className="h-4 w-3/5 rounded-md" 
          />
        </div>
        <Skeleton className="h-9 w-20 rounded-full" />
      </div>

      {/* Deal cards skeleton row */}
      <div className="overflow-x-auto pb-2 hide-scrollbar">
        <div className="flex gap-3">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className="w-[170px] flex-shrink-0"
              style={{ 
                animationDelay: `${i * 100}ms`,
                opacity: 1 - (i * 0.15)
              }}
            >
              <DealCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function CollectionsLoadingSkeleton() {
  return (
    <div className="space-y-10">
      {[...Array(3)].map((_, i) => (
        <CollectionRowSkeleton key={i} />
      ))}
    </div>
  );
}