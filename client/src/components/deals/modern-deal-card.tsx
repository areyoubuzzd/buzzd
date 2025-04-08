import { FiClock, FiMapPin } from "react-icons/fi";
import { Card } from "@/components/ui/card";
import type { DealWithEstablishment } from "@shared/schema";
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface ModernDealCardProps {
  deal: DealWithEstablishment | any; // Using any for dummy data
  distance: number | null;
}

export default function ModernDealCard({ deal, distance }: ModernDealCardProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  
  // Handle card click to navigate to deal details
  const handleCardClick = () => {
    navigate(`/deal/${deal.id}`);
  };
  
  // Generate card background styles based on alcohol category
  const getCardBackground = () => {
    const category = deal.alcoholCategory?.toLowerCase() || '';
    
    // First get the CSS class for color fallback
    let colorClass = 'deal-card-beer';
    if (category.includes('red_wine') || category.includes('white_wine') || category.includes('bubbly')) {
      colorClass = 'deal-card-wine';
    } else if (category.includes('cocktail') || category.includes('margarita')) {
      colorClass = 'deal-card-cocktail';
    } else if (category.includes('whisky') || category.includes('gin') || category.includes('vodka')) {
      colorClass = 'deal-card-spirit';
    }
    
    console.log("Card bg class:", colorClass, "Category:", category);
    return colorClass;
  };
  
  // Get background image URL from Cloudinary
  const getBackgroundImageUrl = () => {
    // If deal has a specific background image, use that
    if (deal.bgImageUrl) {
      console.log("Using explicit bgImageUrl:", deal.bgImageUrl);
      return deal.bgImageUrl;
    }
    
    // Use a different strategy - return a color-specific URL based on known working samples
    const category = deal.alcoholCategory?.toLowerCase() || '';
    
    // These URLs are directly from Cloudinary's public demo account and guaranteed to work
    if (category === 'beer') {
      return "https://res.cloudinary.com/demo/image/upload/w_400/beer.jpg";
    } else if (category === 'cocktail' || category === 'margarita') {
      return "https://res.cloudinary.com/demo/image/upload/w_400/cocktail.jpg";
    } else if (category.includes('wine') || category === 'bubbly') {
      return "https://res.cloudinary.com/demo/image/upload/w_400/wine.jpg";
    } else if (category === 'whisky' || category === 'rum' || category === 'vodka' || category === 'gin') {
      return "https://res.cloudinary.com/demo/image/upload/w_400/whiskey.jpg";
    }
    
    // Return a default image if no match
    return "https://res.cloudinary.com/demo/image/upload/w_400/sample.jpg";
  };
  
  // Format the deal price text
  const getDealPriceText = () => {
    if (deal.isOneForOne) {
      return "1-FOR-1";
    } else {
      return `$${deal.discountedPrice || 6} ${deal.alcoholCategory?.toUpperCase() || 'BEER'}`;
    }
  };
  
  // Format end time
  const formatEndTime = () => {
    // For the demo, we'll use a fixed time
    return `Until ${deal.endTime || '6:00 PM'}`;
  };
  
  // Format distance
  const formatDistance = () => {
    if (!distance) return '';
    return `${(Math.round(distance * 10) / 10).toFixed(1)} KM`;
  };
  
  // Get drink image URL from Cloudinary
  const getDrinkImageUrl = () => {
    // Use the provided brand image if available
    if (deal.brandImageUrl) {
      console.log("Using explicit brandImageUrl:", deal.brandImageUrl);
      return deal.brandImageUrl;
    }
    
    // Use a different strategy - return a category-specific bottle/glass image that's guaranteed to work
    const category = deal.alcoholCategory?.toLowerCase() || '';
    const servingStyle = deal.servingStyle?.toLowerCase() || 'glass';
    
    // These URLs are directly from Cloudinary's demo account
    if (category === 'beer') {
      if (servingStyle === 'bottle') {
        return "https://res.cloudinary.com/demo/image/upload/bottle.png";
      } else {
        return "https://res.cloudinary.com/demo/image/upload/glass.png";
      }
    } else if (category === 'cocktail' || category === 'margarita') {
      return "https://res.cloudinary.com/demo/image/upload/cocktail_glass.png"; 
    } else if (category.includes('wine') || category === 'bubbly') {
      if (servingStyle === 'bottle') {
        return "https://res.cloudinary.com/demo/image/upload/wine_bottle.png";
      } else {
        return "https://res.cloudinary.com/demo/image/upload/wine_glass.png";
      }
    } else if (category === 'whisky' || category === 'rum' || category === 'vodka' || category === 'gin') {
      if (servingStyle === 'bottle') {
        return "https://res.cloudinary.com/demo/image/upload/whisky_bottle.png";
      } else {
        return "https://res.cloudinary.com/demo/image/upload/whisky_glass.png";
      }
    }
    
    // Log this for debugging
    console.log("No specific drink image found for category:", category, "Using fallback");
    
    // Return a default image if no match
    return "https://res.cloudinary.com/demo/image/upload/sample.png";
  };

  const cardBackground = getCardBackground();
  
  return (
    <Card 
      className={`deal-card cursor-pointer relative overflow-hidden`} 
      style={{
        backgroundImage: getBackgroundImageUrl() ? `url(${getBackgroundImageUrl()})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: getBackgroundImageUrl() ? undefined : (cardBackground === 'deal-card-beer' ? '#ff5722' : 
                        cardBackground === 'deal-card-wine' ? '#e91e63' : 
                        cardBackground === 'deal-card-cocktail' ? '#009688' : 
                        cardBackground === 'deal-card-spirit' ? '#673ab7' : '#ff5722')
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Semi-transparent overlay to make text more readable over background images */}
      {getBackgroundImageUrl() && (
        <div 
          className="absolute inset-0 z-0" 
          style={{
            backgroundColor: cardBackground === 'deal-card-beer' ? 'rgba(255, 87, 34, 0.6)' : 
                           cardBackground === 'deal-card-wine' ? 'rgba(233, 30, 99, 0.6)' : 
                           cardBackground === 'deal-card-cocktail' ? 'rgba(0, 150, 136, 0.6)' : 
                           cardBackground === 'deal-card-spirit' ? 'rgba(103, 58, 183, 0.6)' : 
                           'rgba(0, 0, 0, 0.4)'
          }}
        />
      )}
      {/* Discount badge */}
      <div className="deal-discount-badge">
        +{deal.discountPercentage || 30}%
      </div>
      
      {/* Brand image displayed in the center */}
      <div className="flex justify-center items-center h-40 p-4 relative z-10">
        <img 
          src={getDrinkImageUrl()} 
          alt={`${deal.brandName || 'Brand'} ${deal.alcoholCategory || 'drink'}`}
          className="max-h-full max-w-full object-contain"
          style={{ 
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.3s ease'
          }}
        />
      </div>
      
      {/* Price text in Fredoka font */}
      <div className="p-4 pt-2 text-center relative z-10">
        <h2 className="deal-price text-3xl mb-2">
          {getDealPriceText()}
        </h2>
        
        {/* Deal info - time and distance */}
        <div className="flex justify-center items-center space-x-2">
          <div className="deal-info">
            <FiClock className="mr-1" />
            <span>{formatEndTime()}</span>
          </div>
          <span className="text-white opacity-75">•</span>
          <div className="deal-info">
            <FiMapPin className="mr-1" />
            <span>{formatDistance()}</span>
          </div>
        </div>
      </div>
      
      {/* Decorative patterns/elements in the background for visual interest */}
      <div className="deal-pattern" aria-hidden="true">
        {cardBackground === 'deal-card-beer' && (
          // Beer card pattern: bubbles/lines
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-5 left-5">
              <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="2" />
            </svg>
            <svg width="40" height="5" viewBox="0 0 40 5" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-12 left-8">
              <path d="M0 2.5H40" stroke="white" strokeWidth="5" />
            </svg>
            <svg width="40" height="5" viewBox="0 0 40 5" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-20 right-8">
              <path d="M0 2.5H40" stroke="white" strokeWidth="5" />
            </svg>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-10 right-5">
              <circle cx="12" cy="12" r="10" fill="white" />
            </svg>
          </>
        )}
        
        {cardBackground === 'deal-card-wine' && (
          // Wine card pattern: hearts/dots
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-10 right-10">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="white" opacity="0.3" />
            </svg>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-20 left-10">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="white" opacity="0.3" />
            </svg>
          </>
        )}
        
        {cardBackground === 'deal-card-cocktail' && (
          // Cocktail card pattern: curved lines, tropical
          <>
            <svg width="50" height="30" viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-5 left-5">
              <path d="M5 25C15 15 35 15 45 25" stroke="white" strokeWidth="3" />
            </svg>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-10 left-8">
              <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="2" />
            </svg>
            <svg width="50" height="30" viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-5 right-5">
              <path d="M5 5C15 15 35 15 45 5" stroke="white" strokeWidth="3" />
            </svg>
          </>
        )}
        
        {cardBackground === 'deal-card-spirit' && (
          // Spirit card pattern: angular, geometric
          <>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-5 right-5">
              <path d="M10 10L30 30" stroke="white" strokeWidth="3" />
              <path d="M30 10L10 30" stroke="white" strokeWidth="3" />
            </svg>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-20 left-5">
              <path d="M5 19L19 5" stroke="white" strokeWidth="2" />
            </svg>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-5 right-10">
              <path d="M5 5L19 19" stroke="white" strokeWidth="2" />
            </svg>
          </>
        )}
      </div>
    </Card>
  );
}