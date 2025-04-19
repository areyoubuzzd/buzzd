import React, { useState } from 'react';
import { LocalImage, LocalImageUploader } from '@/components/LocalImage';
import { DrinkCategory, getDrinkCategoryColor } from '@/lib/image-category-utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Info } from 'lucide-react';
import { Link } from 'wouter';

export default function LocalImageTestPage() {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(DrinkCategory.BEER_PINT);
  const [drinkName, setDrinkName] = useState<string>('');
  
  // Simple array of common drink categories for testing
  const commonCategories = [
    // Beer categories
    { id: DrinkCategory.BEER_PINT, name: 'Beer (Pint)' },
    { id: DrinkCategory.BEER_BUCKET, name: 'Beer Bucket' },
    { id: DrinkCategory.BEER_TOWER, name: 'Beer Tower' },
    { id: DrinkCategory.BEER_BOTTLE, name: 'Beer Bottle' },
    
    // Wine categories
    { id: DrinkCategory.WINE_RED, name: 'Red Wine' },
    { id: DrinkCategory.WINE_WHITE, name: 'White Wine' },
    { id: DrinkCategory.WINE_ROSE, name: 'Rosé Wine' },
    { id: DrinkCategory.WINE_SPARKLING, name: 'Sparkling Wine' },
    
    // Cocktail categories
    { id: DrinkCategory.COCKTAIL_MARGARITA, name: 'Margarita' },
    { id: DrinkCategory.COCKTAIL_MOJITO, name: 'Mojito' },
    { id: DrinkCategory.COCKTAIL_MARTINI, name: 'Martini' },
    { id: DrinkCategory.COCKTAIL_NEGRONI, name: 'Negroni' },
    
    // Spirit categories
    { id: DrinkCategory.SPIRIT_WHISKY, name: 'Whisky' },
    { id: DrinkCategory.SPIRIT_VODKA, name: 'Vodka' },
    { id: DrinkCategory.SPIRIT_RUM, name: 'Rum' },
    { id: DrinkCategory.SPIRIT_GIN, name: 'Gin' },
    
    // Food and other categories
    { id: DrinkCategory.FOOD, name: 'Food' },
    { id: DrinkCategory.DESSERT, name: 'Dessert' },
  ];
  
  // Handle image upload completion
  const handleUploadComplete = (imageId: string, url: string) => {
    console.log('Upload complete:', { imageId, url });
    setUploadedImageId(imageId);
    setUploadedImageUrl(url);
    
    // Switch to display tab after successful upload
    setActiveTab('display');
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Local Image Storage Tester</h1>
        <p className="text-gray-600 mb-4">
          Test uploading and displaying images using the local image storage service.
          Images are stored at 300x300 size for efficiency.
        </p>
        
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertTitle>About Local Image Storage</AlertTitle>
          <AlertDescription>
            This implementation stores images directly on the server for reliability.
            All images are automatically optimized and resized to 300x300 pixels.
          </AlertDescription>
        </Alert>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="upload">Upload Images</TabsTrigger>
          <TabsTrigger value="display">Display Test</TabsTrigger>
        </TabsList>
        
        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Upload a New Image</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" htmlFor="category">
                Select Category
              </label>
              <select
                id="category"
                className="w-full p-2 border rounded-md"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {commonCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" htmlFor="drinkName">
                Drink Name (Optional)
              </label>
              <input
                id="drinkName"
                type="text"
                className="w-full p-2 border rounded-md"
                value={drinkName}
                onChange={(e) => setDrinkName(e.target.value)}
                placeholder="e.g., Heineken Pint, House Red Wine"
              />
            </div>
            
            <div className="mt-6">
              <LocalImageUploader
                onUploadComplete={handleUploadComplete}
                category={selectedCategory}
                drinkName={drinkName || undefined}
              />
            </div>
            
            {uploadedImageId && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800 font-medium">Image uploaded successfully!</p>
                <p className="text-sm text-green-700 mt-1">Image ID: {uploadedImageId}</p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm text-blue-600" 
                  onClick={() => setActiveTab('display')}
                >
                  Switch to Display tab to view your image
                </Button>
              </div>
            )}
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-700 mb-4">
              This page demonstrates our local image storage solution with:
            </p>
            
            <ul className="list-disc pl-5 mb-4 space-y-2 text-gray-700">
              <li>
                <strong>Automatic Optimization:</strong> All images are resized to 300x300 pixels and compressed
              </li>
              <li>
                <strong>Category Organization:</strong> Images are organized by drink category
              </li>
              <li>
                <strong>Fallback Display:</strong> When images fail to load, a colored placeholder is shown
              </li>
              <li>
                <strong>Metadata Storage:</strong> Drink names and categories are saved with each image
              </li>
            </ul>
            
            <p className="text-gray-700">
              The local storage solution is much simpler than Cloudflare Images and more reliable for our needs.
            </p>
          </Card>
        </TabsContent>
        
        {/* Display Tab */}
        <TabsContent value="display" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Your Uploaded Image</h2>
            
            {uploadedImageId ? (
              <div className="flex flex-col items-center">
                <div className="mb-4">
                  <LocalImage 
                    imageId={uploadedImageId}
                    alt={drinkName || 'Uploaded drink'} 
                    className="w-[300px] h-[300px] rounded-md border"
                    category={selectedCategory}
                    drinkName={drinkName}
                  />
                </div>
                
                <div className="text-sm text-gray-700 mt-2">
                  <p><strong>Image ID:</strong> {uploadedImageId}</p>
                  <p><strong>Category:</strong> {selectedCategory}</p>
                  {drinkName && <p><strong>Drink Name:</strong> {drinkName}</p>}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No image uploaded yet. Go to the Upload tab to add an image.</p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => setActiveTab('upload')}
                >
                  Upload an Image
                </Button>
              </div>
            )}
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Fallback Display Test</h2>
            <p className="text-gray-700 mb-4">
              The examples below show how missing images are handled with colored fallbacks:
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
              {commonCategories.slice(0, 8).map((category) => (
                <div key={category.id} className="flex flex-col items-center">
                  <LocalImage 
                    imageId={null} 
                    alt={category.name}
                    className="w-[150px] h-[150px] rounded-md"
                    category={category.id}
                    drinkName={category.name}
                    fallbackColor={getDrinkCategoryColor(category.id)}
                  />
                  <p className="text-sm text-gray-600 mt-2">{category.name}</p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Separator className="my-8" />
      
      <div className="text-center text-sm text-gray-500">
        <p>Images are stored at 300x300 pixels for optimal performance and efficiency.</p>
        <p className="mt-1">
          The colored fallbacks are shown when images are not available or fail to load.
        </p>
      </div>
    </div>
  );
}