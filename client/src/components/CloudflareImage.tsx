import React, { useState } from 'react';
import { cn } from '@/lib/utils';

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
  category = 'general'
}: CloudflareImageProps) {
  const [imageError, setImageError] = useState(false);
  const accountId = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID as string;

  // Generate category-specific fallback if no fallbackSrc is provided
  const getCategoryFallback = () => {
    if (fallbackSrc) return fallbackSrc;
    
    // Default fallbacks based on drink category
    switch (category.toLowerCase()) {
      case 'beer':
        return '/static/images/drinks/beer.jpg';
      case 'wine':
        return '/static/images/drinks/wine.jpg';
      case 'cocktail':
        return '/static/images/drinks/cocktail.jpg';
      case 'whisky':
      case 'whiskey':
        return '/static/images/drinks/whisky.jpg';
      case 'gin':
        return '/static/images/drinks/gin.jpg';
      case 'vodka':
        return '/static/images/drinks/vodka.jpg';
      case 'rum':
        return '/static/images/drinks/rum.jpg';
      default:
        return '/static/images/drinks/default.jpg';
    }
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
  
  return (
    <img
      src={imageUrl}
      alt={alt}
      width={width}
      height={height}
      className={cn("object-cover", className)}
      loading="lazy"
      onError={() => {
        console.warn(`Failed to load image from Cloudflare: ${imageId}`);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      // Use the server upload endpoint instead of direct upload to avoid CORS issues
      const formData = new FormData();
      formData.append('file', file);
      
      // Add metadata
      if (category) formData.append('category', category);
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
        const errorText = await uploadResponse.text();
        console.error('Upload failed:', errorText);
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}. ${errorText}`);
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