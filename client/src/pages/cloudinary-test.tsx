import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";

export default function CloudinaryTestPage() {
  const [testData, setTestData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTestData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/test-cloudinary');
      const data = await response.json();
      console.log("Test data:", data);
      setTestData(data);
    } catch (err) {
      console.error("Error fetching test data:", err);
      setError("Failed to fetch test data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestData();
  }, []);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Cloudinary Test</h1>
      
      <Button onClick={fetchTestData} disabled={loading} className="mb-8">
        {loading ? "Loading..." : "Refresh Test Data"}
      </Button>
      
      {error && (
        <div className="p-4 mb-4 bg-red-500 text-white rounded">
          {error}
        </div>
      )}
      
      <div className="space-y-8 mb-8">
        <h2 className="text-xl font-semibold mb-2">Demo Image Test</h2>
        <Card className="p-4 border-2 border-blue-500">
          <h3 className="font-bold mb-4 text-center text-blue-600 text-lg">WORKING DEMO IMAGES (PUBLIC CLOUDINARY)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-bold mb-2">Cloudinary Demo Image</h3>
              <div className="aspect-video mb-2 bg-gray-100 rounded overflow-hidden">
                <img 
                  src="https://res.cloudinary.com/demo/image/upload/sample" 
                  alt="Cloudinary sample image" 
                  className="w-full h-full object-cover"
                  onError={(e) => { 
                    e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22300%22%20height%3D%22200%22%20fill%3D%22%23FF0000%22%3E%3C%2Frect%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3EImage%20Load%20Failed%3C%2Ftext%3E%3C%2Fsvg%3E';
                  }}
                />
              </div>
              <div className="text-xs break-all">https://res.cloudinary.com/demo/image/upload/sample</div>
            </div>
            <div>
              <h3 className="font-bold mb-2">Sample Bottle Image</h3>
              <div className="h-40 flex items-center justify-center mb-2 bg-gray-100 rounded">
                <img 
                  src="https://res.cloudinary.com/demo/image/upload/bottle" 
                  alt="Sample bottle" 
                  className="max-h-full max-w-full"
                  onError={(e) => { 
                    e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%22%20height%3D%22200%22%20fill%3D%22%23FF0000%22%3E%3C%2Frect%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3EImage%20Load%20Failed%3C%2Ftext%3E%3C%2Fsvg%3E';
                  }}
                />
              </div>
              <div className="text-xs break-all">https://res.cloudinary.com/demo/image/upload/bottle</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-2 border-green-500">
          <h3 className="font-bold mb-4 text-center text-green-600 text-lg">DIRECT PNG HARDCODED URLS</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-bold mb-2">Beer Background (PNG)</h3>
              <div className="aspect-video mb-2 bg-gray-100 rounded overflow-hidden">
                <img 
                  src="https://res.cloudinary.com/dp2uoj3ts/image/upload/home/backgrounds/beer/image.png" 
                  alt="Beer background" 
                  className="w-full h-full object-cover"
                  onError={(e) => { 
                    e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22300%22%20height%3D%22200%22%20fill%3D%22%23FF0000%22%3E%3C%2Frect%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3EImage%20Load%20Failed%3C%2Ftext%3E%3C%2Fsvg%3E';
                  }}
                />
              </div>
              <div className="text-xs break-all">https://res.cloudinary.com/dp2uoj3ts/image/upload/backgrounds/beer/image.png</div>
            </div>
            <div>
              <h3 className="font-bold mb-2">Heineken Bottle (PNG)</h3>
              <div className="h-40 flex items-center justify-center mb-2 bg-gray-100 rounded">
                <img 
                  src="https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/beer/heineken/bottle.png" 
                  alt="Heineken bottle" 
                  className="max-h-full max-w-full"
                  onError={(e) => { 
                    e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%22%20height%3D%22200%22%20fill%3D%22%23FF0000%22%3E%3C%2Frect%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3EImage%20Load%20Failed%3C%2Ftext%3E%3C%2Fsvg%3E';
                  }}
                />
              </div>
              <div className="text-xs break-all">https://res.cloudinary.com/dp2uoj3ts/image/upload/brands/beer/heineken/bottle.png</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-2 border-purple-500">
          <h3 className="font-bold mb-4 text-center text-purple-600 text-lg">EXTENSION-LESS URLS (AUTO-FORMAT)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-bold mb-2">Beer Background (No Extension)</h3>
              <div className="aspect-video mb-2 bg-gray-100 rounded overflow-hidden">
                <img 
                  src="https://res.cloudinary.com/dp2uoj3ts/image/upload/f_auto/home/backgrounds/beer/image" 
                  alt="Beer background" 
                  className="w-full h-full object-cover"
                  onError={(e) => { 
                    e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22300%22%20height%3D%22200%22%20fill%3D%22%23FF0000%22%3E%3C%2Frect%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3EImage%20Load%20Failed%3C%2Ftext%3E%3C%2Fsvg%3E';
                  }}
                />
              </div>
              <div className="text-xs break-all">https://res.cloudinary.com/dp2uoj3ts/image/upload/f_auto/backgrounds/beer/image</div>
            </div>
            <div>
              <h3 className="font-bold mb-2">Heineken Bottle (No Extension)</h3>
              <div className="h-40 flex items-center justify-center mb-2 bg-gray-100 rounded">
                <img 
                  src="https://res.cloudinary.com/dp2uoj3ts/image/upload/f_auto/home/brands/beer/heineken/bottle" 
                  alt="Heineken bottle" 
                  className="max-h-full max-w-full"
                  onError={(e) => { 
                    e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%22%20height%3D%22200%22%20fill%3D%22%23FF0000%22%3E%3C%2Frect%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3EImage%20Load%20Failed%3C%2Ftext%3E%3C%2Fsvg%3E';
                  }}
                />
              </div>
              <div className="text-xs break-all">https://res.cloudinary.com/dp2uoj3ts/image/upload/f_auto/brands/beer/heineken/bottle</div>
            </div>
          </div>
        </Card>
        <Separator />
      </div>
      
      {testData && (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
            <Card className="p-4">
              <p>
                Cloudinary Connection: {testData.connectionOk ? "✅ Connected" : "❌ Failed"}
              </p>
              <p>Cloud Name: {testData.cloudName || "Not found"}</p>
            </Card>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-2">Background Image Tests</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testData.hardcodedUrls?.backgrounds && (
                Object.entries(testData.hardcodedUrls.backgrounds)
                  .filter(([key]) => key !== 'wine') // Skip wine object because it's nested
                  .map(([category, url]: [string, any]) => (
                    <Card key={category} className="p-4">
                      <h3 className="font-bold mb-2 capitalize">{category}</h3>
                      <div className="aspect-video mb-2 bg-gray-100 rounded overflow-hidden">
                        <img 
                          src={url} 
                          alt={`${category} background`} 
                          className="w-full h-full object-cover"
                          onError={(e) => { 
                            e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22300%22%20height%3D%22200%22%20fill%3D%22%23FF0000%22%3E%3C%2Frect%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3EImage%20Load%20Failed%3C%2Ftext%3E%3C%2Fsvg%3E';
                          }}
                        />
                      </div>
                      <div className="text-xs break-all">{url}</div>
                    </Card>
                  ))
              )}
              
              {/* Add wine separately since it's nested */}
              {testData.hardcodedUrls?.backgrounds?.wine && (
                <Card className="p-4">
                  <h3 className="font-bold mb-2 capitalize">Wine (Red)</h3>
                  <div className="aspect-video mb-2 bg-gray-100 rounded overflow-hidden">
                    <img 
                      src={testData.hardcodedUrls.backgrounds.wine.red} 
                      alt="wine background" 
                      className="w-full h-full object-cover"
                      onError={(e) => { 
                        e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22300%22%20height%3D%22200%22%20fill%3D%22%23FF0000%22%3E%3C%2Frect%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3EImage%20Load%20Failed%3C%2Ftext%3E%3C%2Fsvg%3E';
                      }}
                    />
                  </div>
                  <div className="text-xs break-all">{testData.hardcodedUrls.backgrounds.wine.red}</div>
                </Card>
              )}
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-2">Brand Image Tests</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Beer - Heineken */}
              {testData.hardcodedUrls?.brands?.beer?.heineken && (
                <>
                  <Card className="p-4">
                    <h3 className="font-bold mb-2">Heineken (Bottle)</h3>
                    <div className="h-40 flex items-center justify-center mb-2 bg-gray-100 rounded">
                      <img 
                        src={testData.hardcodedUrls.brands.beer.heineken.bottle}
                        alt="Heineken bottle"
                        className="max-h-full max-w-full"
                        onError={(e) => { 
                          e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%22%20height%3D%22200%22%20fill%3D%22%23FF0000%22%3E%3C%2Frect%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3EImage%20Load%20Failed%3C%2Ftext%3E%3C%2Fsvg%3E';
                        }}
                      />
                    </div>
                    <div className="text-xs break-all">{testData.hardcodedUrls.brands.beer.heineken.bottle}</div>
                  </Card>
                  
                  <Card className="p-4">
                    <h3 className="font-bold mb-2">Heineken (Glass)</h3>
                    <div className="h-40 flex items-center justify-center mb-2 bg-gray-100 rounded">
                      <img 
                        src={testData.hardcodedUrls.brands.beer.heineken.glass}
                        alt="Heineken glass"
                        className="max-h-full max-w-full"
                        onError={(e) => { 
                          e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%22%20height%3D%22200%22%20fill%3D%22%23FF0000%22%3E%3C%2Frect%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3EImage%20Load%20Failed%3C%2Ftext%3E%3C%2Fsvg%3E';
                        }}
                      />
                    </div>
                    <div className="text-xs break-all">{testData.hardcodedUrls.brands.beer.heineken.glass}</div>
                  </Card>
                </>
              )}
              
              {/* Cocktails - Margarita */}
              {testData.hardcodedUrls?.brands?.cocktail?.margarita && (
                <Card className="p-4">
                  <h3 className="font-bold mb-2">Margarita (Glass)</h3>
                  <div className="h-40 flex items-center justify-center mb-2 bg-gray-100 rounded">
                    <img 
                      src={testData.hardcodedUrls.brands.cocktail.margarita.glass}
                      alt="Margarita glass"
                      className="max-h-full max-w-full"
                      onError={(e) => { 
                        e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%22%20height%3D%22200%22%20fill%3D%22%23FF0000%22%3E%3C%2Frect%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3EImage%20Load%20Failed%3C%2Ftext%3E%3C%2Fsvg%3E';
                      }}
                    />
                  </div>
                  <div className="text-xs break-all">{testData.hardcodedUrls.brands.cocktail.margarita.glass}</div>
                </Card>
              )}
            </div>
          </div>
          
          {testData.sdkUrls && (
            <div>
              <h2 className="text-xl font-semibold mb-2">SDK Generated URLs</h2>
              <Card className="p-4">
                <pre className="text-xs whitespace-pre-wrap break-all">
                  {JSON.stringify(testData.sdkUrls, null, 2)}
                </pre>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}