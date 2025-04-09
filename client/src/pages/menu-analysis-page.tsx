import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, AlertTriangle, X, Upload, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Establishment selection schema
const establishmentFormSchema = z.object({
  establishmentId: z.string().min(1, {
    message: "Please select an establishment"
  })
});

// Types for establishments, deals, and analysis results
type Establishment = {
  id: number;
  name: string;
  external_id?: string;
};

type Deal = {
  title: string;
  description?: string;
  dealPrice: number;
  regularPrice: number;
  type: string;
  drinkCategory?: string;
  drinkSubcategory?: string;
  brand?: string;
  servingStyle?: string;
  servingSize?: string;
  savingsPercentage: number;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  isOneForOne: boolean;
  isHousePour: boolean;
};

type AnalysisResult = {
  success: boolean;
  restaurantName: string | null;
  originalDeals: any[];
  formattedDeals: Deal[];
  filePath: string;
};

// Helper function to format time string from ISO
function formatTime(isoTime: string): string {
  if (!isoTime) return 'N/A';
  
  try {
    const date = new Date(isoTime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return 'Invalid time';
  }
}

// Helper function to format days of week
function formatDaysOfWeek(days: number[]): string {
  if (!days || days.length === 0) return 'N/A';
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Check if all days are included
  if (days.length === 7) return 'Every day';
  
  // Check if weekdays
  if (days.length === 5 && days.includes(1) && days.includes(2) && days.includes(3) && 
      days.includes(4) && days.includes(5) && !days.includes(0) && !days.includes(6)) {
    return 'Weekdays';
  }
  
  // Check if weekend
  if (days.length === 2 && days.includes(0) && days.includes(6)) {
    return 'Weekends';
  }
  
  // Otherwise list the days
  return days.map(d => dayNames[d]).join(', ');
}

// Component for previously uploaded menus
const UploadedMenus: React.FC<{
  onSelect: (filename: string) => void;
}> = ({ onSelect }) => {
  const [menus, setMenus] = useState<{ name: string, path: string, createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/menu-analysis/uploaded-menus');
        const data = await response.json();
        setMenus(data.menus || []);
      } catch (err) {
        setError('Failed to load uploaded menus');
        toast({
          title: 'Error',
          description: 'Failed to load uploaded menus',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, [toast]);

  const deleteMenu = async (e: React.MouseEvent, filename: string) => {
    e.stopPropagation();
    
    try {
      const response = await fetch(`/api/menu-analysis/delete-menu/${filename}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove the menu from the list
        setMenus(menus.filter(menu => menu.name !== filename));
        toast({
          title: 'Success',
          description: 'Menu deleted successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete menu',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete menu',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (menus.length === 0) {
    return <p className="text-center text-muted-foreground p-4">No menus uploaded yet</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {menus.map((menu) => (
        <Card 
          key={menu.name} 
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => onSelect(menu.name)}
        >
          <CardContent className="p-4 relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 text-destructive hover:text-destructive hover:bg-destructive/20"
              onClick={(e) => deleteMenu(e, menu.name)}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium truncate max-w-[200px]">{menu.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(menu.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Component for menu upload form
const MenuUploadForm: React.FC<{
  establishments: Establishment[];
  onAnalysisComplete: (result: AnalysisResult) => void;
  setSelectedEstablishmentId: (id: string) => void;
}> = ({ establishments, onAnalysisComplete, setSelectedEstablishmentId }) => {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof establishmentFormSchema>>({
    resolver: zodResolver(establishmentFormSchema),
    defaultValues: {
      establishmentId: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof establishmentFormSchema>) => {
    if (!file) {
      toast({
        title: 'Error',
        description: 'Please select a menu image to upload',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('menuImage', file);
      formData.append('establishmentId', values.establishmentId);

      const response = await fetch('/api/menu-analysis/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload and analyze menu');
      }

      const data = await response.json();
      
      // Pass the selected establishment ID with the result
      setSelectedEstablishmentId(values.establishmentId);
      onAnalysisComplete(data);
      
      toast({
        title: 'Success',
        description: `Menu analyzed successfully. Found ${data.formattedDeals.length} deals.`,
      });
    } catch (error) {
      console.error('Error uploading menu:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload and analyze menu',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="establishmentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Establishment</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an establishment" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {establishments.map((est) => (
                    <SelectItem key={est.id} value={est.id.toString()}>
                      {est.name} {est.external_id ? `(${est.external_id})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid w-full gap-1.5">
          <Label htmlFor="menuImage">Menu Image</Label>
          <Input 
            id="menuImage" 
            type="file" 
            accept="image/*,.pdf" 
            onChange={handleFileChange}
            disabled={uploading}
          />
          <p className="text-sm text-muted-foreground">
            Upload a menu image in JPG, PNG, WebP, or PDF format
          </p>
        </div>

        <Button type="submit" disabled={uploading} className="w-full">
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload & Analyze
            </>
          )}
        </Button>
      </form>
    </Form>
  );
};

// Component for deal analysis results
const AnalysisResults: React.FC<{
  result: AnalysisResult | null;
  establishmentId: string;
  onSaveDeals: () => void;
}> = ({ result, establishmentId, onSaveDeals }) => {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  if (!result) {
    return null;
  }

  const saveDeals = async () => {
    setSaving(true);

    try {
      const response = await apiRequest('POST', '/api/menu-analysis/save-deals', {
        deals: result.formattedDeals,
        establishmentId: parseInt(establishmentId, 10),
      });

      if (!response.ok) {
        throw new Error('Failed to save deals');
      }

      const data = await response.json();
      
      toast({
        title: 'Success',
        description: `Saved ${data.inserted.length} deals to the database`,
      });
      
      onSaveDeals();
    } catch (error) {
      console.error('Error saving deals:', error);
      toast({
        title: 'Error',
        description: 'Failed to save deals to the database',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Analysis Results</h3>
          {result.restaurantName && (
            <p className="text-sm text-muted-foreground">
              Restaurant identified as: <span className="font-medium">{result.restaurantName}</span>
            </p>
          )}
        </div>
        <Button onClick={saveDeals} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Save All Deals
            </>
          )}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Regular Price</TableHead>
            <TableHead>Deal Price</TableHead>
            <TableHead>Savings</TableHead>
            <TableHead>Days</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.formattedDeals.map((deal, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">
                {deal.title}
                {deal.brand && <span className="block text-xs text-muted-foreground">{deal.brand}</span>}
              </TableCell>
              <TableCell>
                {deal.type}
                {deal.drinkCategory && <span className="block text-xs text-muted-foreground">{deal.drinkCategory}</span>}
              </TableCell>
              <TableCell>${deal.regularPrice.toFixed(2)}</TableCell>
              <TableCell>${deal.dealPrice.toFixed(2)}</TableCell>
              <TableCell>{deal.savingsPercentage}%</TableCell>
              <TableCell>{formatDaysOfWeek(deal.daysOfWeek)}</TableCell>
              <TableCell>
                {formatTime(deal.startTime)} - {formatTime(deal.endTime)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const ReanalyzeMenuForm: React.FC<{
  filename: string;
  establishments: Establishment[];
  onAnalysisComplete: (result: AnalysisResult) => void;
  setSelectedEstablishmentId: (id: string) => void;
}> = ({ filename, establishments, onAnalysisComplete, setSelectedEstablishmentId }) => {
  const [reanalyzing, setReanalyzing] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof establishmentFormSchema>>({
    resolver: zodResolver(establishmentFormSchema),
    defaultValues: {
      establishmentId: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof establishmentFormSchema>) => {
    setReanalyzing(true);

    try {
      const response = await apiRequest('POST', `/api/menu-analysis/reanalyze/${filename}`, {
        establishmentId: values.establishmentId,
      });

      if (!response.ok) {
        throw new Error('Failed to re-analyze menu');
      }

      const data = await response.json();
      
      // Pass the selected establishment ID with the result
      setSelectedEstablishmentId(values.establishmentId);
      onAnalysisComplete(data);
      
      toast({
        title: 'Success',
        description: `Menu re-analyzed successfully. Found ${data.formattedDeals.length} deals.`,
      });
    } catch (error) {
      console.error('Error re-analyzing menu:', error);
      toast({
        title: 'Error',
        description: 'Failed to re-analyze menu',
        variant: 'destructive',
      });
    } finally {
      setReanalyzing(false);
    }
  };

  const isPdf = filename.toLowerCase().endsWith('.pdf');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="mb-4">
          {isPdf ? (
            <div className="border rounded-md p-4 bg-muted/20 flex flex-col items-center justify-center h-[400px]">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-center">
                PDF Document Preview Not Available
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => window.open(`/api/menu-analysis/view-menu/${filename}`, '_blank')}
              >
                Open PDF
              </Button>
            </div>
          ) : (
            <img 
              src={`/api/menu-analysis/view-menu/${filename}`} 
              alt="Menu" 
              className="max-h-[400px] object-contain mx-auto border rounded-md"
            />
          )}
          <p className="text-center text-sm text-muted-foreground mt-2">
            Selected menu: {filename}
          </p>
        </div>
        
        <FormField
          control={form.control}
          name="establishmentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Establishment</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an establishment" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {establishments.map((est) => (
                    <SelectItem key={est.id} value={est.id.toString()}>
                      {est.name} {est.external_id ? `(${est.external_id})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={reanalyzing} className="w-full">
          {reanalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Re-analyzing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Re-analyze Menu
            </>
          )}
        </Button>
      </form>
    </Form>
  );
};

// Main menu analysis page component
const MenuAnalysisPage = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loadingEstablishments, setLoadingEstablishments] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<string>('');
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEstablishments = async () => {
      try {
        setLoadingEstablishments(true);
        // Using a simple fetch since this is outside the usual query patterns
        const response = await fetch('/api/establishments');
        
        if (!response.ok) {
          throw new Error('Failed to fetch establishments');
        }
        
        const data = await response.json();
        setEstablishments(data);
      } catch (error) {
        console.error('Error fetching establishments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load establishments',
          variant: 'destructive',
        });
      } finally {
        setLoadingEstablishments(false);
      }
    };

    fetchEstablishments();
  }, [toast]);

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setAnalysisResult(result);
  };

  const handleSaveDeals = () => {
    setAnalysisResult(null);
    // Reset to upload tab
    setActiveTab('upload');
  };

  const handleSelectMenu = (filename: string) => {
    setSelectedMenu(filename);
    setActiveTab('reanalyze');
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Menu Analysis</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload New Menu</TabsTrigger>
          <TabsTrigger value="previous">Previous Uploads</TabsTrigger>
          <TabsTrigger value="reanalyze" disabled={!selectedMenu}>Re-analyze Menu</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Upload Menu</CardTitle>
              <CardDescription>
                Upload a menu image to extract happy hour deals using AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEstablishments ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <MenuUploadForm
                  establishments={establishments}
                  setSelectedEstablishmentId={setSelectedEstablishmentId}
                  onAnalysisComplete={(result) => {
                    handleAnalysisComplete(result);
                    // We'll get the establishmentId from the form submission
                  }}
                />
              )}
            </CardContent>
          </Card>
          
          {analysisResult && (
            <Card>
              <CardHeader>
                <CardTitle>Deal Analysis</CardTitle>
                <CardDescription>
                  Review and save the detected deals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnalysisResults
                  result={analysisResult}
                  establishmentId={selectedEstablishmentId}
                  onSaveDeals={handleSaveDeals}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="previous">
          <Card>
            <CardHeader>
              <CardTitle>Previous Uploads</CardTitle>
              <CardDescription>
                View and manage previously uploaded menu images
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadedMenus onSelect={handleSelectMenu} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reanalyze">
          {selectedMenu && (
            <Card>
              <CardHeader>
                <CardTitle>Re-analyze Menu</CardTitle>
                <CardDescription>
                  Analyze a previously uploaded menu with different settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingEstablishments ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <ReanalyzeMenuForm
                    filename={selectedMenu}
                    establishments={establishments}
                    setSelectedEstablishmentId={setSelectedEstablishmentId}
                    onAnalysisComplete={(result) => {
                      handleAnalysisComplete(result);
                      // Get the establishment ID from the submission data
                      setActiveTab('upload'); // Switch to upload tab to show results
                    }}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MenuAnalysisPage;