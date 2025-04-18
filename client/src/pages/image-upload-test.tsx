import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

/**
 * Test page for image uploads to Cloudflare Images
 */
export default function ImageUploadTest() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadedImageIds, setUploadedImageIds] = useState<string[]>([]);
  
  // Input fields for image metadata
  const [drinkName, setDrinkName] = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!drinkName.trim()) {
      setError('Please enter a drink name');
      return;
    }
    
    if (!category.trim()) {
      setError('Please select a category');
      return;
    }
    
    setUploading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Generate a standardized category path and drink slug
      const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const drinkSlug = drinkName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      
      // Generate a custom ID format for categorization
      const timestamp = Date.now().toString(36);
      const customId = `${categorySlug}_${drinkSlug}_${timestamp}`;
      
      // Create FormData for the upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      formData.append('drinkName', drinkName);
      formData.append('customId', customId);
      formData.append('type', 'drink');
      
      // Upload the file through our backend
      const uploadResponse = await fetch('/api/cloudflare/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        let errorMessage = `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`;
        
        try {
          const responseData = await uploadResponse.json();
          errorMessage = responseData.error || responseData.details || errorMessage;
        } catch (jsonError) {
          const errorText = await uploadResponse.text();
          errorMessage = `${errorMessage}. ${errorText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await uploadResponse.json();
      const imageId = data.result?.id;
      
      if (!imageId) {
        throw new Error('No image ID returned from upload');
      }
      
      // Add to our list of uploaded images
      setUploadedImageIds(prev => [...prev, imageId]);
      setSuccess(`Image uploaded successfully! ID: ${imageId}`);
      
      // Clear form for next upload
      setFile(null);
      setDrinkName('');
      setCategory('');
      
      // Reset the file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-10 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Image Upload Test</CardTitle>
          <CardDescription>
            Upload drink images to Cloudflare Images with structured naming and metadata
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Drink Category</Label>
              <select 
                id="category"
                className="w-full p-2 border rounded"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Select a category</option>
                <option value="beer">Beer</option>
                <option value="wine_red">Red Wine</option>
                <option value="wine_white">White Wine</option>
                <option value="wine_rose">Rosé Wine</option>
                <option value="cocktail">Cocktail</option>
                <option value="whisky">Whisky</option>
                <option value="gin">Gin</option>
                <option value="vodka">Vodka</option>
                <option value="rum">Rum</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="drink-name">Drink Name</Label>
              <Input
                id="drink-name"
                placeholder="e.g., Heineken Pint, Glass of Red Wine"
                value={drinkName}
                onChange={(e) => setDrinkName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="file-upload">Image File</Label>
              <Input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
              />
              <p className="text-xs text-gray-500">
                Recommended: PNG or JPG, 800x600px, &lt;2MB
              </p>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded text-sm">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-3 bg-green-50 text-green-700 rounded text-sm">
                {success}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Image'}
            </Button>
          </form>
        </CardContent>
        
        {uploadedImageIds.length > 0 && (
          <>
            <Separator />
            <CardFooter className="flex flex-col">
              <h3 className="text-sm font-medium mb-2">Uploaded Images</h3>
              <ul className="text-xs space-y-1 w-full">
                {uploadedImageIds.map((id, index) => (
                  <li key={index} className="font-mono bg-gray-100 p-2 rounded overflow-hidden overflow-ellipsis">
                    {id}
                  </li>
                ))}
              </ul>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}