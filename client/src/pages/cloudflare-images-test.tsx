import React, { useState, useEffect } from 'react';
import { CloudflareImage, CloudflareImageUploader } from '@/components/CloudflareImage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

export default function CloudflareImagesTestPage() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [connectionDetails, setConnectionDetails] = useState<any>(null);
  const [imageId, setImageId] = useState<string>('');
  const [uploadComplete, setUploadComplete] = useState(false);
  const [category, setCategory] = useState('beer');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Check Cloudflare Images connection on component mount
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/test-cloudflare');
        const data = await response.json();
        setConnectionDetails(data);
        
        if (data.connection && data.connection.success) {
          setConnectionStatus('connected');
          toast({
            title: 'Cloudflare Images Connected',
            description: 'Successfully connected to Cloudflare Images API',
          });
        } else {
          setConnectionStatus('error');
          toast({
            title: 'Connection Failed',
            description: data.connection?.message || 'Could not connect to Cloudflare Images',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error checking Cloudflare connection:', error);
        setConnectionStatus('error');
        toast({
          title: 'Connection Error',
          description: 'Failed to check Cloudflare Images connection status',
          variant: 'destructive',
        });
      }
    };
    
    checkConnection();
  }, []);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      // Request a direct upload URL from our backend
      const response = await fetch('/api/cloudflare/direct-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'drink',
          category: category || 'beer',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get upload URL: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const { uploadURL, id } = await response.json();
      console.log('Got upload URL:', uploadURL);
      console.log('Image ID:', id);

      // Create a FormData object to upload the file
      const formData = new FormData();
      formData.append('file', file);

      // Upload directly to Cloudflare using the provided URL
      // This is where the 403 is happening - we'll use a browser alert to show more info
      try {
        const uploadResponse = await fetch(uploadURL, {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          const responseText = await uploadResponse.text();
          console.error('Upload response error:', responseText);
          throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }

        const uploadResult = await uploadResponse.json();
        console.log('Upload result:', uploadResult);

        // Call the handle upload complete function
        handleUploadComplete(id);
      } catch (uploadError) {
        console.error('Error during upload to Cloudflare:', uploadError);
        setError(`Error uploading to Cloudflare: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`);
      }
    } catch (err) {
      console.error('Error in upload process:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleUploadComplete = (newImageId: string) => {
    setImageId(newImageId);
    setUploadComplete(true);
    toast({
      title: 'Upload Successful',
      description: `Image uploaded with ID: ${newImageId}`,
    });
  };
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Cloudflare Images Integration Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div 
              className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
              }`} 
            />
            <span>
              {connectionStatus === 'connected' ? 'Connected to Cloudflare Images API' : 
               connectionStatus === 'error' ? 'Failed to connect to Cloudflare Images API' : 'Checking connection...'}
            </span>
          </div>
          
          {connectionDetails && (
            <div className="mt-4 p-4 bg-slate-100 rounded-md">
              <h3 className="font-medium mb-2">Configuration:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(connectionDetails, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Tabs defaultValue="upload">
        <TabsList className="mb-4">
          <TabsTrigger value="upload">Upload Image</TabsTrigger>
          <TabsTrigger value="display">Display Image</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload an Image to Cloudflare Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category">Drink Category</Label>
                  <select 
                    id="category"
                    className="w-full p-2 border rounded-md"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="beer">Beer</option>
                    <option value="wine">Wine</option>
                    <option value="cocktail">Cocktail</option>
                    <option value="spirits">Spirits</option>
                    <option value="whisky">Whisky</option>
                    <option value="gin">Gin</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="block">
                    <span className="sr-only">Choose image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100
                        disabled:opacity-50 disabled:cursor-not-allowed"
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                  </label>
                  
                  {isUploading && (
                    <div className="text-sm text-blue-600 animate-pulse">
                      Uploading image...
                    </div>
                  )}
                  
                  {error && (
                    <div className="text-sm text-red-600">
                      {error}
                    </div>
                  )}
                </div>
                
                {uploadComplete && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-800 font-medium">Upload successful!</p>
                    <p className="text-sm">Image ID: {imageId}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="display">
          <Card>
            <CardHeader>
              <CardTitle>Display an Image from Cloudflare Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="imageId">Image ID</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="imageId"
                        value={imageId}
                        onChange={(e) => setImageId(e.target.value)}
                        placeholder="Enter Cloudflare Image ID"
                      />
                      <Button variant="outline" onClick={() => setImageId('')}>Clear</Button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Preview:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Public variant */}
                    <div className="border p-4 rounded-md">
                      <h4 className="font-medium mb-2">Public Variant</h4>
                      <div className="aspect-video bg-slate-100 rounded-md overflow-hidden">
                        <CloudflareImage 
                          imageId={imageId} 
                          alt="Test image (public variant)" 
                          variant="public"
                          width={400}
                          height={225}
                          category={category}
                        />
                      </div>
                    </div>
                    
                    {/* Thumbnail variant */}
                    <div className="border p-4 rounded-md">
                      <h4 className="font-medium mb-2">Thumbnail Variant</h4>
                      <div className="aspect-square w-24 h-24 bg-slate-100 rounded-md overflow-hidden mx-auto">
                        <CloudflareImage 
                          imageId={imageId} 
                          alt="Test image (thumbnail variant)" 
                          variant="thumbnail"
                          width={96}
                          height={96}
                          category={category}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}