/**
 * Recommendation Engine
 * 
 * This module provides utilities for generating deal recommendations
 * based on user preferences, location, and deal popularity metrics.
 */

// Define interfaces locally to avoid import issues
interface Deal {
  id?: number;
  establishmentId?: number;
  alcohol_category?: string;
  alcohol_subcategory?: string;
  drink_name?: string;
  standard_price?: number;
  happy_hour_price?: number;
  savings?: number;
  savings_percentage?: number;
  valid_days?: string;
  hh_start_time?: string;
  hh_end_time?: string;
  isActive?: boolean;
  establishment?: Establishment;
}

interface Establishment {
  id?: number;
  name?: string;
  latitude?: number;
  longitude?: number;
  activeDeals?: Deal[];
}

// Function to score and sort deals based on various factors
export function getRecommendedDeals(
  deals: Deal[],
  userLocation?: { lat: number; lng: number },
  userPreferences?: {
    favoriteDrinkTypes?: string[];
    priceRange?: { min: number; max: number };
    maxDistance?: number;
  }
): Deal[] {
  if (!deals || deals.length === 0) return [];
  
  // Create a copy of deals to avoid mutation
  const scoredDeals = [...deals].map(deal => {
    let score = 100; // Base score
    
    // Factor 1: Price discount percentage (higher = better)
    if (deal.savings_percentage) {
      score += deal.savings_percentage * 2; // Weight of 2x
    }
    
    // Factor 2: Distance if user location is provided
    if (userLocation && deal.establishment?.latitude && deal.establishment?.longitude) {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        deal.establishment.latitude,
        deal.establishment.longitude
      );
      
      // Distance penalty: -5 points per km
      if (distance > 0) {
        score -= Math.min(50, distance * 5); // Cap at -50 points
      }
    }
    
    // Factor 3: User drink preferences
    if (userPreferences?.favoriteDrinkTypes && userPreferences.favoriteDrinkTypes.length > 0) {
      const drinkType = deal.alcohol_category?.toLowerCase() || '';
      const drinkSubType = deal.alcohol_subcategory?.toLowerCase() || '';
      
      const isPreferred = userPreferences.favoriteDrinkTypes.some(pref => {
        const prefLower = pref.toLowerCase();
        return drinkType.includes(prefLower) || drinkSubType.includes(prefLower);
      });
      
      if (isPreferred) {
        score += 30; // Preference bonus
      }
    }
    
    // Factor 4: Price range preferences
    if (userPreferences?.priceRange) {
      const { min, max } = userPreferences.priceRange;
      const price = deal.happy_hour_price;
      
      if (price < min) {
        // Too cheap - slight penalty
        score -= 10;
      } else if (price > max) {
        // Too expensive - significant penalty
        score -= 30;
      } else {
        // Within range - bonus
        score += 20;
      }
    }
    
    // Return the original deal with an added score
    return { ...deal, _score: score };
  });
  
  // Sort by score descending
  return scoredDeals
    .sort((a: any, b: any) => b._score - a._score)
    .map(deal => {
      // Remove the temporary score property
      const { _score, ...cleanDeal } = deal;
      return cleanDeal as Deal;
    });
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

// Calculate deal popularity based on various factors
export function calculateDealPopularity(deal: Deal): number {
  let popularity = 0;
  
  // Factor 1: Savings percentage
  if (deal.savings_percentage) {
    popularity += Math.min(5, Math.floor(deal.savings_percentage / 10));
  }
  
  // Factor 2: Deal price point (mid-range deals tend to be more popular)
  const price = deal.happy_hour_price || 0;
  if (price < 5) popularity += 1;
  else if (price < 10) popularity += 3;
  else if (price < 15) popularity += 4;
  else if (price < 20) popularity += 3;
  else if (price < 30) popularity += 2;
  else popularity += 1;
  
  // Cap at 10
  return Math.min(10, popularity);
}

// Generate establishments with popular happy hours nearby
export function getPopularEstablishmentsNearby(
  establishments: Establishment[],
  userLocation: { lat: number; lng: number },
  radius: number = 5 // km
): Establishment[] {
  if (!establishments || establishments.length === 0 || !userLocation) return [];
  
  // Filter establishments by radius
  const nearbyEstablishments = establishments.filter(est => {
    if (!est.latitude || !est.longitude) return false;
    
    const distance = calculateDistance(
      userLocation.lat, 
      userLocation.lng,
      est.latitude,
      est.longitude
    );
    
    return distance <= radius;
  });
  
  // Sort by active deals count (descending)
  return nearbyEstablishments.sort((a, b) => {
    const aDeals = a.activeDeals?.length || 0;
    const bDeals = b.activeDeals?.length || 0;
    return bDeals - aDeals;
  });
}