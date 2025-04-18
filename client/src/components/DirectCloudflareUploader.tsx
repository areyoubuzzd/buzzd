import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CloudflareImage } from './CloudflareImage';

interface DirectCloudflareUploaderProps {
  onUploadComplete: (imageId: string) => void;
  category?: string;
  drinkName?: string;
  establishmentId?: number;
  dealId?: number;
}

/**
 * Component for direct uploading to Cloudflare Images
 * This approach bypasses the server-side file handling, going directly to Cloudflare
 */
export function DirectCloudflareUploader({
  onUploadComplete,
  category = 'general',
  drinkName,
  establishmentId,
  dealId
}: DirectCloudflareUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Get direct upload URL from our server
      const response = await fetch('/api/cloudflare/get-upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          drinkName,
          establishmentId,
          dealId
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get upload URL: ${response.statusText}`);
      }

      const { uploadURL, id } = await response.json();

      // Step 2: Upload directly to Cloudflare
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch(uploadURL, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload image: ${uploadResponse.statusText}`);
      }

      // Step 3: Use the image ID
      setUploadedImageId(id);
      onUploadComplete(id);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error during upload');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUpload}
          accept="image/jpeg,image/png,image/gif"
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          variant="outline"
          className="w-full"
        >
          {isLoading ? 'Uploading...' : 'Choose Image'}
        </Button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>

      {uploadedImageId && (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-2">Uploaded Image:</p>
          <div className="border rounded-md overflow-hidden w-full h-48">
            <CloudflareImage
              imageId={uploadedImageId}
              alt="Uploaded image"
              width={300}
              height={200}
              className="w-full h-full object-contain"
              category={category}
              drinkName={drinkName}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1 break-all">
            Image ID: {uploadedImageId}
          </p>
        </div>
      )}
    </div>
  );
}