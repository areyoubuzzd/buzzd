/**
 * Recommendation Engine for personalized deal suggestions
 * This engine uses various factors to personalize deals for users:
 * - Location proximity
 * - User preferences (drink types, price ranges)
 * - Deal popularity
 * - Time of day and active status
 * - Past interactions (if available)
 */

import { Deal, Establishment } from '@/types/api-types';

// Weights for different recommendation factors
const WEIGHTS = {
  DISTANCE: 0.35,       // Distance from user
  PRICE: 0.20,          // Deal price factor
  ACTIVE_STATUS: 0.25,  // Whether the deal is currently active
  POPULARITY: 0.10,     // Deal popularity (to be implemented)
  PREFERENCE_MATCH: 0.10 // Match to user preferences
};

// Distance buckets (in km)
const DISTANCE_BUCKETS = {
  VERY_CLOSE: 1,  // < 1km
  CLOSE: 3,       // < 3km
  MEDIUM: 5,      // < 5km
  FAR: 10         // < 10km
};

// Deal categories to track for user preferences
export type DrinkCategory = 
  | 'Beer' 
  | 'Wine / Spirits' 
  | 'Cocktail'
  | 'Food';

// Price ranges to track for user preferences
export type PriceRange = 
  | 'under_10' 
  | '10_to_15' 
  | '15_to_20'
  | 'above_20';

// User preference model
export interface UserPreferences {
  favoriteCategories: {
    [key in DrinkCategory]?: number; // Preference score 0-10
  };
  pricePreferences: {
    [key in PriceRange]?: number; // Preference score 0-10
  };
  viewHistory: {
    [dealId: string]: number; // Number of views
  };
  locationHistory: {
    [locationId: string]: number; // Number of visits
  };
}

// Default empty user preferences
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  favoriteCategories: {
    'Beer': 5,
    'Wine / Spirits': 5,
    'Cocktail': 5,
    'Food': 5
  },
  pricePreferences: {
    'under_10': 7,
    '10_to_15': 6,
    '15_to_20': 5,
    'above_20': 3
  },
  viewHistory: {},
  locationHistory: {}
};

/**
 * Get price range category for a deal
 */
function getPriceRangeCategory(price: number): PriceRange {
  if (price < 10) return 'under_10';
  if (price < 15) return '10_to_15';
  if (price < 20) return '15_to_20';
  return 'above_20';
}

/**
 * Calculate distance score (higher is better)
 * 1.0 = very close, 0.0 = very far
 */
function calculateDistanceScore(distanceInKm: number): number {
  if (distanceInKm < DISTANCE_BUCKETS.VERY_CLOSE) return 1.0;
  if (distanceInKm < DISTANCE_BUCKETS.CLOSE) return 0.8;
  if (distanceInKm < DISTANCE_BUCKETS.MEDIUM) return 0.6;
  if (distanceInKm < DISTANCE_BUCKETS.FAR) return 0.3;
  return 0.1; // Very far
}

/**
 * Calculate price score (higher is better)
 * Lower prices get higher scores
 */
function calculatePriceScore(price: number): number {
  if (price < 8) return 1.0;
  if (price < 12) return 0.9;
  if (price < 15) return 0.7;
  if (price < 20) return 0.5;
  if (price < 30) return 0.3;
  return 0.1;
}

/**
 * Calculate user preference match score
 */
function calculatePreferenceScore(
  deal: Deal,
  userPreferences: UserPreferences
): number {
  // Category preference
  const categoryScore = userPreferences.favoriteCategories[deal.alcohol_category as DrinkCategory] || 5;
  
  // Price preference
  const priceRange = getPriceRangeCategory(deal.happy_hour_price);
  const priceScore = userPreferences.pricePreferences[priceRange] || 5;
  
  // View history (familiarity bonus)
  const viewCount = userPreferences.viewHistory[deal.id.toString()] || 0;
  const viewScore = Math.min(viewCount, 5) / 5; // Normalized to 0-1
  
  // Location familiarity
  const locationVisits = userPreferences.locationHistory[deal.establishmentId.toString()] || 0;
  const locationScore = Math.min(locationVisits, 10) / 10; // Normalized to 0-1
  
  // Combine scores (weighted average)
  return (
    (categoryScore / 10) * 0.4 + 
    (priceScore / 10) * 0.4 + 
    viewScore * 0.1 + 
    locationScore * 0.1
  );
}

