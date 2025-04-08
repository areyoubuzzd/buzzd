import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import Navigation from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FiArrowLeft, FiClock, FiMapPin, FiStar, FiCalendar, FiDollarSign, FiBookmark, FiHeart } from "react-icons/fi";
import { format, formatDistanceToNow } from "date-fns";
import { formatDistance } from "@/utils/distance";
import { formatTimeRange } from "@/utils/time";

export default function DealDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch deal details
  const { data: deal, isLoading, error } = useQuery({
    queryKey: [`/api/deals/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/deals/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch deal details");
      }
      return response.json();
    },
  });

  // Record deal view on component mount
  useEffect(() => {
    if (user && id) {
      const recordView = async () => {
        try {
          await apiRequest("POST", `/api/deals/${id}/view`);
        } catch (error) {
          console.error("Error recording view:", error);
        }
      };
      recordView();
    }
  }, [user, id]);

  // Save deal mutation
  const saveDealMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be logged in to save deals");
      await apiRequest("POST", "/api/saved-deals", { dealId: parseInt(id) });
    },
    onSuccess: () => {
      toast({
        title: "Deal saved",
        description: "This deal has been added to your saved deals",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-deals"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving deal",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: { rating: number; comment: string }) => {
      if (!user) throw new Error("You must be logged in to submit a review");
      await apiRequest("POST", "/api/reviews", {
        dealId: parseInt(id),
        ...reviewData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error submitting review",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleSaveDeal = () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "You need to be logged in to save deals",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    saveDealMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
        <Navigation />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={handleGoBack} className="mb-4">
            <FiArrowLeft className="mr-2" /> Back
          </Button>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-10">
                <h2 className="text-xl font-semibold text-gray-800">Error loading deal</h2>
                <p className="mt-2 text-gray-600">Please try again later or check your connection</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <Navigation />
      </div>
    );
  }

  const getDayNames = () => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const daysOfWeek = deal.daysOfWeek as number[];
    return daysOfWeek.map(day => days[day]).join(", ");
  };

  const calculateDistance = () => {
    // In a real app, we would use the user's current location
    // For now, just use a hardcoded Toronto location
    const userLocation = { lat: 43.651070, lng: -79.347015 };
    
    return formatDistance(
      userLocation.lat,
      userLocation.lng,
      deal.establishment.latitude,
      deal.establishment.longitude
    );
  };

  const distance = calculateDistance();

  // Sort reviews by most recent
  const sortedReviews = [...(deal.reviews || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1 container mx-auto px-4 py-8 pb-20">
        <Button variant="ghost" onClick={handleGoBack} className="mb-4">
          <FiArrowLeft className="mr-2" /> Back
        </Button>

        {/* Deal Image and Title */}
        <div className="relative h-48 md:h-64 rounded-t-xl overflow-hidden mb-4">
          <img 
            src={deal.imageUrl || `https://source.unsplash.com/featured/?restaurant,${deal.establishment.name}`} 
            alt={deal.title} 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-4">
            <h1 className="text-white text-xl md:text-2xl font-bold">{deal.title}</h1>
            <p className="text-white/90 text-sm md:text-base">
              at <span className="font-semibold">{deal.establishment.name}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {/* Deal Details */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Deal Details</CardTitle>
                <CardDescription>
                  <div className="flex items-center">
                    <FiStar className="h-4 w-4 text-yellow-500 mr-1" />
                    <span>{deal.establishment.rating || "4.5"}</span>
                    <span className="mx-2">•</span>
                    <span>{deal.establishment.type}</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-primary/10 rounded-md">
                  <h3 className="font-semibold text-lg mb-2">{deal.description}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div className="flex items-center text-sm">
                      <FiDollarSign className="h-4 w-4 mr-2 text-primary" />
                      <div>
                        <div className="font-medium">Regular Price: ${deal.regularPrice.toFixed(2)}</div>
                        <div className="font-bold text-green-600">Deal Price: ${deal.dealPrice.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="flex items-center text-sm">
                      <FiClock className="h-4 w-4 mr-2 text-primary" />
                      <div>
                        <div className="font-medium">{formatTimeRange(deal.startTime, deal.endTime)}</div>
                        <div className="text-gray-600">Save {deal.savingsPercentage.toFixed(0)}%</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <FiCalendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span>Available on: {getDayNames()}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <FiMapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{deal.establishment.address}, {deal.establishment.city}, {deal.establishment.postalCode}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <FiMapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{distance ? `${distance.toFixed(1)} km away • ${Math.round(distance * 12)} min walk` : 'Distance unknown'}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  className="flex-1 mr-2"
                  onClick={handleSaveDeal}
                  disabled={saveDealMutation.isPending}
                >
                  <FiBookmark className="mr-2 h-4 w-4" />
                  {saveDealMutation.isPending ? "Saving..." : "Save Deal"}
                </Button>
                <Button 
                  className="flex-1 ml-2 bg-primary hover:bg-primary/90"
                  onClick={() => window.open(`https://maps.google.com/?q=${deal.establishment.latitude},${deal.establishment.longitude}`, '_blank')}
                >
                  <FiMapPin className="mr-2 h-4 w-4" />
                  Get Directions
                </Button>
              </CardFooter>
            </Card>

            {/* Reviews Section */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {sortedReviews.length > 0 ? (
                  <div className="space-y-4">
                    {sortedReviews.map((review) => (
                      <div key={review.id} className="p-4 bg-gray-50 rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className="bg-primary/20 text-primary font-medium w-8 h-8 rounded-full flex items-center justify-center">
                              {review.rating}
                            </div>
                            <div className="ml-2">
                              <div className="font-medium">User</div>
                              <div className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <FiStar
                                key={i}
                                className={`h-4 w-4 ${i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && <p className="text-sm text-gray-700">{review.comment}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No reviews yet. Be the first to review this deal!
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Establishment Info and Map */}
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>About {deal.establishment.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  {deal.establishment.description || `${deal.establishment.name} is a popular spot offering great happy hour deals.`}
                </p>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Address:</h4>
                  <p className="text-sm">{deal.establishment.address}</p>
                  <p className="text-sm">{deal.establishment.city}, {deal.establishment.postalCode}</p>
                </div>
                
                {/* Map placeholder - would be an actual map in a real app */}
                <div className="h-40 bg-gray-200 rounded-md mt-2 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Map view would render here</span>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open(`tel:+15551234567`)}
                >
                  Call Restaurant
                </Button>
              </CardContent>
            </Card>

            {/* Leave a Review Card */}
            {user && (
              <Card>
                <CardHeader>
                  <CardTitle>Leave a Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            if (!user) {
                              toast({
                                title: "Login required",
                                description: "You need to be logged in to review deals",
                                variant: "destructive",
                              });
                              navigate("/auth");
                              return;
                            }
                            
                            submitReviewMutation.mutate({
                              rating: i + 1,
                              comment: "",
                            });
                          }}
                          className="focus:outline-none"
                        >
                          <FiStar
                            className={`h-8 w-8 ${
                              i < 3 ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-center text-sm text-gray-500">
                      Click on a star to rate this deal
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Navigation />
    </div>
  );
}
