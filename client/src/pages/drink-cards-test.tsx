import { useState } from "react";
import { DrinkDealCard } from "@/components/deals/drink-deal-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sample data for testing
const SAMPLE_DEALS = [
  {
    id: 1,
    dealType: "$6 BEER",
    discount: 30,
    category: "beer",
    brand: "heineken",
    servingStyle: "glass" as const,
    endTime: "6:00 PM",
    distance: 0.7,
  },
  {
    id: 2,
    dealType: "1-FOR-1",
    discount: 40,
    category: "wine",
    subcategory: "red_wine",
    servingStyle: "glass" as const,
    endTime: "6:00 PM",
    distance: 0.8,
  },
  {
    id: 3,
    dealType: "$3 MARGARITA",
    discount: 23,
    category: "cocktail",
    brand: "margarita",
    servingStyle: "glass" as const,
    endTime: "6:00 PM",
    distance: 0.7,
  },
  {
    id: 4,
    dealType: "$12 ROKU GIN",
    discount: 30,
    category: "gin",
    brand: "roku",
    servingStyle: "bottle" as const,
    endTime: "6:00 PM",
    distance: 1.3,
  },
];

// All categories for filtering
const ALL_CATEGORIES = ["all", "beer", "wine", "cocktail", "whisky", "vodka", "gin", "rum"];

export default function DrinkCardsTest() {
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
      <h1 className="text-3xl font-bold mb-6">Drink Deal Cards</h1>
      <p className="mb-4 text-gray-600">
        These cards use solid colors as backgrounds and placeholder shapes where drink images will go.
        Once you upload real images to Cloudinary, we'll update the component to use those images.
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
      
      {/* Deal cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredDeals.map(deal => (
          <DrinkDealCard
            key={deal.id}
            {...deal}
            isSaved={savedDeals.includes(deal.id)}
            onSaveToggle={() => toggleSaved(deal.id)}
            onClick={() => console.log(`Clicked deal ${deal.id}`)}
          />
        ))}
      </div>
    </div>
  );
}