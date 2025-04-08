import { useState, MouseEvent as ReactMouseEvent } from "react";
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
  
  // Get neon accent color based on drink type
  const getNeonColor = () => {
    const drinkType = deal.drinkType?.toLowerCase() || '';
    
    if (drinkType.includes('beer')) {
      return '#00ff00'; // Neon green for beer
    } else if (drinkType.includes('wine')) {
      return '#ff36b3'; // Neon pink for wine
    } else if (drinkType.includes('whisky') || drinkType.includes('whiskey')) {
      return '#ffaa00'; // Neon orange for whisky
    } else if (drinkType.includes('gin')) {
      return '#aa00ff'; // Neon purple for gin
    } else if (drinkType.includes('margarita')) {
      return '#00ff99'; // Neon green for margarita
    } else if (drinkType.includes('cocktail')) {
      return '#00ffff'; // Neon cyan for cocktails
    }
    
    // Default accent color
    return '#ff36b3'; // Neon pink default
  };
  
  // Get neon glow effect for the accent color
  const getNeonGlow = (color: string) => {
    return `0 0 5px ${color}, 0 0 10px ${color}, 0 0 15px ${color}`;
  };
  
  // All cards now have black background with subtle gradient
  const getCardBackground = () => {
    // Black gradient background for all cards
    const alpha = isGrayedOut ? 0.7 : 0.95;
    return `linear-gradient(to bottom, rgba(10,10,15,${alpha}) 0%, rgba(0,0,5,${alpha}) 100%)`;
  };

  // State to track if card is flipped
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Handle card click to flip
  const handleCardFlip = (e: ReactMouseEvent) => {
    e.stopPropagation();
    setIsFlipped(!isFlipped);
  };
  
  return (
    <div 
      className="perspective-1000 w-full h-full cursor-pointer" 
      onClick={handleCardFlip}
      style={{ perspective: '1000px' }}
    >
      <div 
        className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        style={{ 
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* Front of card */}
        <Card 
          className="h-full overflow-hidden relative rounded-xl backface-hidden" 
          style={{ 
            background: getCardBackground(),
            border: `1px solid ${getNeonColor()}`,
            boxShadow: `0 0 15px ${getNeonColor()}`,
            backfaceVisibility: 'hidden',
            position: 'absolute',
            width: '100%',
            height: '100%'
          }}
        >
          {/* Main content with neon style */}
          <div className="flex flex-col h-full">
            {/* Top deal information with neon colors */}
            <div className="p-4 pb-0 text-center relative">
              {/* Savings tag on top left corner */}
              <div className="absolute top-0 left-0 transform -translate-x-2 -translate-y-2 rotate-[-12deg] z-10">
                <div className="rounded-lg py-1 px-3 text-center text-sm font-bold" 
                  style={{ 
                    background: 'black',
                    color: getNeonColor(),
                    border: `1px solid ${getNeonColor()}`,
                    boxShadow: getNeonGlow(getNeonColor()),
                    textShadow: getNeonGlow(getNeonColor())
                  }}>
                  {deal.isOneForOne 
                    ? "1-FOR-1" 
                    : `${deal.savingsPercentage || 30}% OFF`}
                </div>
              </div>
              
              {/* Main price display */}
              {deal.isOneForOne ? (
                <h1 className="text-6xl font-bold mb-1" style={{ 
                  color: getNeonColor(), 
                  textShadow: getNeonGlow(getNeonColor())
                }}>
                  1FOR1
                </h1>
              ) : (
                <h1 className="text-6xl font-bold mb-1" style={{ 
                  color: getNeonColor(), 
                  textShadow: getNeonGlow(getNeonColor())
                }}>
                  ${deal.dealPrice}
                </h1>
              )}
              
              {/* Drink type */}
              <h2 className="uppercase text-2xl font-bold mb-4" style={{ 
                color: getNeonColor(), 
                textShadow: getNeonGlow(getNeonColor())
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
            
            {/* Time and distance info with icons */}
            <div className="px-4 pb-4 flex items-center justify-center space-x-4">
              <div className="flex items-center text-xs">
                <FiClock className="mr-1" style={{ color: getNeonColor() }} />
                <p style={{ color: 'white', fontWeight: 'bold', textShadow: '0 0 5px rgba(0,0,0,0.8)' }}>
                  {format(new Date(deal.startTime), 'h:mm a')} - {format(new Date(deal.endTime), 'h:mm a')}
                </p>
              </div>
              <div className="flex items-center text-xs">
                <FiMapPin className="mr-1" style={{ color: getNeonColor() }} />
                <p style={{ color: 'white', fontWeight: 'bold', textShadow: '0 0 5px rgba(0,0,0,0.8)' }}>
                  {distance ? `${distance.toFixed(1)} km` : 'nearby'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Status badge for active deals */}
          {status === 'active' && (
            <div 
              className="absolute top-2 right-2 text-xs px-2 py-1 rounded-full"
              style={{ 
                background: 'black',
                color: getNeonColor(),
                border: `1px solid ${getNeonColor()}`,
                boxShadow: getNeonGlow(getNeonColor())
              }}
            >
              Live
            </div>
          )}
          
          {/* Flip indicator */}
          <div 
            className="absolute bottom-2 right-2 text-xs px-2 py-1 rounded-full"
            style={{ 
              background: 'black',
              color: 'white',
              border: `1px solid ${getNeonColor()}30`
            }}
          >
            Tap for details
          </div>
        </Card>
        
        {/* Back of card - shows either restaurant details or upgrade prompt */}
        <Card 
          className="h-full overflow-hidden relative rounded-xl backface-hidden rotate-y-180" 
          style={{ 
            background: getCardBackground(),
            border: `1px solid ${getNeonColor()}`,
            boxShadow: `0 0 10px ${getNeonColor()}`,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            position: 'absolute',
            width: '100%',
            height: '100%'
          }}
        >
          {isGrayedOut ? (
            // Back for non-premium users - upgrade prompt
            <div className="flex flex-col h-full items-center justify-center text-center p-6 space-y-4">
              <div className="bg-black p-5 rounded-full mb-4 border" style={{ borderColor: getNeonColor() }}>
                <FiLock 
                  className="h-12 w-12" 
                  style={{ 
                    color: getNeonColor(),
                    filter: `drop-shadow(0 0 8px ${getNeonColor()})` 
                  }} 
                />
              </div>
              <h3 
                className="text-2xl font-bold" 
                style={{ 
                  color: getNeonColor(),
                  textShadow: getNeonGlow(getNeonColor())
                }}
              >
                {!user ? "Sign In Required" : "Premium Deal"}
              </h3>
              <p className="text-white text-sm mb-4" style={{ textShadow: '0 0 5px rgba(0,0,0,0.8)' }}>
                {!user 
                  ? "Sign in to view this exclusive deal" 
                  : "Upgrade to premium to unlock all deals and save more"}
              </p>
              <Button
                variant="default"
                onClick={(e: ReactMouseEvent) => {
                  e.stopPropagation();
                  handleViewDeal();
                }}
                className="w-full text-white"
                style={{ 
                  backgroundColor: 'black',
                  color: getNeonColor(),
                  border: `1px solid ${getNeonColor()}`,
                  boxShadow: getNeonGlow(getNeonColor())
                }}
              >
                {!user ? "Sign In Now" : "Upgrade Now"}
              </Button>
            </div>
          ) : (
            // Back for premium users - restaurant details
            <div className="flex flex-col h-full p-4">
              {/* Restaurant header */}
              <div className="flex items-center mb-4 pb-2 border-b" style={{ borderColor: `${getNeonColor()}40` }}>
                {/* Restaurant logo */}
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mr-4"
                  style={{ 
                    background: 'black',
                    border: `1px solid ${getNeonColor()}`,
                    boxShadow: getNeonGlow(getNeonColor())
                  }}
                >
                  🍽️
                </div>
                <div>
                  <h3 
                    className="text-lg font-bold"
                    style={{ 
                      color: getNeonColor(),
                      textShadow: getNeonGlow(getNeonColor())
                    }}
                  >
                    {deal.establishment.name}
                  </h3>
                  <p className="text-white/80 text-xs">{deal.establishment.type || "Bar & Restaurant"}</p>
                </div>
              </div>
              
              {/* Deal details */}
              <div className="flex-grow space-y-3">
                <div className="flex items-center text-white text-sm">
                  <FiClock className="mr-2" style={{ color: getNeonColor() }} />
                  <p>{getTimeDisplay()}</p>
                </div>
                <div className="flex items-center text-white text-sm">
                  <FiMapPin className="mr-2" style={{ color: getNeonColor() }} />
                  <p>{distance ? `${distance.toFixed(1)} km • ${getWalkingTime()}` : 'Distance unknown'}</p>
                </div>
                <div className="flex items-center text-white text-sm">
                  <FiStar className="mr-2" style={{ color: getNeonColor() }} />
                  <p>{deal.establishment.rating || '4.5'} rating</p>
                </div>
                
                <div 
                  className="p-3 rounded-lg mt-4"
                  style={{ 
                    background: 'rgba(0,0,0,0.5)',
                    border: `1px solid ${getNeonColor()}40`
                  }}
                >
                  <p className="text-white text-sm">{deal.description || `Enjoy ${deal.drinkType} specials at this popular venue!`}</p>
                </div>
              </div>
              
              {/* Actions */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={(e: ReactMouseEvent) => {
                    e.stopPropagation();
                    handleSaveOrRemind();
                  }}
                  className="text-white hover:bg-black/30"
                  style={{ 
                    borderColor: getNeonColor(),
                    color: getNeonColor()
                  }}
                >
                  Save Deal
                </Button>
                <Button
                  variant="default"
                  onClick={(e: ReactMouseEvent) => {
                    e.stopPropagation();
                    handleViewDeal();
                  }}
                  className="text-white"
                  style={{ 
                    backgroundColor: 'black',
                    color: getNeonColor(),
                    border: `1px solid ${getNeonColor()}`,
                    boxShadow: getNeonGlow(getNeonColor())
                  }}
                >
                  View Deal
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
