import { useState, useEffect, useMemo } from "react";
import Header from "@/components/layout/header";
import LocationBar from "@/components/layout/location-bar";
import FilterBar from "@/components/layout/filter-bar";
import SavingsCalculator from "@/components/savings/savings-calculator";
import Navigation from "@/components/layout/navigation";
import CollectionRow from "@/components/collections/collection-row";
import { FiMapPin } from "react-icons/fi";

// Import sample deals
// We will use these deals just to show the UI, will replace with real data later
const beerDeals = [
  {
    title: "House Draft Beer",
    description: "House draft beer at happy hour prices all day long!",
    drinkCategory: "beer",
    drinkSubcategory: "lager",
    isHousePour: true, 
    servingStyle: "pint",
    regularPrice: 15.00,
    dealPrice: 9.00,
    isOneForOne: false,
  },
  {
    title: "Tiger Beer Pint",
    description: "Tiger beer on tap at happy hour prices",
    drinkCategory: "beer",
    drinkSubcategory: "lager",
    brand: "Tiger",
    isHousePour: false,
    regularPrice: 16.00,
    dealPrice: 10.00,
    isOneForOne: false,
  },
  {
    title: "1-for-1 Draft Beer",
    description: "Buy one draft beer, get one free!",
    drinkCategory: "beer",
    isHousePour: true,
    regularPrice: 15.00,
    dealPrice: 15.00,
    isOneForOne: true,
  }
];

const houseWineDeals = [
  {
    title: "House Pour Red Wine",
    description: "Enjoy our house pour red wine at special prices during happy hour!",
    drinkCategory: "wine",
    drinkSubcategory: "red_wine",
    isHousePour: true,
    regularPrice: 15.00,
    dealPrice: 8.00,
    isOneForOne: false,
  },
  {
    title: "1-for-1 House Wine",
    description: "Buy one glass of house wine, get one free!",
    drinkCategory: "wine",
    isHousePour: true,
    regularPrice: 15.00,
    dealPrice: 15.00,
    isOneForOne: true,
  }
];

const spiritDeals = [
  {
    title: "House Pour Spirits",
    description: "All house pour spirits at happy hour prices",
    drinkCategory: "spirits",
    isHousePour: true,
    regularPrice: 15.00,
    dealPrice: 8.00,
    isOneForOne: false,
  },
  {
    title: "Premium Whisky",
    description: "Selected premium whiskies at special prices",
    drinkCategory: "spirits",
    drinkSubcategory: "whisky",
    isHousePour: false,
    regularPrice: 25.00,
    dealPrice: 18.00,
    isOneForOne: false,
  }
];

const cocktailDeals = [
  {
    title: "House Cocktails",
    description: "Our signature cocktails at happy hour prices",
    drinkCategory: "cocktail",
    drinkSubcategory: "signature",
    isHousePour: true,
    regularPrice: 22.00,
    dealPrice: 16.00,
    isOneForOne: false,
  },
  {
    title: "1-for-1 Classic Cocktails",
    description: "Buy one classic cocktail, get one free!",
    drinkCategory: "cocktail",
    drinkSubcategory: "classic",
    isHousePour: false,
    regularPrice: 22.00,
    dealPrice: 22.00,
    isOneForOne: true,
  }
];

// Import the original sample deals
// We will use these deals just to show the UI, will replace with real data later

// Updated FilterType to match the new filter-bar component
type FilterType = 'active' | 'one-for-one' | 'high-savings' | 'beer' | 'wine' | 'whisky';

