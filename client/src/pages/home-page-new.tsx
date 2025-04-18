import React, { useState, useEffect, useMemo } from "react";
import Header from "@/components/layout/header";
import Navigation from "@/components/layout/navigation";
import CollectionRow from "@/components/collections/collection-row";
import { useLocation } from "@/contexts/location-context";
import { LocationHeader } from "@/components/location/location-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FaWhatsapp } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
// Import only the utility functions we need
import { 
  getFriendlyCollectionName, 
  getCollectionTags
} from "@/lib/collection-utils";

// Updated FilterType to match the new filter-bar component
type FilterType = 'active' | 'one-for-one' | 'high-savings' | 'beer' | 'wine' | 'whisky';

// Define Deal and Collection types
type Deal = {
  id: number;
  establishmentId: number;
  alcohol_category: string;
  alcohol_subcategory?: string | null;
  alcohol_subcategory2?: string | null;
  drink_name?: string | null;
  standard_price: number;        // From API (matches DB schema)
  happy_hour_price: number;
  savings?: number;
  savings_percentage?: number;
  valid_days: string;
  hh_start_time: string;
  hh_end_time: string;
  collections?: string | null;
  description?: string | null;
  distance?: number;
  establishment?: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    [key: string]: any;
  }
};

// Collection from API
interface ApiCollection {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  priority: number;
  active: boolean;
}

// Collection model for display
type Collection = {
  name: string;
  deals: Deal[];
  description?: string;
  slug?: string;
  priority: number; // Make priority required to enforce sorting
};

