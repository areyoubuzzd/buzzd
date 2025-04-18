import React from 'react';
import { CloudflareImage } from '@/components/CloudflareImage';
import { DirectCloudflareUploader } from '@/components/DirectCloudflareUploader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CloudflareTestImagePage() {
  // The image ID you provided
  const knownWorkingImageId = '80eb4b3b-d3ce-4536-8c39-debfc6a51f00';
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Cloudflare Image Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Known Working Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-64 bg-gray-100 rounded-md overflow-hidden">
              <CloudflareImage 
                imageId={knownWorkingImageId}
                alt="Test image from Cloudflare"
                width={500}
                height={300}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 break-all">
              Image ID: {knownWorkingImageId}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              URL: https://imagedelivery.net/489956ba5dc72130d94f247435918bf9/{knownWorkingImageId}/public
            </p>
            <div className="mt-2">
              <a 
                href={`https://imagedelivery.net/489956ba5dc72130d94f247435918bf9/${knownWorkingImageId}/public`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                Open image directly in new tab
              </a>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Image Uploader</CardTitle>
          </CardHeader>
          <CardContent>
            <DirectCloudflareUploader
              onUploadComplete={(imageId: string) => {
                console.log('Uploaded image ID:', imageId);
                alert(`Image uploaded successfully! ID: ${imageId}`);
              }}
              category="test"
              drinkName="Test Image"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}