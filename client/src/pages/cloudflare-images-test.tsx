import React, { useState } from 'react';
import { CloudflareImage, CloudflareImageUploader } from '@/components/CloudflareImage';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CloudflareImagesTestPage() {
  const [testImageId, setTestImageId] = useState<string>('');
  const [uploadedImageId, setUploadedImageId] = useState<string>('');
  const [testCategory, setTestCategory] = useState<string>('beer_pint');
  const [testDrinkName, setTestDrinkName] = useState<string>('Tiger Pint');

  // Handle successful upload
  const handleUploadComplete = (imageId: string) => {
    console.log('Upload complete! Image ID:', imageId);
    setUploadedImageId(imageId);
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Cloudflare Images Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Test existing images */}
        <Card>
          <CardHeader>
            <CardTitle>Test Existing Images</CardTitle>
            <CardDescription>
              Enter a Cloudflare Image ID to test if it loads correctly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imageId">Image ID</Label>
                <Input
                  id="imageId"
                  placeholder="Enter Cloudflare Image ID"
                  value={testImageId}
                  onChange={(e) => setTestImageId(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="Enter category (e.g., beer_pint)"
                  value={testCategory}
                  onChange={(e) => setTestCategory(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="drinkName">Drink Name</Label>
                <Input
                  id="drinkName"
                  placeholder="Enter drink name"
                  value={testDrinkName}
                  onChange={(e) => setTestDrinkName(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start space-y-4">
            <Button 
              onClick={() => {
                // Force reset to trigger reload
                setTestImageId('');
                setTimeout(() => setTestImageId(testImageId), 10);
              }}
            >
              Test Image
            </Button>
            
            {testImageId && (
              <div className="w-full">
                <p className="text-sm text-muted-foreground mb-2">Test image (public variant):</p>
                <div className="border rounded-md overflow-hidden w-full h-64">
                  <CloudflareImage
                    imageId={testImageId}
                    alt="Test image (public variant)"
                    width={300}
                    height={200}
                    className="w-full h-full object-contain"
                    category={testCategory}
                    drinkName={testDrinkName}
                  />
                </div>
                
                <p className="text-sm text-muted-foreground mb-2 mt-4">Test image (thumbnail variant):</p>
                <div className="border rounded-md overflow-hidden w-full h-32">
                  <CloudflareImage
                    imageId={testImageId}
                    alt="Test image (thumbnail variant)"
                    variant="thumbnail"
                    width={100}
                    height={100}
                    className="w-full h-full object-contain"
                    category={testCategory}
                    drinkName={testDrinkName}
                  />
                </div>
              </div>
            )}
          </CardFooter>
        </Card>
        
        {/* Upload new images */}
        <Card>
          <CardHeader>
            <CardTitle>Upload New Image</CardTitle>
            <CardDescription>
              Upload a new image to Cloudflare Images
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CloudflareImageUploader
              onUploadComplete={handleUploadComplete}
              category={testCategory}
              drinkName={testDrinkName}
            />
            
            {uploadedImageId && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Uploaded image ID:</p>
                <code className="bg-muted p-2 rounded block w-full overflow-x-auto">
                  {uploadedImageId}
                </code>
                
                <div className="border rounded-md overflow-hidden w-full h-64 mt-4">
                  <CloudflareImage
                    imageId={uploadedImageId}
                    alt="Uploaded image"
                    width={300}
                    height={200}
                    className="w-full h-full object-contain"
                    category={testCategory}
                    drinkName={testDrinkName}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-2">
              <strong>VITE_CLOUDFLARE_ACCOUNT_ID:</strong> {import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID ? "Set" : "Not set"}
            </p>
            <p className="text-sm mb-2">
              <strong>Expected Image URL format:</strong>
            </p>
            <code className="bg-muted p-2 rounded block w-full overflow-x-auto">
              https://imagedelivery.net/{import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID}/{"{image_id}"}/public
            </code>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}