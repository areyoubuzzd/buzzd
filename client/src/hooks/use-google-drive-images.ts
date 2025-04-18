/**
 * Custom hook for managing drink images from Google Drive
 */
import { useState, useEffect } from 'react';
import { createDrinkImageRegistry } from '@/lib/google-drive-utils';

// Create a global image registry that persists between renders
// This helps ensure we don't show different images for the same drink between renders
const globalImageRegistry = createDrinkImageRegistry();

/**
 * Hook for getting drink images from Google Drive
 * 
 * @returns A function to get an image URL for a drink
 */
export default function useDrinkImages() {
  // Use the global registry to get image URLs
  const getImageUrl = (drinkName: string, maxImages: number = 5, width = 400, height = 400) => {
    if (!drinkName) return '';
    return globalImageRegistry.getImageUrl(drinkName, maxImages, width, height);
  };
  
  return { getImageUrl };
}