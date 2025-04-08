import { useState } from "react";
import DealCard from "@/components/deals/updated-deal-card";
import ModernDealCard from "@/components/deals/modern-deal-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Create a simple cloudinary service just for this test
const cloudinaryService = {
  getBackgroundImageUrl(category: string): string {
    const cloudName = 'dp2uoj3ts';
    return `https://res.cloudinary.com/${cloudName}/image/upload/home/backgrounds/${category}/card_bg.png`;
  },
  
  getHeroImageUrl(category: string, brand?: string, servingStyle: 'bottle' | 'glass' = 'glass'): string {
    const cloudName = 'dp2uoj3ts';
    if (brand) {
      return `https://res.cloudinary.com/${cloudName}/image/upload/home/brands/${category}/${brand}/${servingStyle}/drink.png`;
    }
    return `https://res.cloudinary.com/${cloudName}/image/upload/home/brands/${category}/${servingStyle}/default/default.png`;
  }
};

// Sample data for testing
const SAMPLE_DEALS = [
  {
    id: 1,
    dealType: "1 FOR 1",
    discount: 30,
    category: "beer",
    brand: "heineken",
    servingStyle: "glass" as const,
    endTime: "6:00 PM",
    distance: 0.5,
  },
  {
    id: 2,
    dealType: "$6 GLASS",
    discount: 25,
    category: "wine",
    subcategory: "red_wine",
    servingStyle: "glass" as const,
    endTime: "6:00 PM",
    distance: 0.7,
  },
  {
    id: 3,
    dealType: "$8 MARGARITA",
    discount: 30,
    category: "cocktail",
    brand: "margarita",
    servingStyle: "glass" as const,
    endTime: "6:00 PM",
    distance: 0.4,
  },
  {
    id: 4,
    dealType: "$10 ROKU GIN",
    discount: 20,
    category: "gin",
    brand: "roku",
    servingStyle: "bottle" as const,
    endTime: "6:00 PM",
    distance: 0.6,
  },
];

// All categories for filtering
const ALL_CATEGORIES = ["all", "beer", "wine", "cocktail", "whisky", "vodka", "gin", "rum"];



export default function CardsTestPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [savedDeals, setSavedDeals] = useState<number[]>([]);

  // Filter deals by category
  const filteredDeals = selectedCategory === "all"
    ? SAMPLE_DEALS
    : SAMPLE_DEALS.filter(deal => deal.category === selectedCategory);

  // Toggle saved state for a deal
  const toggleSaved = (dealId: number) => {
    setSavedDeals(prev => 
      prev.includes(dealId)
        ? prev.filter(id => id !== dealId)
        : [...prev, dealId]
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Deal Cards</h1>
      <p className="mb-4 text-gray-600">
        These cards are designed in the exact credit card aspect ratio with discount badges and drink images.
        After uploading images to Cloudinary, they'll automatically display the correct backgrounds and hero images.
      </p>
      
      {/* Category filters */}
      <Tabs defaultValue="all" className="mb-8">
        <TabsList className="grid grid-cols-4 md:grid-cols-8 mb-4">
          {ALL_CATEGORIES.map(category => (
            <TabsTrigger 
              key={category}
              value={category}
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Display deals count */}
      <div className="mb-4 text-sm text-gray-500">
        Found {filteredDeals.length} deals
      </div>
      
      {/* Card Style Tabs */}
      <Tabs defaultValue="original" className="mb-8">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="original">Original Design</TabsTrigger>
          <TabsTrigger value="modern">Modern Design</TabsTrigger>
        </TabsList>
        
        <TabsContent value="original">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 gap-y-0">
            {filteredDeals.map(deal => (
              <div className="w-full mb-0 pb-0" key={`orig-${deal.id}`}>
                <DealCard
                  key={deal.id}
                  {...deal}
                  backgroundImageUrl={cloudinaryService.getBackgroundImageUrl(deal.category)}
                  heroImageUrl={cloudinaryService.getHeroImageUrl(deal.category, deal.brand, deal.servingStyle)}
                  isSaved={savedDeals.includes(deal.id)}
                  onSaveToggle={() => toggleSaved(deal.id)}
                  onClick={() => console.log(`Clicked deal ${deal.id}`)}
                />
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="modern">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 gap-y-0">
            {filteredDeals.map(deal => (
              <div className="w-full mb-0 pb-0" key={`modern-${deal.id}`}>
                <ModernDealCard
                  key={deal.id}
                  {...deal}
                  backgroundImageUrl={cloudinaryService.getBackgroundImageUrl(deal.category)}
                  heroImageUrl={cloudinaryService.getHeroImageUrl(deal.category, deal.brand, deal.servingStyle)}
                  isSaved={savedDeals.includes(deal.id)}
                  onSaveToggle={() => toggleSaved(deal.id)}
                  onClick={() => console.log(`Clicked deal ${deal.id}`)}
                />
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}