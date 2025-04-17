import { useState, useEffect, useMemo } from 'react';
import { getRandomDrinkImageUrl, getDefaultDrinkImageUrl, createDrinkImageRegistry } from '@/lib/cloudinary-utils';

/**
 * Hook to get a random image URL for a drink
 * This ensures the same drink doesn't show the same image multiple times on a page
 */
export function useDrinkImage(drinkName: string | null | undefined, category?: string | null) {
  const [imageUrl, setImageUrl] = useState<string>('');
  
  useEffect(() => {
    // Get number of images based on drink popularity (you can adjust these numbers)
    const popularDrinks = ['heineken pint', 'tiger pint', 'carlsberg pint', 'asahi pint', 'guinness pint'];
    const maxImages = popularDrinks.includes(drinkName?.toLowerCase() || '') ? 5 : 3;
    
    // Generate random image URL
    if (drinkName) {
      setImageUrl(getRandomDrinkImageUrl(drinkName, maxImages));
    } else {
      setImageUrl(getDefaultDrinkImageUrl());
    }
  }, [drinkName, category]);
  
  return { imageUrl };
}

/**
 * Hook to manage images for multiple drinks, ensuring no duplicates
 */
export function useDrinkImageRegistry() {
  // Create a registry to track which images are used
  const registry = useMemo(() => createDrinkImageRegistry(), []);
  
  return {
    getImageUrl: (drinkName: string | null | undefined, category?: string): string => {
      if (!drinkName) return getDefaultDrinkImageUrl();
      
      // Get number of images based on drink popularity
      const popularDrinks = ['heineken pint', 'tiger pint', 'carlsberg pint', 'asahi pint', 'guinness pint'];
      const maxImages = popularDrinks.includes(drinkName.toLowerCase()) ? 5 : 3;
      
      return registry.getImageUrl(drinkName, maxImages);
    }
  };
}