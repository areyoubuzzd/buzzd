import { useState } from "react";
import { ModernDealsGrid } from "@/components/deals/modern-deals-grid";
import { ModernDealCardProps } from "@/components/deals/modern-deal-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function ModernDealsPage() {
  const { toast } = useToast();
  const [category, setCategory] = useState<string>('beer');
  
  // Sample deals data for demonstration
  const sampleDeals: ModernDealCardProps[] = [
    {
      id: 1,
      dealType: "HALF PRICE LAGER",
      discount: 50,
      category: "beer",
      brand: "Heineken",
      servingStyle: "bottle",
      endTime: "6:00 PM",
      distance: 0.5
    },
    {
      id: 2,
      dealType: "2 FOR 1 WINE",
      discount: 50,
      category: "wine",
      subcategory: "red_wine",
      servingStyle: "glass",
      endTime: "7:00 PM",
      distance: 1.2
    },
    {
      id: 3,
      dealType: "$8 MARGARITA",
      discount: 30,
      category: "cocktail",
      subcategory: "margarita",
      servingStyle: "glass",
      endTime: "9:00 PM",
      distance: 0.8
    },
    {
      id: 4,
      dealType: "$10 WHISKY",
      discount: 40,
      category: "whisky",
      brand: "Glenfiddich",
      servingStyle: "glass",
      endTime: "11:00 PM",
      distance: 1.5
    },
    {
      id: 5,
      dealType: "PREMIUM GIN",
      discount: 30,
      category: "gin",
      brand: "Hendricks",
      servingStyle: "glass",
      endTime: "6:00 PM",
      distance: 2.1
    },
    {
      id: 6,
      dealType: "CRAFT BEER",
      discount: 25,
      category: "beer",
      subcategory: "craft",
      servingStyle: "glass",
      endTime: "4:00 PM",
      distance: 1.8
    }
  ];
  
  // Filter deals by category
  const filteredDeals = category === 'all' 
    ? sampleDeals 
    : sampleDeals.filter(deal => deal.category.toLowerCase() === category.toLowerCase());
  
  // Handle deal click
  const handleDealClick = (dealId: number) => {
    toast({
      title: "Deal Selected",
      description: `You clicked on deal #${dealId}. View details feature coming soon!`,
    });
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">Happy Hour Deals</h1>
      <p className="text-gray-500 mb-6">Discover the best drink specials near you</p>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="category-filter">Filter by Category</Label>
                <Select 
                  value={category} 
                  onValueChange={setCategory}
                >
                  <SelectTrigger id="category-filter">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="beer">Beer</SelectItem>
                    <SelectItem value="red_wine">Red Wine</SelectItem>
                    <SelectItem value="white_wine">White Wine</SelectItem>
                    <SelectItem value="cocktail">Cocktails</SelectItem>
                    <SelectItem value="whisky">Whisky</SelectItem>
                    <SelectItem value="gin">Gin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="location">Your Location</Label>
                <Input id="location" placeholder="Enter postal code" />
              </div>
              
              <Button className="w-full">Find Deals</Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="md:col-span-3">
          <ModernDealsGrid 
            deals={filteredDeals} 
            onDealClick={handleDealClick}
          />
        </div>
      </div>
    </div>
  );
}