import { useMemo } from "react";
import { FiClock, FiMapPin } from "react-icons/fi";
import { Card } from "@/components/ui/card";
import { calculateDistance } from "@/lib/location-utils";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { isWithinHappyHour } from "@/lib/time-utils";
import { useDrinkImage } from "@/hooks/use-drink-images";

// Get a color for a drink category, used for creating reliable fallback images
function getCategoryColor(category: string): string {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('beer') || lowerCategory.includes('pint')) {
    return '%23D4A017'; // Amber/gold for beer
  } else if (lowerCategory.includes('wine')) {
    return '%23800000'; // Burgundy for wine
  } else if (lowerCategory.includes('cocktail')) {
    return '%234863A0'; // Blue for cocktails
  } else if (lowerCategory.includes('whisky')) {
    return '%23C35817'; // Whisky brown
  } else if (lowerCategory.includes('vodka') || lowerCategory.includes('gin')) {
    return '%23C0C0C0'; // Silver for clear spirits
  } else if (lowerCategory.includes('rum')) {
    return '%23C68E17'; // Dark rum color
  } else {
    return '%233090C7'; // Default blue
  }
}

// Create a data URL SVG that will work everywhere as final fallback
function createFallbackSvg(category: string): string {
  const bgcolor = getCategoryColor(category);
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='${bgcolor}'/%3E%3C/svg%3E`;
}

interface SquareDealCardProps {
  deal: any;
  userLocation?: { lat: number; lng: number };
}

export default function SquareDealCard({ deal, userLocation }: SquareDealCardProps) {
  // Use wouter's useLocation for navigation
  const [, setLocation] = useLocation();
  
  // Calculate the distance between the user and the establishment using Haversine formula
  const distance = useMemo(() => {
    // Get coordinates from deal and user
    const establishmentId = deal.establishmentId || (deal.establishment && deal.establishment.id);
    const establishmentLat = deal.establishment?.latitude;
    const establishmentLng = deal.establishment?.longitude;
    
    if (establishmentLat && establishmentLng && userLocation) {
      // Use the actual Haversine distance calculation
      const distanceKm = calculateDistance(
        userLocation.lat, 
        userLocation.lng, 
        establishmentLat, 
        establishmentLng
      );
      
      // Format distance string
      return distanceKm < 1 
        ? `${Math.round(distanceKm * 1000)}m` 
        : `${distanceKm.toFixed(1).replace(/\.0$/, '')}km`;
    }
    return null;
  }, [deal, userLocation]);
  
  // Calculate the savings percentage or special offer type
  const savingsInfo = useMemo(() => {
    // Check for collections that indicate 1-for-1
    if (deal.collections && deal.collections.includes('one_for_one_deals')) {
      return "1-for-1";
    }
    
    // Use savings_percentage directly if available
    if (deal.savings_percentage) {
      return `${Math.round(deal.savings_percentage)}% off`;
    }
    
    // Calculate from regularPrice and dealPrice as fallback
    if (deal.regularPrice && deal.dealPrice && deal.regularPrice > deal.dealPrice) {
      const savings = Math.round(((deal.regularPrice - deal.dealPrice) / deal.regularPrice) * 100);
      return `${savings}% off`;
    }
    
    return "Special Offer";
  }, [deal]);

  // Format the price display separately for current and standard price
  const { currentPrice, originalPrice, dealHeadline } = useMemo(() => {
    const happyHourPrice = deal.happy_hour_price || deal.dealPrice;
    const standardPrice = deal.standard_price || deal.regularPrice;
    const drinkName = deal.drink_name || '';
    
    // Ensure we're using the correct format that matches what's shown on the screen
    // Create a headline that includes both price and drink name in white text
    return {
      currentPrice: happyHourPrice ? `$${happyHourPrice}` : 'Special Price',
      originalPrice: standardPrice ? `$${standardPrice}` : null,
      // Combined headline in white text only - no separate styling
      dealHeadline: drinkName ? `$${happyHourPrice} ${drinkName}` : `$${happyHourPrice}`,
    };
  }, [deal]);

  // Get the Cloudinary image URL for this drink
  const { imageUrl } = useDrinkImage(deal.drink_name, deal.alcohol_category);

  // Handle click to navigate to establishment details
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Square card clicked! Deal:", deal);
    
    if (deal.establishmentId || (deal.establishment && deal.establishment.id)) {
      // Use either direct establishmentId or id from establishment object
      const establishmentId = deal.establishmentId || deal.establishment.id;
      console.log("Navigating to establishment:", `/establishments/${establishmentId}`);
      setLocation(`/establishments/${establishmentId}`);
    } else {
      console.error("No establishment ID found to navigate to in square-deal-card!");
    }
  };

  // Determine establishment ID for the link
  const establishmentId = deal.establishmentId || (deal.establishment && deal.establishment.id);
  
  // Animation variants
  const cardVariants = {
    hidden: { 
      opacity: 0,
      y: 50,
      scale: 0.95
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { 
        type: "spring",
        duration: 0.5
      }
    },
    hover: { 
      y: -10,
      scale: 1.05,
      boxShadow: "0px 10px 20px rgba(0,0,0,0.15)",
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 17
      }
    },
    tap: { 
      scale: 0.98,
      boxShadow: "0px 5px 10px rgba(0,0,0,0.1)",
      transition: { 
        type: "spring", 
        stiffness: 500
      }
    }
  };

  const badgeVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        delay: 0.2,
        duration: 0.3,
        type: "spring" 
      }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        delay: 0.1,
        duration: 0.4
      }
    }
  };

  return (
    <div className="w-full h-full">
      <a 
        href={`/establishments/${establishmentId}`}
        onClick={handleCardClick}
        className="block text-inherit no-underline h-full"
      >
        <motion.div
          className="h-full"
          initial="hidden"
          animate="visible"
          whileHover="hover"
          whileTap="tap"
          variants={cardVariants}
        >
          <Card className="overflow-hidden h-full rounded-xl cursor-pointer">
            <div className="relative h-full">
              {/* Deal image from Cloudinary */}
              <img 
                src={`${deal.imageUrl || imageUrl || `/images/defaults/drink-default.jpg`}?v=${Date.now()}`} 
                alt={deal.drink_name || deal.alcohol_category || 'Happy Hour Deal'} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.log(`Square card image load error for ${deal.drink_name || deal.alcohol_category}, trying SVG fallback`);
                  
                  // Create a multi-step fallback system
                  const tryFallbacks = async () => {
                    try {
                      // Step 1: Try SVG image from the assets folder based on category
                      const drinkName = deal.drink_name || deal.alcohol_category;
                      const category = deal.alcohol_category?.toLowerCase() || '';
                      
                      // Import local SVG assets dynamically instead of Cloudinary
                      const { images, getBrandImage, getBackgroundImage } = await import('@/assets/images');
                      
                      // Map the category to available SVG files
                      let svgCategory = 'beer'; // Default
                      if (category.includes('wine')) {
                        svgCategory = 'wine';
                      } else if (category.includes('cocktail')) {
                        svgCategory = 'cocktail';
                      } else if (['whisky', 'gin', 'vodka', 'rum'].some(s => category.includes(s))) {
                        svgCategory = category.includes('whisky') ? 'whisky' : 'spirits';
                      } else if (category.includes('beer') || category.includes('pint')) {
                        svgCategory = 'beer';
                      }
                      
                      // Choose an appropriate SVG (background image shows better in square card)
                      const svgImage = getBackgroundImage(svgCategory);
                      
                      // Use a cache-busting timestamp to avoid caching issues
                      e.currentTarget.src = `${svgImage}?v=${Date.now()}`;
                      
                      // If the SVG fails, try known Cloudinary images as a last resort
                      e.currentTarget.onerror = async () => {
                        console.log(`SVG fallback failed for ${drinkName}, trying only verified Cloudinary images`);
                        try {
                          // Step 2: Try Cloudinary with only verified images
                          const { getRandomDrinkImageUrl } = await import('@/lib/cloudinary-utils');
                          
                          // Only try the specific known drinks that are confirmed to work
                          let cloudinaryCategory = '';
                          if (drinkName?.toLowerCase().includes('heineken pint')) cloudinaryCategory = 'heineken pint';
                          else if (category.includes('wine')) cloudinaryCategory = 'red wine';
                          else if (drinkName?.toLowerCase().includes('margarita')) cloudinaryCategory = 'margarita';
                          else if (drinkName?.toLowerCase().includes('negroni')) cloudinaryCategory = 'negroni';
                          
                          if (cloudinaryCategory) {
                            const imageUrl = getRandomDrinkImageUrl(cloudinaryCategory);
                            // Add a cache buster to the URL
                            e.currentTarget.src = `${imageUrl}?v=${Date.now()}`;
                            
                            // Final fallback to default SVG
                            e.currentTarget.onerror = () => {
                              console.log('All dynamic images failed, using data URL SVG fallback');
                              e.currentTarget.src = createFallbackSvg(category || 'beer');
                              e.currentTarget.onerror = null; // Prevent infinite loop
                            };
                          } else {
                            // Skip to final default if no specific category matches
                            console.log('No matching Cloudinary category, using data URL SVG fallback');
                            e.currentTarget.src = createFallbackSvg(category || 'beer');
                            e.currentTarget.onerror = null; // Prevent infinite loop
                          }
                        } catch (err) {
                          console.error('Error in square card Cloudinary fallback chain:', err);
                          // Final fallback to beer background SVG if everything else fails
                          try {
                            e.currentTarget.src = createFallbackSvg(category || 'beer');
                            e.currentTarget.onerror = null; // Prevent infinite loop
                          } catch (innerErr) {
                            console.error('Critical error in all square card fallbacks', innerErr);
                          }
                        }
                      };
                    } catch (err) {
                      console.error('Failed in initial square card fallback chain:', err);
                      // Emergency fallback if all else fails
                      try {
                        const category = deal.alcohol_category?.toLowerCase() || 'beer';
                        e.currentTarget.src = createFallbackSvg(category);
                        e.currentTarget.onerror = null; // Prevent infinite loop
                      } catch (finalErr) {
                        console.error('Critical fallback error:', finalErr);
                      }
                    }
                  };
                  
                  tryFallbacks();
                }}
              />
              
              {/* Status indicator (green for active, red for inactive) */}
              <motion.div 
                className={`absolute top-2 left-2 w-3 h-3 rounded-full ${isWithinHappyHour(deal) ? 'bg-green-500' : 'bg-red-500'} shadow-md`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  boxShadow: isWithinHappyHour(deal) 
                    ? '0 0 6px 1px rgba(16, 185, 129, 0.7)' 
                    : '0 0 6px 1px rgba(239, 68, 68, 0.7)'
                }}
                transition={{ delay: 0.3, duration: 0.3 }}
              />
              
              {/* Savings badge */}
              <motion.div 
                className="absolute top-2 right-2 bg-primary text-white px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                variants={badgeVariants}
              >
                {savingsInfo}
              </motion.div>
              
              {/* Overlay with all information - covering 45% of the card from bottom */}
              <motion.div 
                className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-black via-black/80 to-transparent px-3 py-3"
                variants={contentVariants}
              >
                {/* Deal headline using Fredoka One font - extra bold */}
                <h2 className="font-['Fredoka_One'] text-sm text-white leading-tight mb-1.5 line-clamp-1 truncate">
                  {dealHeadline}
                </h2>
                
                {/* Restaurant name - Manrope font */}
                <h3 className="font-['Manrope'] text-xs text-white/95 line-clamp-1 border-t border-white/20 pt-1.5 mb-1">
                  {deal.establishment?.name || 'Restaurant Name'}
                </h3>
                
                {/* Time and distance with Manrope font */}
                <div className="flex items-center justify-between text-[10px] text-white font-['Manrope']">
                  {/* Happy hour time */}
                  <div className="flex items-center">
                    <FiClock className="h-3 w-3 mr-0.5 text-white" />
                    <span className="text-white">{deal.hh_start_time?.substring(0, 5)} - {deal.hh_end_time?.substring(0, 5)}</span>
                  </div>
                  
                  {/* Distance */}
                  {distance && (
                    <div className="flex items-center">
                      <FiMapPin className="h-3 w-3 mr-0.5 text-white" />
                      <span className="text-white">{distance}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </a>
    </div>
  );
}