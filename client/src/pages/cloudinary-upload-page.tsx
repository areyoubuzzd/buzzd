import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, UploadCloud, RefreshCw } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function CloudinaryUploadPage() {
  const [selectedTab, setSelectedTab] = useState('background');
  const [isUploading, setIsUploading] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [folderStructure, setFolderStructure] = useState<any>(null);
  const [isFetchingStructure, setIsFetchingStructure] = useState(false);
  
  // Form values
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('beer');
  const [brandName, setBrandName] = useState('');
  const [servingStyle, setServingStyle] = useState('bottle');
  const [cocktailName, setCocktailName] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [defaultType, setDefaultType] = useState('background');
  const [defaultCategory, setDefaultCategory] = useState('beer');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Test connection to Cloudinary
  const testConnection = async () => {
    setTestStatus('testing');
    try {
      const response = await fetch('/api/cloudinary/test');
      const data = await response.json();
      
      if (data.success) {
        setTestStatus('success');
        toast({
          title: "Connection successful",
          description: "Successfully connected to Cloudinary",
          variant: "default",
        });
      } else {
        setTestStatus('error');
        toast({
          title: "Connection failed",
          description: "Failed to connect to Cloudinary. Check your credentials.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setTestStatus('error');
      toast({
        title: "Connection failed",
        description: "An error occurred while testing the connection",
        variant: "destructive",
      });
    }
  };
  
  // Get folder structure information
  const getFolderStructure = async () => {
    setIsFetchingStructure(true);
    try {
      const response = await fetch('/api/cloudinary/structure');
      const data = await response.json();
      setFolderStructure(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch folder structure",
        variant: "destructive",
      });
    } finally {
      setIsFetchingStructure(false);
    }
  };
  
  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };
  
  // Handle form submit based on selected tab
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an image file to upload",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    setUploadedImage(null);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      let endpoint = '';
      
      switch (selectedTab) {
        case 'background':
          endpoint = '/api/cloudinary/background';
          formData.append('category', category);
          break;
        case 'brand':
          endpoint = '/api/cloudinary/brand';
          formData.append('category', category);
          formData.append('brandName', brandName);
          formData.append('servingStyle', servingStyle);
          break;
        case 'cocktail':
          endpoint = '/api/cloudinary/cocktail';
          formData.append('cocktailName', cocktailName);
          break;
        case 'restaurant':
          endpoint = '/api/cloudinary/restaurant';
          formData.append('restaurantId', restaurantId);
          break;
        case 'default':
          endpoint = '/api/cloudinary/default';
          formData.append('type', defaultType);
          if (defaultType !== 'logo') {
            formData.append('category', defaultCategory);
          }
          break;
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Upload successful",
          description: "Image was successfully uploaded to Cloudinary",
          variant: "default",
        });
        
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        setFile(null);
        setUploadedImage(result.secure_url);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred during upload",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">Cloudinary Image Upload Tool</h1>
      <p className="text-gray-500 mb-6">
        Upload and manage images for the Happy Hour Deals app
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Upload Images</CardTitle>
              <CardDescription>Upload images to the correct Cloudinary folder structure</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="grid grid-cols-3 md:grid-cols-5 mb-4">
                  <TabsTrigger value="background">Background</TabsTrigger>
                  <TabsTrigger value="brand">Brand</TabsTrigger>
                  <TabsTrigger value="cocktail">Cocktail</TabsTrigger>
                  <TabsTrigger value="restaurant">Restaurant</TabsTrigger>
                  <TabsTrigger value="default">Default</TabsTrigger>
                </TabsList>
                
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    {/* Common file input for all tabs */}
                    <div>
                      <Label htmlFor="image">Image File</Label>
                      <Input 
                        id="image" 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="mt-1"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Accepted formats: JPG, JPEG, PNG, GIF. Max size: 5MB
                      </p>
                    </div>
                    
                    <Separator />
                    
                    {/* Background tab content */}
                    <TabsContent value="background" className="space-y-4">
                      <div>
                        <Label htmlFor="bg-category">Alcohol Category</Label>
                        <Select 
                          value={category} 
                          onValueChange={setCategory}
                        >
                          <SelectTrigger id="bg-category" className="mt-1">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beer">Beer</SelectItem>
                            <SelectItem value="red_wine">Red Wine</SelectItem>
                            <SelectItem value="white_wine">White Wine</SelectItem>
                            <SelectItem value="bubbly">Bubbly</SelectItem>
                            <SelectItem value="whisky">Whisky</SelectItem>
                            <SelectItem value="cocktail">Cocktail</SelectItem>
                            <SelectItem value="vodka">Vodka</SelectItem>
                            <SelectItem value="rum">Rum</SelectItem>
                            <SelectItem value="gin">Gin</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">
                          This will upload to: home/backgrounds/{category}/image.png
                        </p>
                      </div>
                    </TabsContent>
                    
                    {/* Brand tab content */}
                    <TabsContent value="brand" className="space-y-4">
                      <div>
                        <Label htmlFor="brand-category">Alcohol Category</Label>
                        <Select 
                          value={category} 
                          onValueChange={setCategory}
                        >
                          <SelectTrigger id="brand-category" className="mt-1">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beer">Beer</SelectItem>
                            <SelectItem value="red_wine">Red Wine</SelectItem>
                            <SelectItem value="white_wine">White Wine</SelectItem>
                            <SelectItem value="bubbly">Bubbly</SelectItem>
                            <SelectItem value="whisky">Whisky</SelectItem>
                            <SelectItem value="vodka">Vodka</SelectItem>
                            <SelectItem value="rum">Rum</SelectItem>
                            <SelectItem value="gin">Gin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="brand-name">Brand Name</Label>
                        <Input 
                          id="brand-name" 
                          value={brandName} 
                          onChange={(e) => setBrandName(e.target.value)}
                          placeholder="e.g., Heineken, Johnnie Walker"
                          className="mt-1"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="serving-style">Serving Style</Label>
                        <Select 
                          value={servingStyle} 
                          onValueChange={setServingStyle}
                        >
                          <SelectTrigger id="serving-style" className="mt-1">
                            <SelectValue placeholder="Select a serving style" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bottle">Bottle</SelectItem>
                            <SelectItem value="glass">Glass</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <p className="text-xs text-gray-500">
                        This will upload to: home/brands/{category}/{brandName}/{servingStyle}.png
                      </p>
                    </TabsContent>
                    
                    {/* Cocktail tab content */}
                    <TabsContent value="cocktail" className="space-y-4">
                      <div>
                        <Label htmlFor="cocktail-name">Cocktail Name</Label>
                        <Input 
                          id="cocktail-name" 
                          value={cocktailName} 
                          onChange={(e) => setCocktailName(e.target.value)}
                          placeholder="e.g., Margarita, Mojito"
                          className="mt-1"
                          required
                        />
                      </div>
                      
                      <p className="text-xs text-gray-500">
                        This will upload to: home/brands/cocktail/{cocktailName}/glass.png
                      </p>
                    </TabsContent>
                    
                    {/* Restaurant tab content */}
                    <TabsContent value="restaurant" className="space-y-4">
                      <div>
                        <Label htmlFor="restaurant-id">Restaurant ID</Label>
                        <Input 
                          id="restaurant-id" 
                          value={restaurantId} 
                          onChange={(e) => setRestaurantId(e.target.value)}
                          placeholder="e.g., restaurant123"
                          className="mt-1"
                          required
                        />
                      </div>
                      
                      <p className="text-xs text-gray-500">
                        This will upload to: home/restaurants/logos/{restaurantId}.png
                      </p>
                    </TabsContent>
                    
                    {/* Default tab content */}
                    <TabsContent value="default" className="space-y-4">
                      <div>
                        <Label htmlFor="default-type">Default Type</Label>
                        <Select 
                          value={defaultType} 
                          onValueChange={setDefaultType}
                        >
                          <SelectTrigger id="default-type" className="mt-1">
                            <SelectValue placeholder="Select a default type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="background">Background</SelectItem>
                            <SelectItem value="bottle">Bottle</SelectItem>
                            <SelectItem value="glass">Glass</SelectItem>
                            <SelectItem value="logo">Restaurant Logo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {(defaultType === 'bottle' || defaultType === 'glass') && (
                        <div>
                          <Label htmlFor="default-category">Category</Label>
                          <Select 
                            value={defaultCategory} 
                            onValueChange={setDefaultCategory}
                          >
                            <SelectTrigger id="default-category" className="mt-1">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beer">Beer</SelectItem>
                              <SelectItem value="red_wine">Red Wine</SelectItem>
                              <SelectItem value="white_wine">White Wine</SelectItem>
                              <SelectItem value="bubbly">Bubbly</SelectItem>
                              <SelectItem value="whisky">Whisky</SelectItem>
                              <SelectItem value="cocktail">Cocktail</SelectItem>
                              <SelectItem value="vodka">Vodka</SelectItem>
                              <SelectItem value="rum">Rum</SelectItem>
                              <SelectItem value="gin">Gin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500">
                        {defaultType === 'background' && 'This will upload to: home/backgrounds/default/image.png'}
                        {(defaultType === 'bottle' || defaultType === 'glass') && `This will upload to: home/brands/${defaultCategory}/${defaultType}/default.png`}
                        {defaultType === 'logo' && 'This will upload to: home/restaurants/logos/default.png'}
                      </p>
                    </TabsContent>
                  </div>
                  
                  <div className="mt-6">
                    <Button type="submit" disabled={isUploading}>
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
                  </div>
                </form>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Preview uploaded image */}
          {uploadedImage && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Uploaded Image</CardTitle>
                <CardDescription>Your image was successfully uploaded</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md p-2 bg-gray-50 flex items-center justify-center">
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded" 
                    className="max-h-60 max-w-full object-contain" 
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 break-all">
                  {uploadedImage}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div>
          {/* Connection status card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Cloudinary Connection</CardTitle>
              <CardDescription>Test your connection to Cloudinary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-4">
                {testStatus === 'idle' && (
                  <Badge variant="outline" className="flex items-center">
                    Not tested
                  </Badge>
                )}
                {testStatus === 'testing' && (
                  <Badge variant="outline" className="flex items-center">
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Testing...
                  </Badge>
                )}
                {testStatus === 'success' && (
                  <Badge variant="success" className="flex items-center bg-green-100 text-green-800 hover:bg-green-100">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Connected
                  </Badge>
                )}
                {testStatus === 'error' && (
                  <Badge variant="destructive" className="flex items-center">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Connection Failed
                  </Badge>
                )}
              </div>
              <Button onClick={testConnection} variant="outline" size="sm" disabled={testStatus === 'testing'}>
                {testStatus === 'testing' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Test Connection
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          
          {/* Folder structure card */}
          <Card>
            <CardHeader>
              <CardTitle>Folder Structure</CardTitle>
              <CardDescription>View the folder structure for uploads</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={getFolderStructure} 
                variant="outline" 
                size="sm" 
                disabled={isFetchingStructure}
                className="mb-4"
              >
                {isFetchingStructure ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Show Folder Structure'
                )}
              </Button>
              
              {folderStructure && (
                <div className="space-y-4 text-sm">
                  {Object.entries(folderStructure).map(([key, info]: [string, any]) => (
                    <div key={key} className="space-y-2">
                      <h3 className="font-semibold uppercase">{key}</h3>
                      <p className="text-gray-600">{info.description}</p>
                      <div className="bg-gray-50 p-2 rounded border">
                        <p className="font-mono text-xs">{info.path}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium">Examples:</p>
                        {info.examples.map((example: string, index: number) => (
                          <p key={index} className="font-mono text-xs text-gray-600">
                            {example}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}