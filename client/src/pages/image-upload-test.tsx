import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DrinkCategory, mapToDrinkCategory, getDrinkCategoryColor, formatCloudflareCustomId, cacheImageId } from '@/lib/image-category-utils';
import { CloudflareImage } from '@/components/CloudflareImage';
import { addImageToCategory, getCategoryImages } from '@/lib/cloudflare-config';
import { Loader2, UploadCloud, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

/**
 * Test page for uploading drink images to Cloudflare Images
 * This provides an interface to easily categorize and upload drink images
 */
export default function ImageUploadTest() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [category, setCategory] = useState<DrinkCategory>('beer_pint');
  const [drinkName, setDrinkName] = useState('');
  const [variant, setVariant] = useState('1');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [testCategory, setTestCategory] = useState<DrinkCategory>('beer_pint');

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setUploadSuccess(false);
    setUploadedImageId(null);
    
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Selected file is not an image');
      return;
    }
    
    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      // Create a FormData object for the file upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', 'drink');
      formData.append('category', category);
      formData.append('drinkName', drinkName || category);
      formData.append('customId', formatCloudflareCustomId(category, parseInt(variant)));
      formData.append('variant', variant);
      
      // Upload the file to Cloudflare Images via our server
      const response = await fetch('/api/cloudflare/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setUploadSuccess(true);
        setUploadedImageId(data.result.id);
        
        // Cache the image ID for future use
        cacheImageId(data.result.id, category);
        
        // Add to our category cache for immediate display
        addImageToCategory(category, data.result.id);
        
        // Reset form
        setSelectedFile(null);
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  // Categories for the select dropdowns
  const categories: Array<{value: DrinkCategory, label: string}> = [
    // Beer categories
    { value: 'beer_pint', label: 'Beer - Pint' },
    { value: 'beer_bucket', label: 'Beer - Bucket' },
    { value: 'beer_1for1', label: 'Beer - 1-for-1' },
    { value: 'beer_freeflow', label: 'Beer - Free Flow' },
    { value: 'beer_pitcher', label: 'Beer - Pitcher' },
    { value: 'beer_tower', label: 'Beer - Tower' },
    
    // Wine categories
    { value: 'wine_red_glass', label: 'Wine - Red Glass' },
    { value: 'wine_white_glass', label: 'Wine - White Glass' },
    { value: 'wine_bubbly_glass', label: 'Wine - Bubbly Glass' },
    { value: 'wine_prosecco_glass', label: 'Wine - Prosecco Glass' },
    { value: 'wine_sake_glass', label: 'Wine - Sake Glass' },
    { value: 'wine_soju_glass', label: 'Wine - Soju Glass' },
    { value: 'wine_red_1for1', label: 'Wine - Red 1-for-1' },
    { value: 'wine_white_1for1', label: 'Wine - White 1-for-1' },
    { value: 'wine_bubbly_1for1', label: 'Wine - Bubbly 1-for-1' },
    { value: 'wine_prosecco_1for1', label: 'Wine - Prosecco 1-for-1' },
    { value: 'wine_red_freeflow', label: 'Wine - Red Free Flow' },
    { value: 'wine_white_freeflow', label: 'Wine - White Free Flow' },
    { value: 'wine_bubbly_freeflow', label: 'Wine - Bubbly Free Flow' },
    { value: 'wine_prosecco_freeflow', label: 'Wine - Prosecco Free Flow' },
    
    // Cocktail categories
    { value: 'cocktail_margarita', label: 'Cocktail - Margarita' },
    { value: 'cocktail_martini', label: 'Cocktail - Martini' },
    { value: 'cocktail_singapore_sling', label: 'Cocktail - Singapore Sling' },
    { value: 'cocktail_espresso_martini', label: 'Cocktail - Espresso Martini' },
    { value: 'cocktail_cosmopolitan', label: 'Cocktail - Cosmopolitan' },
    { value: 'cocktail_highball', label: 'Cocktail - Highball' },
    { value: 'cocktail_gin_tonic', label: 'Cocktail - Gin & Tonic' },
    
    // Spirit glass categories
    { value: 'spirit_whisky_glass', label: 'Spirit - Whisky Glass' },
    { value: 'spirit_vodka_glass', label: 'Spirit - Vodka Glass' },
    { value: 'spirit_rum_glass', label: 'Spirit - Rum Glass' },
    
    // Spirit bottle categories
    { value: 'spirit_whisky_bottle', label: 'Spirit - Whisky Bottle' },
    { value: 'spirit_vodka_bottle', label: 'Spirit - Vodka Bottle' },
    { value: 'spirit_rum_bottle', label: 'Spirit - Rum Bottle' },
    { value: 'spirit_tequila_bottle', label: 'Spirit - Tequila Bottle' },
    { value: 'spirit_gin_bottle', label: 'Spirit - Gin Bottle' },
  ];

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Drink Image Uploader</h1>
      <p className="text-gray-500 mb-6">
        Upload and categorize drink images for the app. Each drink category should have 
        3-5 variations to ensure visual diversity.
      </p>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-10">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="upload">Upload Images</TabsTrigger>
          <TabsTrigger value="test">Test Images</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="mt-6">
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Upload New Image</CardTitle>
                <CardDescription>
                  Select a drink image and categorize it properly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="category">Drink Category</Label>
                    <Select 
                      value={category} 
                      onValueChange={(value) => setCategory(value as DrinkCategory)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="drinkName">Drink Name (Optional)</Label>
                    <Input
                      id="drinkName"
                      value={drinkName}
                      onChange={(e) => setDrinkName(e.target.value)}
                      placeholder="E.g., Heineken Pint, House Red Wine"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="variant">Variant Number (1-5)</Label>
                    <Select 
                      value={variant} 
                      onValueChange={setVariant}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select variant" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Variant 1</SelectItem>
                        <SelectItem value="2">Variant 2</SelectItem>
                        <SelectItem value="3">Variant 3</SelectItem>
                        <SelectItem value="4">Variant 4</SelectItem>
                        <SelectItem value="5">Variant 5</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Create multiple variants (3-5) for each category to ensure visual diversity
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="image">Select Image</Label>
                    <div className="mt-1 flex items-center">
                      <Input
                        ref={fileInputRef}
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Max file size: 10MB. Supported formats: JPG, PNG, WebP
                    </p>
                  </div>
                  
                  {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                      {error}
                    </div>
                  )}
                  
                  {uploadSuccess && (
                    <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm flex items-center">
                      <Check className="w-4 h-4 mr-2" />
                      Image uploaded successfully!
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isUploading || !selectedFile}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Upload Image
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  {preview ? 'Selected image preview' : 'No image selected'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                {preview ? (
                  <div className="relative w-full aspect-square overflow-hidden rounded-md">
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div 
                    className="flex items-center justify-center w-full aspect-square rounded-md bg-gray-100"
                    style={{ backgroundColor: getDrinkCategoryColor(category) }}
                  >
                    <p className="text-white text-center p-4 font-medium">
                      {category.replace(/_/g, ' ')}
                    </p>
                  </div>
                )}
                
                {uploadedImageId && (
                  <div className="mt-4 w-full">
                    <p className="text-sm text-gray-500 mb-2">Uploaded Image:</p>
                    <div className="w-full aspect-square relative overflow-hidden rounded-md">
                      <CloudflareImage 
                        imageId={uploadedImageId}
                        alt={drinkName || category}
                        className="w-full h-full object-cover"
                        drinkName={drinkName || category.replace(/_/g, ' ')}
                        fallbackColor={getDrinkCategoryColor(category)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="test" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Image Categories</CardTitle>
              <CardDescription>
                Preview how images in each category will appear in the app
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="testCategory">Select Category to Test</Label>
                  <Select 
                    value={testCategory} 
                    onValueChange={(value) => setTestCategory(value as DrinkCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">{testCategory.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                  <p className="text-sm text-gray-500">Base color: <span className="font-mono">{getDrinkCategoryColor(testCategory)}</span></p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 5 }).map((_, idx) => {
                    // Check if we have real uploaded images for this category
                    const categoryImages = getCategoryImages(testCategory);
                    const realImageId = categoryImages[idx];
                    
                    return (
                      <div key={idx} className="flex flex-col items-center">
                        <p className="text-sm font-medium mb-2">
                          {realImageId ? 'Uploaded Image' : 'Variant'} {idx + 1}
                        </p>
                        <div className="aspect-square w-full rounded-md overflow-hidden relative">
                          {realImageId ? (
                            <CloudflareImage 
                              imageId={realImageId}
                              alt={`${testCategory} variant ${idx + 1}`}
                              className="w-full h-full object-cover"
                              drinkName={testCategory.replace(/_/g, ' ')}
                              category={testCategory}
                              fallbackColor={getDrinkCategoryColor(testCategory)}
                            />
                          ) : (
                            <div 
                              className="flex items-center justify-center bg-gray-100 rounded-md w-full h-full"
                              style={{ backgroundColor: getDrinkCategoryColor(testCategory) }}
                            >
                              <p className="text-sm text-center p-4 text-white">
                                {testCategory.replace(/_/g, ' ')} (variant {idx + 1})
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}