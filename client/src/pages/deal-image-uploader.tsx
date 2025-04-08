import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

// Map of drink categories to handle uploading to the right folder
const DRINK_CATEGORIES = [
  'beer',
  'wine',
  'cocktail',
  'whisky',
  'vodka',
  'gin',
  'rum'
];

const BRANDS = {
  beer: ['heineken', 'stella', 'tiger', 'carlsberg', 'corona'],
  wine: ['red', 'white', 'rose'],
  cocktail: ['margarita', 'mojito', 'martini', 'old_fashioned', 'cosmopolitan'],
  whisky: ['johnnie_walker', 'jack_daniels', 'glenfiddich', 'macallan'],
  vodka: ['grey_goose', 'absolut', 'smirnoff'],
  gin: ['bombay_sapphire', 'hendricks', 'tanqueray', 'roku'],
  rum: ['bacardi', 'captain_morgan']
};

export default function DealImageUploader() {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('beer');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedServingStyle, setSelectedServingStyle] = useState<'bottle' | 'glass'>('glass');
  const [uploadType, setUploadType] = useState<'background' | 'hero'>('background');
  
  const backgroundFileRef = useRef<HTMLInputElement>(null);
  const heroFileRef = useRef<HTMLInputElement>(null);
  
  // Filter brands based on selected category
  const brandsForCategory = BRANDS[selectedCategory as keyof typeof BRANDS] || [];
  
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const fileInput = uploadType === 'background' ? backgroundFileRef.current : heroFileRef.current;
    
    if (!fileInput?.files?.length) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }
    
    const file = fileInput.files[0];
    
    // Create FormData to send the file
    const formData = new FormData();
    formData.append('file', file);
    
    // Add metadata about where to store the file
    formData.append('type', uploadType);
    formData.append('category', selectedCategory);
    
    if (uploadType === 'hero') {
      if (!selectedBrand) {
        toast({
          title: 'Brand required',
          description: 'Please select a brand for hero images',
          variant: 'destructive',
        });
        return;
      }
      
      formData.append('brand', selectedBrand);
      formData.append('servingStyle', selectedServingStyle);
    }
    
    // Start upload
    setUploading(true);
    
    try {
      const response = await fetch('/api/upload-deal-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to upload image');
      }
      
      const data = await response.json();
      
      toast({
        title: 'Upload successful',
        description: `Image uploaded to Cloudinary: ${data.public_id}`,
      });
      
      // Reset file input
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Deal Card Image Uploader</h1>
      <p className="mb-4 text-gray-600">
        Upload background images and hero (drink) images for the deal cards.
      </p>
      
      <Tabs defaultValue="background" onValueChange={(v) => setUploadType(v as 'background' | 'hero')}>
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="background">Background Images</TabsTrigger>
          <TabsTrigger value="hero">Drink Hero Images</TabsTrigger>
        </TabsList>
        
        <TabsContent value="background">
          <Card>
            <CardHeader>
              <CardTitle>Upload Background Image</CardTitle>
              <CardDescription>
                Background images should be 800×400px and show a colored pattern that matches the drink category.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Drink Category</Label>
                  <Select 
                    value={selectedCategory} 
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {DRINK_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="background-file">Background Image</Label>
                  <Input 
                    id="background-file" 
                    type="file" 
                    ref={backgroundFileRef}
                    accept="image/*"
                  />
                  <p className="text-xs text-gray-500">
                    This image will be stored in Cloudinary at: home/backgrounds/{selectedCategory}
                  </p>
                </div>
                
                <Button type="submit" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload Background'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>Upload Drink Hero Image</CardTitle>
              <CardDescription>
                Hero images should have transparent backgrounds and show the drink clearly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Drink Category</Label>
                  <Select 
                    value={selectedCategory} 
                    onValueChange={(value) => {
                      setSelectedCategory(value);
                      setSelectedBrand(''); // Reset brand when category changes
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {DRINK_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand / Type</Label>
                  <Select 
                    value={selectedBrand} 
                    onValueChange={setSelectedBrand}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand/type" />
                    </SelectTrigger>
                    <SelectContent>
                      {brandsForCategory.map(brand => (
                        <SelectItem key={brand} value={brand}>
                          {brand.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="serving-style">Serving Style</Label>
                  <Select 
                    value={selectedServingStyle} 
                    onValueChange={(value) => setSelectedServingStyle(value as 'bottle' | 'glass')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select serving style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="glass">Glass</SelectItem>
                      <SelectItem value="bottle">Bottle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hero-file">Hero Image</Label>
                  <Input 
                    id="hero-file" 
                    type="file" 
                    ref={heroFileRef}
                    accept="image/*"
                  />
                  <p className="text-xs text-gray-500">
                    This image will be stored in Cloudinary at: home/brands/{selectedCategory}/{selectedBrand || '[brand]'}/{selectedServingStyle}
                  </p>
                </div>
                
                <Button type="submit" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload Hero Image'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}