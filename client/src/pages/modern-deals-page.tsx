import { useState } from "react";
import { ModernDealsGrid } from "@/components/deals/modern-deals-grid";
import { DealCardProps } from "@/components/deals/modern-deal-card";
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
  const sampleDeals: DealCardProps[] = [
    {
      id: 1,
      name: "Half-Price Premium Lager",
      description: "Enjoy our finest imported lager at half the regular price during weekday happy hours.",
      originalPrice: 80,
      dealPrice: 40,
      dayOfWeek: "Weekdays",
      timeStart: "16:00",
      timeEnd: "18:00",
      category: "beer",
      brand: "Heineken",
      servingStyle: "bottle",
      isPremiumDeal: true,
      establishment: {
        name: "The Beer House",
        address: "123 Main St, Cape Town",
        distance: 0.5,
        logoUrl: "/images/restaurants/beer-house-logo.png"
      }
    },
    {
      id: 2,
      name: "Two-for-One House Wine",
      description: "Buy one glass of our house selection and get another one free.",
      originalPrice: 65,
      dealPrice: 32.5,
      dayOfWeek: "Tuesdays",
      timeStart: "17:00",
      timeEnd: "19:00",
      category: "red_wine",
      servingStyle: "glass",
      isPremiumDeal: false,
      establishment: {
        name: "Wine & Co.",
        address: "456 Vine St, Stellenbosch",
        distance: 1.2
      }
    },
    {
      id: 3,
      name: "Margarita Madness",
      description: "All margaritas 30% off during our Taco Tuesday promotion. Includes strawberry, classic, and spicy variants.",
      originalPrice: 95,
      dealPrice: 66.5,
      dayOfWeek: "Tuesdays",
      timeStart: "18:00",
      timeEnd: "21:00",
      category: "cocktail",
      subcategory: "Margarita",
      isPremiumDeal: true,
      establishment: {
        name: "Salsa Cantina",
        address: "789 Spicy Ave, Cape Town",
        distance: 0.8
      }
    },
    {
      id: 4,
      name: "Whisky Wednesday",
      description: "Premium whisky selections at special prices all evening. Try our range of single malts and blends.",
      originalPrice: 120,
      dealPrice: 75,
      dayOfWeek: "Wednesdays",
      timeStart: "19:00",
      timeEnd: "23:00",
      category: "whisky",
      brand: "Glenfiddich",
      servingStyle: "glass",
      isPremiumDeal: true,
      establishment: {
        name: "Highland Tavern",
        address: "321 Whisky Lane, Cape Town",
        distance: 1.5
      }
    },
    {
      id: 5,
      name: "Weekend Gin Special",
      description: "Craft gin and tonics with premium mixers and fresh garnishes at special weekend prices.",
      originalPrice: 85,
      dealPrice: 60,
      dayOfWeek: "Weekends",
      timeStart: "14:00",
      timeEnd: "18:00",
      category: "gin",
      brand: "Hendrick's",
      servingStyle: "glass",
      isPremiumDeal: false,
      establishment: {
        name: "The Gin Garden",
        address: "555 Botanical St, Cape Town",
        distance: 2.1
      }
    },
    {
      id: 6,
      name: "Craft Beer Flight",
      description: "Sample our selection of local craft beers with our discounted tasting flight.",
      originalPrice: 120,
      dealPrice: 85,
      dayOfWeek: "Daily",
      timeStart: "12:00",
      timeEnd: "16:00",
      category: "beer",
      subcategory: "Craft Beer",
      servingStyle: "glass",
      isPremiumDeal: true,
      establishment: {
        name: "Brewmaster's Den",
        address: "42 Hop Street, Cape Town",
        distance: 1.8
      }
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