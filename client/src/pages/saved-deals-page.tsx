import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import Navigation from "@/components/layout/navigation";
import DealCard from "@/components/deals/deal-card";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FiBookmark, FiTrash2 } from "react-icons/fi";

export default function SavedDealsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch saved deals
  const { data: savedDeals, isLoading, error } = useQuery({
    queryKey: ["/api/saved-deals"],
    queryFn: async () => {
      const response = await fetch("/api/saved-deals");
      if (!response.ok) {
        throw new Error("Failed to fetch saved deals");
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Try to get user's location
  useState(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          // Default to a fallback location (Toronto)
          setUserLocation({ lat: 43.651070, lng: -79.347015 });
        }
      );
    }
  });

  // Unsave deal mutation
  const unsaveDealMutation = async (dealId: number) => {
    try {
      await apiRequest("DELETE", `/api/saved-deals/${dealId}`);
      toast({
        title: "Deal removed",
        description: "The deal has been removed from your saved deals",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-deals"] });
    } catch (error) {
      toast({
        title: "Error removing deal",
        description: "Failed to remove the deal. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold">You need to log in first</h2>
            <p className="mt-2 text-gray-600">Please log in to view your saved deals</p>
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-gray-100">
        <div className="container mx-auto px-4 py-8 pb-20">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Your Saved Deals</h1>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-800">Error loading saved deals</h2>
              <p className="mt-2 text-gray-600">Please try again later or check your connection</p>
            </div>
          ) : savedDeals && savedDeals.length > 0 ? (
            <div className="space-y-4">
              {savedDeals.map((deal) => (
                <div key={deal.id} className="relative">
                  <DealCard deal={deal} userLocation={userLocation} />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => unsaveDealMutation(deal.id)}
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <FiBookmark className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h2 className="text-xl font-semibold text-gray-800">No saved deals yet</h2>
              <p className="mt-2 text-gray-600">Deals that you save will appear here</p>
              <Button 
                className="mt-4 bg-primary hover:bg-primary/90"
                onClick={() => window.location.href = '/'}
              >
                Discover Deals
              </Button>
            </div>
          )}
        </div>
      </main>
      <Navigation />
    </div>
  );
}
