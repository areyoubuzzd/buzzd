import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { getDrinkCategoryColor } from '@/lib/image-category-utils';

interface LocalImageProps {
  imageId?: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackColor?: string;
  category?: string;
  drinkName?: string;
}

/**
 * Component for displaying images from our local image storage
 * Works as a seamless replacement for CloudflareImage
 */
export function LocalImage({
  imageId,
  alt,
  width = 300,
  height = 300,
  className,
  fallbackColor,
  category = 'general',
  drinkName
}: LocalImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Generate category-specific color if no fallback provided
  const getCategoryColor = () => {
    return fallbackColor || getDrinkCategoryColor(category);
  };
  
  // If no imageId or an error occurred, use a simple colored div with text
  if (!imageId || imageError) {
    const displayText = drinkName || (category ? category.replace(/_/g, ' ') : 'Drink');
    const bgColor = getCategoryColor();
    
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
  
  // If we're loading, show a loading state
  if (isLoading) {
    return (
      <div 
        className={cn("relative flex items-center justify-center", className)}
        style={{ 
          width: width ? `${width}px` : 'auto', 
          height: height ? `${height}px` : 'auto',
          backgroundColor: "#f3f4f6"
        }}
      >
        <div className="flex flex-col items-center text-center p-2">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <p className="text-[10px] text-gray-500 mt-1">Loading</p>
        </div>
      </div>
    );
  }
  
  // Generate URL parameters if dimensions specified
  const dimensionParams = [];
  if (width) dimensionParams.push(`width=${width}`);
  if (height) dimensionParams.push(`height=${height}`);
  
  // Construct the local image URL with the correct path
  const imageUrl = `/images/drinks/${category}/${imageId}${dimensionParams.length > 0 ? `?${dimensionParams.join('&')}` : ''}`;
  
  // Image is ready to display
  return (
    <img
      src={imageUrl}
      alt={alt}
      width={width}
      height={height}
      className={cn("object-cover", className)}
      loading="lazy"
      onError={() => {
        console.warn(`Failed to load local image: ${imageId}`);
        setImageError(true);
      }}
    />
  );
}

/**
 * Component for uploading images to our local storage
 */
export function LocalImageUploader({
  onUploadComplete,
  category,
  drinkName,
  establishmentId,
  dealId
}: {
  onUploadComplete: (imageId: string, url: string) => void;
  category?: string;
  drinkName?: string;
  establishmentId?: number;
  dealId?: number;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Add metadata
      if (category) formData.append('category', category);
      if (drinkName) formData.append('drinkName', drinkName);
      if (establishmentId) formData.append('establishmentId', establishmentId.toString());
      if (dealId) formData.append('dealId', dealId.toString());
      
      // Upload to local storage
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
        onUploadComplete(data.result.id, data.result.url);
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
    <div className="flex flex-col gap-2">
      <label className="block">
        <span className="sr-only">Choose image</span>
        <input
          type="file"
          accept="image/*"
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
      </label>
      
      {isUploading && (
        <div className="text-sm text-blue-600 animate-pulse">
          Uploading image...
        </div>
      )}
      
      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}