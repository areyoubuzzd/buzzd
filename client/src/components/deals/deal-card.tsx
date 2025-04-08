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

  // Get drink image based on drink type with more reliable images
  const getDrinkImage = () => {
    // Use deal.imageUrl if available
    if (deal.imageUrl) return deal.imageUrl;
    
    const drinkType = deal.drinkType?.toLowerCase() || '';
    const brand = deal.brand?.toLowerCase() || '';
    
    // Use reliable, fixed image URLs for each drink type
    if (drinkType.includes('beer')) {
      return 'https://images.unsplash.com/photo-1618183479302-1e0aa382c36b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTJ8fGJlZXJ8ZW58MHx8MHx8&auto=format&fit=crop&w=600&q=60';
    }
    if (drinkType.includes('wine')) {
      return 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8d2luZXxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=600&q=60';
    }
    if (drinkType.includes('whisky') || drinkType.includes('whiskey')) {
      return 'https://images.unsplash.com/photo-1527281400683-1aefee6bfcab?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NXx8d2hpc2t5fGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=600&q=60';
    }
    if (drinkType.includes('gin')) {
      return 'https://images.unsplash.com/photo-1514362453360-8f2f743c3d9c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8Z2lufGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=600&q=60';
    }
    if (drinkType.includes('cocktail')) {
      return 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8Y29ja3RhaWx8ZW58MHx8MHx8&auto=format&fit=crop&w=600&q=60';
    }
    
    // Fallback image for other drink types
    return 'https://images.unsplash.com/photo-1587212805519-47f396aa39a7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NXx8ZHJpbmtzfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=600&q=60';
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
  
  // Get the drink type name for the card
  const getDrinkTypeName = () => {
    const drinkType = deal.drinkType?.toLowerCase() || '';
    if (drinkType.includes('beer')) return 'BEER';
    if (drinkType.includes('wine')) return 'WINE';
    if (drinkType.includes('whisky') || drinkType.includes('whiskey')) return 'WHISKY';
    if (drinkType.includes('gin')) return 'GIN';
    if (drinkType.includes('cocktail')) return 'COCKTAIL';
    if (drinkType.includes('margarita')) return 'MARGARITA';
    return 'DRINK';
  };
  
  // Get background color based on drink type
  const getCardBackground = () => {
    const drinkType = deal.drinkType?.toLowerCase() || '';
    
    if (drinkType.includes('beer')) {
      return 'linear-gradient(to bottom, rgba(0,30,0,0.9) 0%, rgba(0,50,0,0.95) 100%)';
    } else if (drinkType.includes('wine')) {
      return 'linear-gradient(to bottom, rgba(60,0,30,0.9) 0%, rgba(80,0,50,0.95) 100%)';
    } else if (drinkType.includes('whisky') || drinkType.includes('whiskey')) {
      return 'linear-gradient(to bottom, rgba(50,25,0,0.9) 0%, rgba(70,40,0,0.95) 100%)';
    } else if (drinkType.includes('gin')) {
      return 'linear-gradient(to bottom, rgba(20,0,50,0.9) 0%, rgba(40,0,80,0.95) 100%)';
    } else if (drinkType.includes('cocktail') || drinkType.includes('margarita')) {
      return 'linear-gradient(to bottom, rgba(0,40,40,0.9) 0%, rgba(0,60,60,0.95) 100%)';
    }
    
    // Default background
    return 'linear-gradient(to bottom, rgba(20,20,40,0.9) 0%, rgba(40,40,70,0.95) 100%)';
  };

  return (
    <Card className={`h-full overflow-hidden relative rounded-xl ${
      isGrayedOut ? 'opacity-70' : ''
    }`} style={{ 
      background: getCardBackground(),
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 0 15px rgba(255, 105, 180, 0.3)' 
    }}>
      {/* Main content with neon style */}
      <div className="flex flex-col h-full">
        {/* Top deal information */}
        <div className="p-4 pb-0 text-center">
          {deal.isOneForOne ? (
            <h1 className="text-6xl font-bold mb-1" style={{ 
              color: '#ff4ddb', 
              textShadow: '0 0 10px rgba(255, 77, 219, 0.7)' 
            }}>
              1FOR1
            </h1>
          ) : (
            <h1 className="text-6xl font-bold mb-1" style={{ 
              color: '#ff4ddb', 
              textShadow: '0 0 10px rgba(255, 77, 219, 0.7)' 
            }}>
              ${deal.dealPrice}
            </h1>
          )}
          
          <h2 className="uppercase text-2xl font-bold mb-4" style={{ 
            color: '#ff4ddb', 
            textShadow: '0 0 5px rgba(255, 77, 219, 0.5)' 
          }}>
            {getDrinkTypeName()}
          </h2>
        </div>
        
        {/* Drink image - centered */}
        <div className="flex-grow flex items-center justify-center px-4 py-2">
          <img 
            src={getDrinkImage()} 
            alt={deal.title || "Drink special"} 
            className="max-h-44 object-contain" 
          />
        </div>
        
        {/* Bottom discount badge */}
        <div className="mx-4 mb-3 rounded-lg py-2 px-2 text-center font-bold" 
          style={{ 
            background: '#ffdd00', 
            color: '#000000',
            boxShadow: '0 0 10px rgba(255, 221, 0, 0.6)'
          }}>
          {deal.isOneForOne 
            ? "30% OFF" 
            : `${deal.savingsPercentage || 30}% OFF`}
        </div>
        
        {/* Restaurant and time info */}
        <div className="px-4 pb-4 text-center text-white text-xs">
          {!isGrayedOut ? (
            <p>UNTIL {format(new Date(deal.endTime), 'h a')} • {distance ? `${(distance * 1000).toFixed(0)}m` : 'nearby'}</p>
          ) : (
            <div className="flex items-center justify-center gap-1">
              <FiLock className="h-3 w-3" />
              <p>{!user ? "SIGN IN" : "UPGRADE"} TO VIEW</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Status badge for active deals */}
      {status === 'active' && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
          Live
        </div>
      )}
      
      {/* Premium lock overlay */}
      {isGrayedOut && (
        <div 
          className="absolute inset-0 flex items-center justify-center" 
          style={{ 
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(2px)' 
          }}
          onClick={handleViewDeal}
        >
          <div className="bg-black bg-opacity-70 p-3 rounded-full">
            <FiLock 
              className="h-6 w-6 text-white" 
              style={{ filter: 'drop-shadow(0 0 8px rgba(255, 105, 180, 0.8))' }} 
            />
          </div>
        </div>
      )}
    </Card>
  );
}
