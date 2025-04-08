import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Navigation from "@/components/layout/navigation";
import DealCard from "@/components/deals/deal-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FiSearch, FiFilter, FiMapPin } from "react-icons/fi";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchType, setSearchType] = useState<string>("");
  const [searchStatus, setSearchStatus] = useState<string>("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Fetch search results
  const { data: searchResults, isLoading, refetch } = useQuery({
    queryKey: ["/api/deals/search", { q: searchQuery, type: searchType, status: searchStatus }],
    queryFn: async ({ queryKey }) => {
      const [, params] = queryKey as [string, { q: string; type: string; status: string }];
      
      let url = `/api/deals/search?q=${encodeURIComponent(params.q || '')}`;
      if (params.type) url += `&type=${encodeURIComponent(params.type)}`;
      if (params.status) url += `&status=${encodeURIComponent(params.status)}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch search results");
      }
      return response.json();
    },
    enabled: isSearching,
  });

  // Get user location
  useEffect(() => {
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
          // Default to a fallback location (Toronto)
          setLocation({ lat: 43.651070, lng: -79.347015 });
        }
      );
    }
  }, []);

  const handleSearch = () => {
    setIsSearching(true);
    refetch();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearFilters = () => {
    setSearchType("");
    setSearchStatus("");
    if (searchQuery) {
      refetch();
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-gray-100">
        <div className="container mx-auto px-4 py-8 pb-20">
          <h1 className="text-2xl font-bold mb-6">Search Deals</h1>

          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center mb-4">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search for deals, restaurants, or food types..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
              <Button 
                className="ml-2 bg-primary hover:bg-primary/90"
                onClick={handleSearch}
                disabled={isLoading}
              >
                {isLoading ? "Searching..." : "Search"}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="flex-1 flex items-center space-x-2">
                <FiFilter className="text-gray-400" />
                <span className="text-sm text-gray-600">Filter by:</span>
              </div>
              
              <div className="flex-1">
                <Select value={searchType} onValueChange={setSearchType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Deal Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="drink">Drinks</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="both">Food & Drinks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Select value={searchStatus} onValueChange={setSearchStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Deal Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="active">Active Now</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>

          <div>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  {searchResults.length} results found
                  {searchQuery && ` for "${searchQuery}"`}
                </div>
                <div className="space-y-4">
                  {searchResults.map((deal) => (
                    <DealCard 
                      key={deal.id} 
                      deal={deal} 
                      userLocation={location}
                    />
                  ))}
                </div>
              </>
            ) : isSearching ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <FiSearch className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h2 className="text-xl font-semibold text-gray-800">No results found</h2>
                <p className="mt-2 text-gray-600">
                  Try adjusting your search terms or filters
                </p>
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <FiMapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h2 className="text-xl font-semibold text-gray-800">Search for happy hour deals</h2>
                <p className="mt-2 text-gray-600">
                  Enter keywords or use filters to find the perfect happy hour
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Navigation />
    </div>
  );
}
