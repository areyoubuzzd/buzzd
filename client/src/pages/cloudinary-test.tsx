import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export default function CloudinaryTestPage() {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [category, setCategory] = useState('beer');
  const [brand, setBrand] = useState('heineken');
  const [servingStyle, setServingStyle] = useState('bottle');
  const [restaurantId, setRestaurantId] = useState('001');
  const [cocktailName, setCocktailName] = useState('margarita');
  
  // Define the cloud name as a constant instead of using process.env
  const cloudName = 'dp2uoj3ts'; // Replace with your actual Cloudinary cloud name
  
  // Function to test cloudinary connection
  async function testConnection() {
    setLoading(true);
    try {
      const response = await apiRequest('GET', '/api/cloudinary/test');
      const data = await response.json();
      console.log('Connection test result:', data);
      setTestResults({ ...testResults, connection: data });
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestResults({ ...testResults, connection: { error: error.message } });
    } finally {
      setLoading(false);
    }
  }
  
  // Function to test background image
  async function testBackgroundImage() {
    setLoading(true);
    try {
      // Try multiple possible filenames within the category folder
      const possibleExtensions = ['png', 'jpg', 'jpeg'];
      const possibleFilenames = ['image', 'bg', 'background', category];
      
      let foundImage = false;
      let imageUrl = '';
      let testedUrls = [];
      
      for (const filename of possibleFilenames) {
        for (const ext of possibleExtensions) {
          // Build a URL to try
          imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/v1/home/backgrounds/${category}/${filename}.${ext}`;
          testedUrls.push(imageUrl);
          
          // Use fetch with HEAD request to check if image exists
          try {
            const response = await fetch(imageUrl, { method: 'HEAD' });
            if (response.ok) {
              foundImage = true;
              break;
            }
          } catch (e) {
            // Ignore fetch errors and continue trying
          }
        }
        if (foundImage) break;
      }
      
      if (foundImage) {
        setTestResults({ ...testResults, backgroundImage: { success: true, url: imageUrl, testedUrls } });
      } else {
        setTestResults({ ...testResults, backgroundImage: { success: false, testedUrls } });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error testing background image:', error);
      setTestResults({ ...testResults, backgroundImage: { error: error.message } });
      setLoading(false);
    }
  }
  
  // Function to test brand image
  async function testBrandImage() {
    setLoading(true);
    try {
      // Try multiple possible extensions
      const possibleExtensions = ['png', 'jpg', 'jpeg'];
      
      let foundImage = false;
      let imageUrl = '';
      let testedUrls = [];
      
      for (const ext of possibleExtensions) {
        // Build a URL to try
        imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/v1/home/brands/${category}/${brand}/${servingStyle}.${ext}`;
        testedUrls.push(imageUrl);
        
        // Use fetch with HEAD request to check if image exists
        try {
          const response = await fetch(imageUrl, { method: 'HEAD' });
          if (response.ok) {
            foundImage = true;
            break;
          }
        } catch (e) {
          // Ignore fetch errors and continue trying
        }
      }
      
      if (foundImage) {
        setTestResults({ ...testResults, brandImage: { success: true, url: imageUrl, testedUrls } });
      } else {
        setTestResults({ ...testResults, brandImage: { success: false, testedUrls } });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error testing brand image:', error);
      setTestResults({ ...testResults, brandImage: { error: error.message } });
      setLoading(false);
    }
  }
  
  // Function to test cocktail image
  async function testCocktailImage() {
    setLoading(true);
    try {
      // Try multiple possible extensions
      const possibleExtensions = ['png', 'jpg', 'jpeg'];
      
      let foundImage = false;
      let imageUrl = '';
      let testedUrls = [];
      
      for (const ext of possibleExtensions) {
        // Build a URL to try
        imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/v1/home/brands/cocktail/${cocktailName}/glass.${ext}`;
        testedUrls.push(imageUrl);
        
        // Use fetch with HEAD request to check if image exists
        try {
          const response = await fetch(imageUrl, { method: 'HEAD' });
          if (response.ok) {
            foundImage = true;
            break;
          }
        } catch (e) {
          // Ignore fetch errors and continue trying
        }
      }
      
      if (foundImage) {
        setTestResults({ ...testResults, cocktailImage: { success: true, url: imageUrl, testedUrls } });
      } else {
        setTestResults({ ...testResults, cocktailImage: { success: false, testedUrls } });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error testing cocktail image:', error);
      setTestResults({ ...testResults, cocktailImage: { error: error.message } });
      setLoading(false);
    }
  }
  
  // Function to test restaurant logo
  async function testRestaurantLogo() {
    setLoading(true);
    try {
      // Try multiple possible extensions
      const possibleExtensions = ['png', 'jpg', 'jpeg'];
      
      let foundImage = false;
      let imageUrl = '';
      let testedUrls = [];
      
      for (const ext of possibleExtensions) {
        // Build a URL to try
        imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/v1/home/restaurants/logos/${restaurantId}.${ext}`;
        testedUrls.push(imageUrl);
        
        // Use fetch with HEAD request to check if image exists
        try {
          const response = await fetch(imageUrl, { method: 'HEAD' });
          if (response.ok) {
            foundImage = true;
            break;
          }
        } catch (e) {
          // Ignore fetch errors and continue trying
        }
      }
      
      if (foundImage) {
        setTestResults({ ...testResults, restaurantLogo: { success: true, url: imageUrl, testedUrls } });
      } else {
        setTestResults({ ...testResults, restaurantLogo: { success: false, testedUrls } });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error testing restaurant logo:', error);
      setTestResults({ ...testResults, restaurantLogo: { error: error.message } });
      setLoading(false);
    }
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Cloudinary Integration Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Connection Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testConnection} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : 'Test Cloudinary Connection'}
            </Button>
            
            {testResults?.connection && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(testResults.connection, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Background Image Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beer">Beer</SelectItem>
                    <SelectItem value="red_wine">Red Wine</SelectItem>
                    <SelectItem value="white_wine">White Wine</SelectItem>
                    <SelectItem value="bubbly">Bubbly</SelectItem>
                    <SelectItem value="cocktail">Cocktail</SelectItem>
                    <SelectItem value="whisky">Whisky</SelectItem>
                    <SelectItem value="vodka">Vodka</SelectItem>
                    <SelectItem value="rum">Rum</SelectItem>
                    <SelectItem value="gin">Gin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={testBackgroundImage} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : 'Test Background Image'}
              </Button>
              
              {testResults?.backgroundImage && (
                <div className="mt-4">
                  <div className="p-4 bg-muted rounded-md mb-2">
                    <pre className="whitespace-pre-wrap text-xs">
                      {JSON.stringify(testResults.backgroundImage, null, 2)}
                    </pre>
                  </div>
                  
                  {testResults.backgroundImage.success && (
                    <div className="border rounded-md overflow-hidden">
                      <img 
                        src={testResults.backgroundImage.url} 
                        alt="Background Image" 
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Brand Image Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="brand-category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="brand-category">
                    <SelectValue placeholder="Select category" />
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
                <Label htmlFor="brand">Brand</Label>
                <Input 
                  id="brand" 
                  placeholder="e.g., heineken" 
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="serving-style">Serving Style</Label>
                <Select value={servingStyle} onValueChange={setServingStyle}>
                  <SelectTrigger id="serving-style">
                    <SelectValue placeholder="Select serving style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottle">Bottle</SelectItem>
                    <SelectItem value="glass">Glass</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={testBrandImage} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : 'Test Brand Image'}
              </Button>
              
              {testResults?.brandImage && (
                <div className="mt-4">
                  <div className="p-4 bg-muted rounded-md mb-2">
                    <pre className="whitespace-pre-wrap text-xs">
                      {JSON.stringify(testResults.brandImage, null, 2)}
                    </pre>
                  </div>
                  
                  {testResults.brandImage.success && (
                    <div className="border rounded-md overflow-hidden">
                      <img 
                        src={testResults.brandImage.url} 
                        alt="Brand Image" 
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Cocktail Image Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cocktail-name">Cocktail Name</Label>
                <Input 
                  id="cocktail-name" 
                  placeholder="e.g., margarita" 
                  value={cocktailName}
                  onChange={(e) => setCocktailName(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={testCocktailImage} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : 'Test Cocktail Image'}
              </Button>
              
              {testResults?.cocktailImage && (
                <div className="mt-4">
                  <div className="p-4 bg-muted rounded-md mb-2">
                    <pre className="whitespace-pre-wrap text-xs">
                      {JSON.stringify(testResults.cocktailImage, null, 2)}
                    </pre>
                  </div>
                  
                  {testResults.cocktailImage.success && (
                    <div className="border rounded-md overflow-hidden">
                      <img 
                        src={testResults.cocktailImage.url} 
                        alt="Cocktail Image" 
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Restaurant Logo Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="restaurant-id">Restaurant ID</Label>
                <Input 
                  id="restaurant-id" 
                  placeholder="e.g., 001" 
                  value={restaurantId}
                  onChange={(e) => setRestaurantId(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={testRestaurantLogo} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : 'Test Restaurant Logo'}
              </Button>
              
              {testResults?.restaurantLogo && (
                <div className="mt-4">
                  <div className="p-4 bg-muted rounded-md mb-2">
                    <pre className="whitespace-pre-wrap text-xs">
                      {JSON.stringify(testResults.restaurantLogo, null, 2)}
                    </pre>
                  </div>
                  
                  {testResults.restaurantLogo.success && (
                    <div className="border rounded-md overflow-hidden">
                      <img 
                        src={testResults.restaurantLogo.url} 
                        alt="Restaurant Logo" 
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}