export default function HomePage() {
  // Use this for WhatsApp button so it's directly embedded in this file
  const handleWhatsAppClick = () => {
    const whatsappUrl = "https://wa.me/6587654321?text=Hello%2C%20I'd%20like%20to%20suggest%20a%20restaurant%20or%20deal%20to%20be%20added%20to%20the%20app.";
    window.open(whatsappUrl, "_blank");
  };
  
  // Store the current page in sessionStorage for proper back navigation
  useEffect(() => {
    sessionStorage.setItem('lastVisitedPage', '/');
    console.log('HomePage: Set lastVisitedPage to / in sessionStorage');
  }, []);
  
  // Get location from global context
  const { location, userRoadName, isUsingDefaultLocation, userPosition } = useLocation();
  const [activeFilter, setActiveFilter] = useState<FilterType>('active');
  const [totalDealsFound, setTotalDealsFound] = useState<number>(30); // Total deals from API

  // Fetch all deals for collections with location parameters
  const { data: dealsData } = useQuery<Deal[]>({
    queryKey: ['/api/deals/collections/all', { lat: location.lat, lng: location.lng }],
    staleTime: 60000, // 1 minute
    retry: 2
  });
  
  // Fetch collections metadata from the API
  const { data: apiCollections } = useQuery<ApiCollection[]>({
    queryKey: ['/api/collections'],
    staleTime: 300000, // 5 minutes
    retry: 2
  });
  
  // Helper function to check if deal is active right now (based on day and time)
  const isDealActiveNow = (deal: Deal): boolean => {
    // Current implementation simplified for example
    return true;
  };
  
  // Helper function to calculate haversine distance between coordinates
  const calculateHaversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance;
  };
  
  // Generate collections from deals data and API collections
  const collections = useMemo<Collection[]>(() => {
    if (!dealsData || dealsData.length === 0) return [];
    
    // Create a copy of the deals data to work with
    const allDeals = [...dealsData];
    
    // The final array of collections we'll return
    const result: Collection[] = [];
    
    // Keep track of which collection names we've already used (case-insensitive)
    const usedCollectionNames = new Set<string>();
    
    // Map of API collection slugs to match them with appropriate deals
    const apiCollectionMap = new Map<string, ApiCollection>();
    
    // Build a map of API collections for easy lookup by slug
    if (apiCollections && apiCollections.length > 0) {
      // Create a map for quick slug lookup
      apiCollections.forEach(collection => {
        apiCollectionMap.set(collection.slug, collection);
      });
    }
    
    // Process each deal to determine its collection(s)
    allDeals.forEach(deal => {
      if (!deal.collections) return;
      
      // Split the comma-separated collection slugs
      const collectionSlugs = deal.collections.split(',').map(s => s.trim());
      
      // Process each collection slug
      collectionSlugs.forEach(slug => {
        // First check if we have API collection metadata for this slug
        const apiCollection = apiCollectionMap.get(slug);
        
        if (apiCollection) {
          // This is a known collection with metadata
          const friendlyName = apiCollection.name;
          const priority = apiCollection.priority;
          
          // Create a normalized name for uniqueness check
          const normalizedName = friendlyName.toLowerCase();
          
          // Check if we've already created this collection
          if (usedCollectionNames.has(normalizedName)) {
            // Find the existing collection
            const existingCollection = result.find(c => 
              c.name.toLowerCase() === normalizedName
            );
            
            if (existingCollection) {
              // Add this deal to the existing collection
              existingCollection.deals.push(deal);
            }
          } else {
            // Create a new collection with this metadata
            result.push({
              name: friendlyName,
              description: apiCollection.description,
              slug: apiCollection.slug,
              priority: priority,
              deals: [deal]
            });
            
            // Mark this collection name as used
            usedCollectionNames.add(normalizedName);
          }
        }
      });
    });
    
    // Sort all collections by their priority (direct sort, not using the utility function)
    // because the utility expects string[] but we have Collection[] objects
    return result.sort((a, b) => a.priority - b.priority);
  }, [dealsData, apiCollections]);

  // Update the total deals count when the data changes
  useEffect(() => {
    if (dealsData) {
      setTotalDealsFound(dealsData.length);
    }
  }, [dealsData]);
  
  // Handle click to open the filters
  const handleOpenFilters = () => {
    console.log("Open detailed filters");
  };

  return (
    <div className="flex flex-col min-h-screen pb-36">
      <Header />
      
      {/* Use the LocationHeader component for consistency across pages */}
      <LocationHeader onOpenFilters={handleOpenFilters} />
      
      {/* Total Deals Count */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="container mx-auto">
          <div className="text-sm text-gray-600 mb-1">
            <span className="mr-1">Found</span>
            <span className="font-semibold text-primary">{totalDealsFound}</span>
            <span className="ml-1">drink deals near you</span>
          </div>
        </div>
      </div>

      {/* Collections Section */}
      {collections.length > 0 ? (
        <motion.div
          className="mb-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="px-4 py-6">
            {/* High Priority Collections (Active Now, etc.) */}
            <motion.div
              className="mb-8"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.2
                  }
                }
              }}
            >
              {collections
                .filter(collection => {
                  // Get high priority collections (priority < 20)
                  return collection.priority < 20;
                })
                .sort((a, b) => {
                  // Sort by priority directly
                  return a.priority - b.priority;
                })
                .map((collection, index) => (
                  <motion.div
                    key={`high-${collection.name}-${index}`}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { 
                        opacity: 1, 
                        y: 0,
                        transition: {
                          type: "spring", 
                          duration: 0.5
                        }
                      }
                    }}
                  >
                    <CollectionRow
                      title={collection.name}
                      description={collection.description}
                      deals={collection.deals}
                      userLocation={location}
                    />
                  </motion.div>
                ))
              }
            </motion.div>
            
            {/* Medium and Low Priority Collections */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.4
                  }
                }
              }}
            >
              {collections
                .filter(collection => {
                  // Get medium and low priority collections (20 and higher)
                  return collection.priority >= 20;
                })
                .sort((a, b) => {
                  // Sort by priority value directly
                  return a.priority - b.priority;
                })
                .map((collection, index) => (
                  <motion.div
                    key={`other-${collection.name}-${index}`}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { 
                        opacity: 1, 
                        y: 0,
                        transition: {
                          type: "spring", 
                          duration: 0.5
                        }
                      }
                    }}
                  >
                    <CollectionRow
                      title={collection.name}
                      description={collection.description}
                      deals={collection.deals}
                      userLocation={location}
                    />
                  </motion.div>
                ))
              }
            </motion.div>
          </div>
        </motion.div>
      ) : (
        <div className="px-4 py-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Alert>
              <AlertDescription>
                Loading deals near you...
              </AlertDescription>
            </Alert>
          </motion.div>
        </div>
      )}
      
      {/* WhatsApp integration for deal suggestions */}
      <motion.div 
        className="fixed bottom-20 right-4 z-50"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          delay: 0.3 
        }}
      >
        <motion.button
          onClick={handleWhatsAppClick}
          className="bg-[#25D366] hover:bg-[#1da851] text-white rounded-full p-3 shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaWhatsapp className="h-6 w-6" />
        </motion.button>
      </motion.div>
      
      <Navigation />
    </div>
  );
}