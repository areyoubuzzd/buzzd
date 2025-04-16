import { useState, useEffect, useMemo } from "react";
import Header from "@/components/layout/header";
import LocationBar from "@/components/layout/location-bar";
import FilterBar from "@/components/layout/filter-bar";
import SavingsCalculator from "@/components/savings/savings-calculator";
import Navigation from "@/components/layout/navigation";
import CollectionRow from "@/components/collections/collection-row";
import { FiMapPin } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";

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
      isOneForOne: deal.isOneForOne || false,
      collections: deal.collections // Make sure to include collections
    }));
  };

  // Define an interface for our Deal type
  interface Deal {
    id: number;
    description: string;
    alcohol_category: string;
    alcohol_subcategory?: string;
    establishmentId: number | null;
    establishment: {
      id: number | null;
      name: string;
      latitude: number;
      longitude: number;
      type: string;
    };
    hh_start_time: string;
    hh_end_time: string;
    regularPrice: number;
    dealPrice: number;
    imageUrl: string;
    isOneForOne: boolean;
    collections: string;
  }

  // Fetch deals from API
  const { data: dealsData, isLoading: isLoadingDeals, error } = useQuery<any[]>({
    queryKey: ['/api/deals/collections/all'],
    retry: 2,
  });
  
  // Process deals from API
  const allDeals = useMemo<Deal[]>(() => {
    if (!dealsData || !Array.isArray(dealsData)) return [];
    
    // Update total deals count
    setTotalDealsFound(dealsData.length);
    
    // Log the actual API response to see what we're working with
    console.log('Raw API data first deal:', dealsData[0]);
    
    return dealsData.map((deal: any) => ({
      id: deal.id,
      description: deal.drink_name || "",
      alcohol_category: deal.alcohol_category || "other",
      alcohol_subcategory: deal.alcohol_subcategory || undefined,
      establishmentId: deal.establishmentId || (deal.establishment?.id) || null,
      establishment: {
        id: deal.establishment?.id || null,
        name: deal.establishment?.name || 'Unknown Venue',
        latitude: deal.establishment?.latitude || 1.3521,
        longitude: deal.establishment?.longitude || 103.8198,
        type: deal.establishment?.cuisine || 'Bar & Restaurant'
      },
      hh_start_time: deal.hh_start_time || "17:00:00",
      hh_end_time: deal.hh_end_time || "20:00:00",
      regularPrice: Number(deal.standard_price || 0),
      dealPrice: Number(deal.happy_hour_price || 0),
      imageUrl: deal.imageUrl || `https://placehold.co/400x400/e6f7ff/0099cc?text=${deal.drink_name || 'Drink'}`,
      isOneForOne: Boolean(deal.is_one_for_one) || false,
      collections: deal.collections || ''
    }));
  }, [dealsData, setTotalDealsFound]);
  
  // Define interface for our collection structure
  interface Collection {
    title: string;
    deals: Deal[];
  }
  
  // Create our collections
  const collections = useMemo<Collection[]>(() => {
    // First get all unique collection tags from the deals
    const uniqueCollections = new Set<string>();
    allDeals.forEach(deal => {
      if (deal.collections) {
        deal.collections.split(',').map((c: string) => c.trim()).forEach((tag: string) => {
          if (tag) uniqueCollections.add(tag);
        });
      }
    });
    
    // Define collection metadata with names and order
    const collectionsConfig = [
      // Pre-defined collections
      { id: 'beers_under_10', title: 'Beers under $10' },
      { id: 'one_for_one_deals', title: '1-for-1 Deals' },
      { id: 'wine_deals', title: 'Wine Deals' },
      { id: 'premium_spirits', title: 'Premium Spirits' },
      { id: 'cocktail_specials', title: 'Cocktail Specials' },
      { id: 'happy_hour_spirits', title: 'Happy Hour Spirits' },
      // Add any collections found in data that aren't in our predefined list
      ...Array.from(uniqueCollections)
        .filter(id => !['beers_under_10', 'one_for_one_deals', 'wine_deals', 'premium_spirits', 'cocktail_specials', 'happy_hour_spirits'].includes(id))
        .map(id => ({ 
          id, 
          title: id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        }))
    ];
    
    console.log('Available collections:', Array.from(uniqueCollections));
    
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
              <span>Bukit Timah Road</span>
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
          {isLoadingDeals ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500">Loading deals...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-red-500 font-medium">Error loading deals</p>
              <p className="text-gray-500 text-sm mt-2">Please try again later</p>
            </div>
          ) : collections.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-gray-500">No deals found in your area</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or location</p>
            </div>
          ) : (
            collections.map((collection, index) => (
              <CollectionRow
                key={index}
                title={collection.title}
                deals={collection.deals}
                userLocation={location}
                onViewAllClick={() => console.log(`View all ${collection.title}`)}
              />
            ))
          )}
        </div>
      </main>
      
      <SavingsCalculator />
      
      <Navigation />
    </div>
  );
}