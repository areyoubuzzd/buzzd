import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { mapToDrinkCategory, getDrinkCategoryColor } from '@/lib/image-category-utils';
import { Loader2 } from 'lucide-react';
import { CLOUDFLARE_ACCOUNT_ID, getCloudflareImageUrl, checkImageStatus } from '@/lib/cloudflare-config';

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
  
  // For newly uploaded images, Cloudflare might need a moment to process them
  // We'll check if the image is available with a simple fetch
  useEffect(() => {
    if (!imageId || imageError) return;
    
    // Skip check and just try to load the image directly for certain IDs
    // This helps with custom IDs and reduces API load
    if (imageId.includes('/') || imageId.length < 36) {
      console.log(`Directly attempting to display image ${imageId} (skipping check)`);
      setIsImageAvailable(true);
      setIsLoading(false);
      return;
    }
    
    // Immediately show fallback after 1 attempt
    if (retryCount > 0) {
      console.warn(`Using fallback for image ${imageId} to reduce API load`);
      setImageError(true);
      return;
    }
    
    // Construct the image URL using our centralized config
    const url = getCloudflareImageUrl(imageId, variant);
    
    // Check if the image is available
    let isMounted = true;
    setIsLoading(true);
    
    // Skip the status check and directly attempt to load the image
    setIsImageAvailable(true);
    setIsLoading(false);
    
    /* Commenting out the status check to improve performance and avoid rate limiting
    const checkImage = async () => {
      try {
        // Use our centralized utility function to check image status
        const { status, success } = await checkImageStatus(imageId);
        
        if (!isMounted) return;
        
        // HTTP status 200 means image is ready
        if (status === 200 && success) {
          console.log(`Image ${imageId} is available and ready to display`);
          setIsImageAvailable(true);
          setIsLoading(false);
          return;
        }
        
        // If we get here, the image is not ready yet - immediately use fallback
        console.log(`Image ${imageId} not ready yet (status: ${status}), using fallback`);
        setRetryCount(prev => prev + 1);
        setImageError(true);
        setIsLoading(false);
      } catch (error) {
        if (!isMounted) return;
        console.error(`Error checking image availability: ${error}`);
        setImageError(true);
        setIsLoading(false);
      }
    };
    
    checkImage();
    */
    
    return () => {
      isMounted = false;
    };
  }, [imageId, variant, retryCount, imageError]);

  // Map to detailed drink category for better image organization
  const detailedCategory = drinkName ? mapToDrinkCategory(drinkName, category) : category;
  
  // Generate simpler fallback without SVG which might cause issues
  const getCategoryColor = () => {
    return fallbackColor || getDrinkCategoryColor(detailedCategory);
  };

  // If no imageId or there was an error, use the fallback color with text
  if (!imageId || imageError) {
    const displayText = drinkName || (detailedCategory ? detailedCategory.replace(/_/g, ' ') : 'Drink');
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
  
  // Construct the Cloudflare Images URL using our centralized config
  const imageUrl = getCloudflareImageUrl(imageId, variant, width, height);
  
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
          <p className="text-[10px] text-gray-400">Try {retryCount}/3</p>
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