export default function HomeCollection() {
  // Initialize with a default location - Singapore
  const [location, setLocation] = useState<{ lat: number; lng: number }>({ lat: 1.3521, lng: 103.8198 });
  const [activeFilter, setActiveFilter] = useState<FilterType>('active');
  const [totalDealsFound, setTotalDealsFound] = useState<number>(30); // Total deals from API

  useEffect(() => {
    // Try to get user's location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          // We already have a default location (Singapore) set in state
        }
      );
    }
  }, []);

  // Transform the sample deals into the right format for our components
  const prepareDeals = (deals: any[]) => {
    return deals.map((deal, index) => ({
      id: index + 1,
      description: deal.title,
      alcohol_category: deal.drinkCategory || "drink",
      alcohol_subcategory: deal.drinkSubcategory || "",
      establishment: {
        name: `Sample Bar ${index + 1}`,
        latitude: 1.3521 + (Math.random() * 0.05 - 0.025),
        longitude: 103.8198 + (Math.random() * 0.05 - 0.025),
        type: "Bar & Restaurant"
      },
      hh_start_time: "17:00:00",
      hh_end_time: "20:00:00",
      regularPrice: deal.regularPrice,
      dealPrice: deal.dealPrice,
      imageUrl: `https://placehold.co/400x400/e6f7ff/0099cc?text=${deal.drinkCategory || 'Drink'}`,
      isOneForOne: deal.isOneForOne || false
    }));
  };

  // Sample deals with collections
  const allDeals = useMemo(() => {
    const allSampleDeals = [
      ...beerDeals.map((deal, index) => ({
        ...deal,
        id: `beer-${index}`,
        collections: deal.dealPrice <= 10 ? 'beers_under_10' : '',
        collections: deal.isOneForOne ? (deal.collections ? `${deal.collections},one_for_one_deals` : 'one_for_one_deals') : deal.collections || ''
      })),
      ...houseWineDeals.map((deal, index) => ({
        ...deal,
        id: `wine-${index}`,
        collections: 'wine_deals'
      })),
      ...spiritDeals.map((deal, index) => ({
        ...deal,
        id: `spirit-${index}`,
        collections: deal.isHousePour ? 'happy_hour_spirits' : 'premium_spirits'
      })),
      ...cocktailDeals.map((deal, index) => ({
        ...deal,
        id: `cocktail-${index}`,
        collections: 'cocktail_specials'
      }))
    ];
    
    return prepareDeals(allSampleDeals);
  }, []);
  
  // Create our collections
  const collections = useMemo(() => {
    // Define collection metadata with names and order
    const collectionsConfig = [
      { id: 'beers_under_10', title: 'Beers under $10' },
      { id: 'one_for_one_deals', title: '1-for-1 Deals' },
      { id: 'wine_deals', title: 'Wine Deals' },
      { id: 'premium_spirits', title: 'Premium Spirits' },
      { id: 'cocktail_specials', title: 'Cocktail Specials' },
      { id: 'happy_hour_spirits', title: 'Happy Hour Spirits' }
    ];
    
    // Return collections with their deals
    return collectionsConfig.map(config => {
      return {
        title: config.title,
        deals: allDeals.filter(deal => 
          deal.collections && 
          deal.collections.split(',').map((c: string) => c.trim()).includes(config.id)
        )
      };
    }).filter(collection => collection.deals.length > 0);
  }, [allDeals]);

  const handleLocationChange = (newLocation: { lat: number; lng: number }) => {
    setLocation(newLocation);
    
    // In a real app, we'd recalculate deals based on new location
    // For now, just simulate different number of deals
    setTotalDealsFound(Math.floor(Math.random() * 20) + 10);
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    
    // In a real app, we'd filter deals based on the new filter
    // For now, just simulate different number of deals
    setTotalDealsFound(Math.floor(Math.random() * 20) + 10);
  };

  const handleOpenFilters = () => {
    // This would open a more detailed filters panel in a real app
    console.log("Open detailed filters");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <LocationBar 
        onLocationChange={handleLocationChange} 
        onOpenFilters={handleOpenFilters} 
      />
      
      <FilterBar onFilterChange={handleFilterChange} activeFilter={activeFilter} />
      
      {/* Location and deal count indicator */}
      <div className="bg-gray-50 px-4 py-2">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <FiMapPin className="mr-1 h-4 w-4" />
              <span>Singapore</span>
            </div>
            <div className="text-sm font-medium">
              {totalDealsFound} deals found
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content area with collections */}
      <main className="flex-1 bg-gray-50 px-4 py-6 pb-20">
        <div className="container mx-auto">
          {collections.map((collection, index) => (
            <CollectionRow
              key={index}
              title={collection.title}
              deals={collection.deals}
              userLocation={location}
              onViewAllClick={() => console.log(`View all ${collection.title}`)}
            />
          ))}
        </div>
      </main>
      
      <SavingsCalculator />
      
      <Navigation />
    </div>
  );
}