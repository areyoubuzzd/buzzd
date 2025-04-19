import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { getDrinkCategoryColor } from '@/lib/image-category-utils';

interface LocalImageProps {
  imageId?: string;
  imagePath?: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackColor?: string;
  category?: string;
  drinkName?: string;
}

/**
 * Component for displaying local images with fallback
 */
export function LocalImage({
  imageId,
  imagePath,
  alt,
  width = 300,
  height = 200,
  className,
  fallbackColor,
  category = 'general',
  drinkName
}: LocalImageProps) {
  const [imageError, setImageError] = useState(false);
  
  // Use passed image path if available, otherwise construct from ID
  const imageSrc = imagePath || (imageId ? `/api/local-images/${imageId}` : '');
  
  // Generate a category-based color if no fallback color is provided
  const bgColor = fallbackColor || getDrinkCategoryColor(category);
  
  // Display text name based on drinkName or category
  const displayText = drinkName || category.replace(/_/g, ' ');
  
  // If no image source or there was an error, show the fallback
  if (!imageSrc || imageError) {
    return (
      <div 
        className={cn("relative overflow-hidden flex items-center justify-center", className)}
        style={{ 
          width: width ? `${width}px` : 'auto', 
          height: height ? `${height}px` : 'auto', 
          backgroundColor: bgColor 
        }}
      >
        <div className="text-white text-center p-4">
          <p className="font-medium text-sm break-words max-w-full">
            {displayText}
          </p>
        </div>
      </div>
    );
  }
  
  // Image is ready to display
  return (
    <img
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={cn("object-cover", className)}
      loading="lazy"
      onError={(e) => {
        console.warn(`Failed to load image: ${imageSrc}`);
        setImageError(true);
      }}
    />
  );
}

/**
 * Component for uploading local images
 */
export function LocalImageUploader({
  onUploadComplete,
  category,
  drinkName
}: {
  onUploadComplete: (data: { id: string; url: string }) => void;
  category?: string;
  drinkName?: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      // Create a FormData object for the file upload
      const formData = new FormData();
      formData.append('file', file);
      if (category) formData.append('category', category);
      if (drinkName) formData.append('drinkName', drinkName);
      
      // Upload the file to our local image API
      const response = await fetch('/api/local-images/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Call the callback with the image details
        onUploadComplete({
          id: data.result.id,
          url: data.result.url
        });
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="block w-full text-sm text-slate-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100
          disabled:opacity-50 disabled:cursor-not-allowed"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      
      {isUploading && (
        <div className="text-sm text-blue-600 animate-pulse mt-2">
          Uploading image...
        </div>
      )}
      
      {error && (
        <div className="text-sm text-red-600 mt-2">
          {error}
        </div>
      )}
    </div>
  );
}