/**
 * Calculate recommendation score for a deal
 * Higher score = more recommended
 */
export function calculateDealScore(
  deal: Deal, 
  establishment: Establishment,
  userPosition: { lat: number, lng: number } | null,
  isActive: boolean,
  distanceInKm: number | null,
  userPreferences: UserPreferences = DEFAULT_USER_PREFERENCES
): number {
  // Distance score - 0 if position unknown
  const distanceScore = distanceInKm !== null 
    ? calculateDistanceScore(distanceInKm)
    : 0;
  
  // Price score
  const priceScore = calculatePriceScore(deal.happy_hour_price);
  
  // Active status score
  const activeScore = isActive ? 1.0 : 0.3;
  
  // Popularity - placeholder for now, to be implemented with real data
  const popularityScore = 0.5;
  
  // User preference match
  const preferenceScore = calculatePreferenceScore(deal, userPreferences);
  
  // Final weighted score
  return (
    distanceScore * WEIGHTS.DISTANCE +
    priceScore * WEIGHTS.PRICE +
    activeScore * WEIGHTS.ACTIVE_STATUS +
    popularityScore * WEIGHTS.POPULARITY +
    preferenceScore * WEIGHTS.PREFERENCE_MATCH
  );
}

/**
 * Sort deals based on personalized recommendation score
 */
export function getRecommendedDeals(
  deals: Deal[],
  establishments: Map<number, Establishment>,
  userPosition: { lat: number, lng: number } | null,
  isActiveFn: (deal: Deal) => boolean,
  calculateDistanceFn: (establishment: Establishment) => number | null,
  userPreferences: UserPreferences = DEFAULT_USER_PREFERENCES,
  limit: number = 20
): Deal[] {
  // Calculate scores for each deal
  const scoredDeals = deals.map(deal => {
    const establishment = establishments.get(deal.establishmentId);
    if (!establishment) return { deal, score: 0 };

    const isActive = isActiveFn(deal);
    const distance = calculateDistanceFn(establishment);

    const score = calculateDealScore(
      deal,
      establishment,
      userPosition,
      isActive,
      distance,
      userPreferences
    );

    return { deal, score };
  });

  // Sort by score (highest first)
  scoredDeals.sort((a, b) => b.score - a.score);

  // Return the top N deals
  return scoredDeals.slice(0, limit).map(item => item.deal);
}

/**
 * Helper to load user preferences from localStorage
 */
export function loadUserPreferences(): UserPreferences {
  try {
    const savedPrefs = localStorage.getItem('userPreferences');
    if (savedPrefs) {
      return JSON.parse(savedPrefs);
    }
  } catch (error) {
    console.error('Error loading user preferences:', error);
  }
  return DEFAULT_USER_PREFERENCES;
}

/**
 * Helper to save user preferences to localStorage
 */
export function saveUserPreferences(preferences: UserPreferences): void {
  try {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
}

/**
 * Record that a user viewed a deal
 */
export function recordDealView(dealId: number): void {
  const prefs = loadUserPreferences();
  const dealIdStr = dealId.toString();
  
  prefs.viewHistory[dealIdStr] = (prefs.viewHistory[dealIdStr] || 0) + 1;
  saveUserPreferences(prefs);
}

/**
 * Record that a user visited a location/establishment
 */
export function recordLocationVisit(establishmentId: number): void {
  const prefs = loadUserPreferences();
  const locationIdStr = establishmentId.toString();
  
  prefs.locationHistory[locationIdStr] = (prefs.locationHistory[locationIdStr] || 0) + 1;
  saveUserPreferences(prefs);
}

/**
 * Update user category preference
 */
export function updateCategoryPreference(category: DrinkCategory, increment: boolean): void {
  const prefs = loadUserPreferences();
  
  const currentValue = prefs.favoriteCategories[category] || 5;
  const newValue = Math.max(1, Math.min(10, increment ? currentValue + 1 : currentValue - 1));
  
  prefs.favoriteCategories[category] = newValue;
  saveUserPreferences(prefs);
}

/**
 * Update user price preference
 */
export function updatePricePreference(priceRange: PriceRange, increment: boolean): void {
  const prefs = loadUserPreferences();
  
  const currentValue = prefs.pricePreferences[priceRange] || 5;
  const newValue = Math.max(1, Math.min(10, increment ? currentValue + 1 : currentValue - 1));
  
  prefs.pricePreferences[priceRange] = newValue;
  saveUserPreferences(prefs);
}