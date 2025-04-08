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
    <Card className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Top section with image and discount tag */}
      <div className="relative">
        <img 
          src={deal.imageUrl || `https://source.unsplash.com/featured/?${deal.drinkType || 'cocktail'}`} 
          alt={deal.title || "Drink special"} 
          className="w-full h-48 object-cover" 
        />
        
        {/* Drink type icon */}
        <div className="absolute top-3 left-3 bg-black bg-opacity-60 text-white p-2 rounded-full">
          <span className="text-xl">{getDrinkTypeIcon()}</span>
        </div>
        
        {/* Discount or deal badge */}
        <div className="absolute top-3 right-3 bg-gradient-to-r from-primary to-primary-dark text-white px-4 py-2 rounded-lg shadow-md">
          <div className="flex items-center">
            <span className="mr-1 text-lg">📣</span>
            <span className="font-bold">
              {deal.isOneForOne 
                ? "1-FOR-1" 
                : `${deal.savingsPercentage || 30}% OFF`}
            </span>
          </div>
        </div>
        
        {/* Status badge */}
        <div className={`absolute bottom-3 left-3 ${
          status === 'active' ? 'bg-green-500' : 
          status === 'upcoming' ? 'bg-amber-500' : 
          'bg-gray-500'
        } text-white text-xs px-3 py-1 rounded-full shadow`}>
          {status === 'active' ? 'Active Now' : 
           status === 'upcoming' ? 'Starts Soon' : 
           'Inactive'}
        </div>
        
        {/* Blurred overlay for premium content */}
        {isGrayedOut && (
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black to-transparent opacity-40">
            <div className="absolute bottom-3 right-3 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full shadow flex items-center">
              <FiLock className="mr-1 h-4 w-4" />
              <span className="text-xs font-medium">
                {!user ? "Sign in" : "Upgrade"} to unlock
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom section with restaurant info and deal details */}
      <div className="p-4">
        {/* Restaurant name row */}
        {isGrayedOut ? (
          <div className="flex items-center justify-between mb-2 border border-dashed border-gray-300 p-2 rounded-md bg-gray-50">
            <div className="flex items-center">
              <span className="text-lg mr-2">🍽️</span>
              <div>
                <h3 className="font-semibold text-gray-400">Hidden Restaurant</h3>
                <p className="text-xs text-gray-500">
                  {deal.establishment.type || "Bar & Restaurant"}
                </p>
              </div>
            </div>
            <FiLock className="h-5 w-5 text-gray-400" />
          </div>
        ) : (
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="text-lg mr-2">🍽️</span>
              <div>
                <h3 className="font-semibold">{deal.establishment.name}</h3>
                <p className="text-xs text-gray-600">
                  {deal.establishment.type || "Bar & Restaurant"}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <FiStar className="h-4 w-4 text-yellow-500" />
              <span className="ml-1 text-sm">{deal.establishment.rating || '4.5'}</span>
            </div>
          </div>
        )}
        
        {/* Time and distance row */}
        <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
          <div className="flex items-center">
            <span className="text-lg mr-1">🕒</span>
            <span>{format(new Date(deal.endTime), 'h:mm a')}</span>
          </div>
          <div className="flex items-center">
            <span className="text-lg mr-1">📍</span>
            <span>{distance ? `${(distance * 1000).toFixed(0)}m` : 'Distance unknown'}</span>
          </div>
        </div>
        
        {/* Price row */}
        <div className="flex items-center mb-3">
          <span className="text-lg mr-1">💸</span>
          {deal.isOneForOne ? (
            <div className="flex items-center text-sm">
              <span className="font-semibold text-primary">Buy 1 Get 1 Free</span>
              <span className="mx-1">•</span>
              <span>${deal.regularPrice}</span>
            </div>
          ) : (
            <div className="flex items-center text-sm">
              <span>Was </span>
              <span className="mx-1 line-through text-gray-500">${deal.regularPrice}</span>
              <span>Now </span>
              <span className="ml-1 font-bold text-primary">${deal.dealPrice}</span>
            </div>
          )}
        </div>
        
        {/* Title and view button */}
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium truncate max-w-[60%]">
            {deal.title || `${deal.brand} ${deal.drinkType}`}
          </h3>
          <Button
            variant="default"
            size="sm"
            onClick={handleViewDeal}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-1 rounded-lg text-sm"
          >
            {isGrayedOut ? "Unlock" : "View Deal"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
