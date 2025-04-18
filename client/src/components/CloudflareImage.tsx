import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { mapToDrinkCategory, getDrinkCategoryColor } from '@/lib/drink-category-utils';
import { Loader2 } from 'lucide-react';

interface CloudflareImageProps {
  imageId: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  variant?: string;
  fallbackColor?: string;
  fallbackSrc?: string;
  category?: string; // e.g., 'beer', 'wine', 'cocktail'
  drinkName?: string; // The specific drink name for more accurate categorization
}

/**
 * Component for displaying images from Cloudflare Images
 * Handles fallbacks if the image fails to load or if no imageId is provided
 */
export function CloudflareImage({
  imageId,
  alt,
  width = 300,
  height = 200,
  className,
  variant = 'public',
  fallbackColor = '#f3f4f6',
  fallbackSrc,
  category = 'general',
  drinkName
}: CloudflareImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isImageAvailable, setIsImageAvailable] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  // Fixed Cloudflare account ID for image delivery
  const accountId = "kx7S-b2sJYbGgWyc5FfQUg";
  
  // For newly uploaded images, Cloudflare might need a moment to process them
  // We'll check if the image is available with a simple fetch
  useEffect(() => {
    if (!imageId || imageError) return;
    
    // If we've retried too many times, give up - Cloudflare can be slow sometimes
    if (retryCount > 10) {
      console.warn(`Gave up waiting for image ${imageId} after ${retryCount} attempts`);
      setImageError(true);
      return;
    }
    
    // Construct the image URL
    const url = `https://imagedelivery.net/${accountId}/${imageId}/${variant}`;
    
    // Check if the image is available
    let isMounted = true;
    setIsLoading(true);
    
    const checkImage = async () => {
      try {
        // Use a proxy request through our server to avoid CORS issues with HEAD requests
        // Direct HEAD requests to Cloudflare may fail in the browser
        const response = await fetch(`/api/cloudflare/images/${imageId}/check`);
        const responseData = await response.json();
        
        if (!isMounted) return;
        
        // HTTP status 200 means image is ready, 202 means it's still processing
        if (response.status === 200 && responseData.success) {
          console.log(`Image ${imageId} is available and ready to display`);
          setIsImageAvailable(true);
          setIsLoading(false);
        } else {
          // Image is not ready yet, retry after a delay
          console.log(`Image ${imageId} not ready yet (status: ${response.status}), retrying...`);
          setRetryCount(prev => prev + 1);
          setIsLoading(true);
          
          // Retry with exponential backoff
          setTimeout(checkImage, 1000 * Math.min(3, retryCount + 1));
        }
      } catch (error) {
        if (!isMounted) return;
        console.error(`Error checking image availability: ${error}`);
        setImageError(true);
        setIsLoading(false);
      }
    };
    
    checkImage();
    
    return () => {
      isMounted = false;
    };
  }, [imageId, accountId, variant, retryCount, imageError]);

  // Map to detailed drink category for better image organization
  const detailedCategory = drinkName ? mapToDrinkCategory(drinkName, category) : category;
  
  // Generate category-specific fallback if no fallbackSrc is provided
  const getCategoryFallback = () => {
    if (fallbackSrc) return fallbackSrc;
    
    // Always return an SVG fallback for reliability
    // This ensures we always have an image that can load immediately
    const bgcolor = getDrinkCategoryColor(detailedCategory);
    const textColor = '#ffffff';
    const categoryShortName = detailedCategory.split('_').join(' ');
    
    // Create a more informative SVG with the category name
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='${bgcolor}'/%3E%3Ctext x='150' y='100' font-family='Arial' font-size='16' fill='${textColor}' text-anchor='middle'%3E${categoryShortName}%3C/text%3E%3Ctext x='150' y='125' font-family='Arial' font-size='14' fill='${textColor}' text-anchor='middle'%3E(Loading Image)%3C/text%3E%3C/svg%3E`;
  };

  // If no imageId or there was an error, use the fallback
  if (!imageId || imageError) {
    return (
      <div 
        className={cn("relative overflow-hidden", className)}
        style={{ 
          width: width ? `${width}px` : 'auto', 
          height: height ? `${height}px` : 'auto', 
          backgroundColor: fallbackColor 
        }}
      >
        <img
          src={getCategoryFallback()}
          alt={alt}
          width={width}
          height={height}
          className={cn("object-cover w-full h-full", className)}
          onError={() => {
            // If even the fallback fails, just show the color background
            console.warn(`Fallback image failed to load for ${alt}`);
          }}
        />
      </div>
    );
  }
  
  // Construct the Cloudflare Images URL
  let imageUrl: string;
  
  if (accountId) {
    // Format: https://imagedelivery.net/{account-id}/{image-id}/{variant}
    imageUrl = `https://imagedelivery.net/${accountId}/${imageId}/${variant}`;
    
    // Add dimensions if provided
    if (width || height) {
      const params = [];
      if (width) params.push(`width=${width}`);
      if (height) params.push(`height=${height}`);
      imageUrl += `?${params.join('&')}&fit=cover`;
    }
  } else {
    // Fallback if Cloudflare account ID is not configured
    console.warn('Cloudflare Images account ID not configured in environment variables');
    return (
      <img
        src={getCategoryFallback()}
        alt={alt}
        width={width}
        height={height}
        className={cn("object-cover", className)}
      />
    );
  }
  
  // If we're loading/waiting for Cloudflare to process the image, show a loading state
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
          <p className="text-[10px] text-gray-500 mt-1">Processing</p>
          <p className="text-[10px] text-gray-400">Try {retryCount}/10</p>
        </div>
      </div>
    );
  }
  
  // Image is ready to display
  return (
    <img
      src={imageUrl}
      alt={alt}
      width={width}
      height={height}
      className={cn("object-cover", className)}
      loading="lazy"
      onError={(e) => {
        console.warn(`Failed to load image from Cloudflare: ${imageId}`);
        console.log(`Attempted to load from URL: ${(e.target as HTMLImageElement).src}`);
        setImageError(true);
      }}
    />
  );
}

