import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { LocalImage, LocalImageUploader } from '@/components/LocalImage';
import { DrinkCategory } from '@/lib/image-category-utils';

export default function LocalImageTest() {
  const [uploadedImages, setUploadedImages] = useState<{category: string, imageId: string, url: string}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('beer_pint');
  const [testImages, setTestImages] = useState<{ [key: string]: string[] }>({});
  
  // Load test images when component mounts
  useEffect(() => {
    async function loadTestImages() {
      try {
        const response = await fetch('/api/local-images/all');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setTestImages(data.images || {});
          }
        }
      } catch (error) {
        console.error('Error loading test images:', error);
      }
    }
    
    loadTestImages();
  }, []);
  
  // Handle when an image is uploaded
  const handleUploadComplete = (imageId: string, url: string) => {
    console.log("Upload complete:", {imageId, url});
    setUploadedImages(prev => [
      ...prev, 
      {category: selectedCategory, imageId, url}
    ]);
    
    // Refresh image list
    fetch('/api/local-images/all').then(async response => {
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTestImages(data.images || {});
        }
      }
    }).catch(error => {
      console.error('Error refreshing test images:', error);
    });
  };
  
  // Get categories from DrinkCategory enum
  const categories = Object.values(DrinkCategory);
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Local Image Test</h1>
      
      <Tabs defaultValue="upload">
        <TabsList className="mb-4">
          <TabsTrigger value="upload">Upload Images</TabsTrigger>
          <TabsTrigger value="test">Test Images</TabsTrigger>
          <TabsTrigger value="view-all">View All Images</TabsTrigger>
        </TabsList>
        
        {/* Upload Tab */}
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload New Image</CardTitle>
              <CardDescription>
                Upload a new image for testing the LocalImage component
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <LocalImageUploader 
                    category={selectedCategory}
                    onUploadComplete={handleUploadComplete}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Recently Uploaded Images */}
          {uploadedImages.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Recently Uploaded Images</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploadedImages.map((image, index) => (
                  <Card key={`uploaded-${index}`}>
                    <CardContent className="pt-4">
                      <div className="w-full aspect-square rounded-md overflow-hidden">
                        <LocalImage 
                          imageId={image.imageId}
                          alt={`Uploaded image ${index + 1}`}
                          category={image.category}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-medium">{image.category.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-500 break-all mt-1">{image.imageId}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* Test Tab */}
        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Test Images by Category</CardTitle>
              <CardDescription>
                Select a category to test images
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {/* Test with a known image ID */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">LocalImage Component</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="w-full aspect-square rounded-md overflow-hidden">
                        <LocalImage 
                          imageId={null}
                          category={selectedCategory}
                          alt="Test Local Image"
                          drinkName={selectedCategory.replace(/_/g, ' ')}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Random image from this category using the utility function */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Random Category Placeholder</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="w-full aspect-square rounded-md overflow-hidden">
                        <LocalImage 
                          imageId={null}
                          category={selectedCategory}
                          alt="Random Category Placeholder"
                          drinkName={selectedCategory.replace(/_/g, ' ')}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* View All Images Tab */}
        <TabsContent value="view-all">
          <Card>
            <CardHeader>
              <CardTitle>All Uploaded Images</CardTitle>
              <CardDescription>
                Browse all images by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(testImages).length === 0 ? (
                <p>No images uploaded yet.</p>
              ) : (
                <div className="space-y-8">
                  {Object.entries(testImages).map(([category, imageIds]) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold mb-3 capitalize">{category.replace(/_/g, ' ')}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {imageIds.map((imageId) => (
                          <div key={imageId} className="flex flex-col">
                            <div className="w-full aspect-square rounded-md overflow-hidden">
                              <LocalImage 
                                imageId={imageId}
                                category={category}
                                alt={`${category} image`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1 break-all">{imageId}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}