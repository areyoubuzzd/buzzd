import { useLocation } from "wouter";
import { FiClock, FiMapPin, FiStar, FiLock } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DealWithEstablishment } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow, format, differenceInHours, isAfter, isBefore } from "date-fns";
import { formatDistance } from "@/utils/distance";
import { useToast } from "@/hooks/use-toast";

interface DealCardProps {
  deal: DealWithEstablishment | any; // Using any for our dummy data
  userLocation: { lat: number; lng: number };
  onViewClick?: () => void;
  isGrayedOut?: boolean; // New prop to control grayed out appearance
}

export default function DealCard({ deal, userLocation, onViewClick, isGrayedOut = false }: DealCardProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const getDealStatus = () => {
    const now = new Date();
    if (isAfter(new Date(deal.startTime), now)) {
      return "upcoming";
    } else if (isBefore(new Date(deal.endTime), now)) {
      return "inactive";
    } else {
      return "active";
    }
  };

  const status = getDealStatus();

  // Format the time remaining or until start
  const getTimeDisplay = () => {
    const now = new Date();
    
    if (status === 'active') {
      return `Today until ${format(new Date(deal.endTime), 'h:mm a')} (${formatDistanceToNow(new Date(deal.endTime), { addSuffix: true })})`;
    } else if (status === 'upcoming') {
      const hours = differenceInHours(new Date(deal.startTime), now);
      if (hours < 1) {
        return `Starts ${formatDistanceToNow(new Date(deal.startTime), { addSuffix: true })}`;
      } else {
        return `Starts at ${format(new Date(deal.startTime), 'h:mm a')} (${formatDistanceToNow(new Date(deal.startTime), { addSuffix: true })})`;
      }
    } else {
      // Inactive deal
      return `${format(new Date(deal.startTime), 'h:mm a')} - ${format(new Date(deal.endTime), 'h:mm a')}`;
    }
  };

  const calculateDistance = () => {
    if (!userLocation) return null;
    
    return formatDistance(
      userLocation.lat,
      userLocation.lng,
      deal.establishment.latitude,
      deal.establishment.longitude
    );
  };

  const distance = calculateDistance();

  // Format walking time (rough estimate)
  const getWalkingTime = () => {
    if (!distance) return null;
    // Average walking speed is about 5km/h, so 1km takes about 12 minutes
    const walkingTimeMinutes = Math.round(distance * 12);
    return `${walkingTimeMinutes} min walk`;
  };
  
  const recordViewMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await apiRequest("POST", `/api/deals/${deal.id}/view`);
    },
    onError: (error) => {
      console.error("Error recording deal view:", error);
    }
  });

  const handleViewDeal = () => {
    // If grayed out and user is not premium, prompt to upgrade
    if (isGrayedOut) {
      if (!user) {
        navigate("/auth");
      } else {
        toast({
          title: "Premium Feature",
          description: "Upgrade to Premium to view all deals",
        });
      }
      return;
    }
    
    // Record view if user is logged in
    if (user) {
      recordViewMutation.mutate();
    }
    
    // Navigate to deal details
    navigate(`/deal/${deal.id}`);
    
    // Call onViewClick if provided
    if (onViewClick) {
      onViewClick();
    }
  };

  const saveDealMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be logged in to save deals");
      await apiRequest("POST", "/api/saved-deals", { dealId: deal.id });
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

  const handleSaveOrRemind = () => {
    if (isGrayedOut) {
      // If grayed out, prompt to upgrade instead
      if (!user) {
        navigate("/auth");
      } else {
        toast({
          title: "Premium Feature",
          description: "Upgrade to Premium to save this deal",
        });
      }
      return;
    }
    
    if (status === 'upcoming' || status === 'inactive') {
      toast({
        title: "Reminder set",
        description: "We'll notify you when this deal becomes active",
      });
    } else {
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
    }
  };

  // Get deal type icon
  const getDrinkTypeIcon = () => {
    const drinkType = deal.drinkType?.toLowerCase() || '';
    if (drinkType.includes('beer')) return '🍺';
    if (drinkType.includes('wine')) return '🍷';
    if (drinkType.includes('whisky')) return '🥃';
    if (drinkType.includes('gin')) return '🍸';
    if (drinkType.includes('cocktail')) return '🍹';
    return '🥂';
  };

  return (
    <Card className={`
      bg-white rounded-lg shadow-md overflow-hidden 
      ${status === 'active' ? 'active-deal border-l-4 border-l-green-500' : 
        status === 'upcoming' ? 'upcoming-deal border-l-4 border-l-amber-500' : 
        'inactive-deal border-l-4 border-l-gray-400'}
      ${isGrayedOut ? 'relative' : ''}
    `}>
      {/* Gray overlay for locked premium content */}
      {isGrayedOut && (
        <div className="absolute inset-0 bg-gray-200 bg-opacity-50 backdrop-filter backdrop-blur-sm z-10 flex flex-col items-center justify-center">
          <FiLock className="h-8 w-8 text-gray-600 mb-2" />
          <p className="text-gray-700 font-medium text-center px-4">
            {!user ? "Sign in to view this deal" : "Upgrade to Premium"}
          </p>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-1/3 h-40 sm:h-auto relative">
          <img 
            src={deal.imageUrl || `https://source.unsplash.com/featured/?${deal.drinkType || 'cocktail'}`} 
            alt={deal.title || "Drink special"} 
            className="w-full h-full object-cover" 
          />
          <div className={`absolute top-2 right-2 ${
            status === 'active' ? 'bg-green-500' : 
            status === 'upcoming' ? 'bg-amber-500' : 
            'bg-gray-500'
          } text-white text-xs px-2 py-1 rounded-full`}>
            {status === 'active' ? 'Active Now' : 
             status === 'upcoming' ? 'Starts Soon' : 
             'Inactive'}
          </div>
          
          {/* Drink type badge */}
          <div className="absolute bottom-2 left-2 bg-gray-800 bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
            <span className="mr-1">{getDrinkTypeIcon()}</span>
            {deal.drinkType?.charAt(0).toUpperCase() + deal.drinkType?.slice(1) || 'Drink'}
          </div>
        </div>
        <div className="p-4 sm:w-2/3 flex flex-col justify-between">
          <div>
            {/* Only show establishment name if not grayed out */}
            <div className={`flex justify-between items-start ${isGrayedOut ? 'opacity-0' : ''}`}>
              <h3 className="font-semibold text-lg">
                {!isGrayedOut ? deal.establishment.name : '••••••••'}
              </h3>
              <div className="flex items-center">
                <FiStar className="h-4 w-4 text-yellow-500" />
                <span className="ml-1 text-sm">{deal.establishment.rating || '4.5'}</span>
              </div>
            </div>
            
            {/* Always show establishment type even if grayed out */}
            <p className="text-sm text-gray-600 mt-1">
              {deal.establishment.type || "Bar & Restaurant"}
            </p>
            
            {/* Deal details - shown for all */}
            <div className={`mt-2 ${
              status === 'active' ? 'bg-green-50' : 
              status === 'upcoming' ? 'bg-amber-50' : 
              'bg-gray-50'
            } p-2 rounded-md`}>
              <p className="text-sm font-medium flex items-center">
                <span className="mr-2 text-lg">{getDrinkTypeIcon()}</span>
                {deal.title || `${deal.savingsPercentage}% off Drinks`}
              </p>
              
              <div className="flex items-center mt-1 text-xs text-gray-600">
                <FiClock className="h-4 w-4 mr-1" />
                <span>{getTimeDisplay()}</span>
              </div>
              
              {/* Price information */}
              {deal.isOneForOne ? (
                <div className="mt-1 flex items-center text-xs">
                  <span className="font-semibold text-green-600">Buy 1 Get 1 Free</span>
                  <span className="mx-1">•</span>
                  <span>${deal.regularPrice}</span>
                </div>
              ) : (
                <div className="mt-1 flex items-center text-xs">
                  <span className="font-semibold text-green-600">${deal.dealPrice}</span>
                  <span className="mx-1">•</span>
                  <span className="line-through text-gray-500">${deal.regularPrice}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-end mt-3">
            <div className="flex items-center text-xs text-gray-600">
              <FiMapPin className="h-4 w-4 mr-1" />
              <span>{distance ? `${distance.toFixed(1)} km away • ${getWalkingTime()}` : 'Distance unknown'}</span>
            </div>
            <div className="flex items-center text-sm">
              {status === 'active' && (
                <span className="text-green-600 font-medium mr-2">Save {deal.savingsPercentage || 30}%</span>
              )}
              <Button
                variant={status === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={handleViewDeal}
                className={`${
                  status === 'active' 
                    ? 'bg-primary hover:bg-primary-dark text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-dark'
                } px-3 py-1 rounded-lg text-sm`}
              >
                {isGrayedOut ? "Unlock" : "View Deal"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