/**
 * Component for uploading images to Cloudflare Images
 */
export function CloudflareImageUploader({
  onUploadComplete,
  category,
  drinkName,
  establishmentId,
  dealId
}: {
  onUploadComplete: (imageId: string) => void;
  category?: string;
  drinkName?: string;
  establishmentId?: number;
  dealId?: number;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map to detailed category for better image organization
  const detailedCategory = drinkName && category 
    ? mapToDrinkCategory(drinkName, category) 
    : category || 'general';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      // Use the server upload endpoint instead of direct upload to avoid CORS issues
      const formData = new FormData();
      formData.append('file', file);
      
      // Add metadata with detailed categorization
      formData.append('category', detailedCategory);
      if (drinkName) formData.append('drinkName', drinkName);
      if (establishmentId) formData.append('establishmentId', establishmentId.toString());
      if (dealId) formData.append('dealId', dealId.toString());
      formData.append('type', 'drink');

      // Upload the file through our backend
      const uploadResponse = await fetch('/api/cloudflare/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        let errorMessage = `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`;
        
        try {
          // Try to parse as JSON first
          const responseData = await uploadResponse.json();
          console.error('Upload failed:', responseData);
          errorMessage = responseData.error || responseData.details || errorMessage;
        } catch (jsonError) {
          // If not JSON, treat as text
          const errorText = await uploadResponse.text();
          console.error('Upload failed (text):', errorText);
          errorMessage = `${errorMessage}. ${errorText}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await uploadResponse.json();
      const imageId = data.result?.id;
      
      if (!imageId) {
        throw new Error('No image ID returned from upload');
      }

      // Call the callback with the new image ID
      onUploadComplete(imageId);
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