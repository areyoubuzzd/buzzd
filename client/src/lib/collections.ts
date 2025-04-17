/**
 * Collections utility functions
 * 
 * These functions help with parsing and working with the collections field
 * from the deals database table, which is stored as comma-separated values
 */

/**
 * Get collection names from a comma-separated string
 * @param collections - Comma-separated collection names
 * @returns Array of collection names
 */
export function getCollectionNames(collections?: string | null): string[] {
  if (!collections) return [];
  return collections.split(',').map(c => c.trim()).filter(Boolean);
}

/**
 * Normalize a collection name by removing spaces and making lowercase
 * This helps with matching collection names regardless of format (spaces vs underscores)
 * @param collectionName - Collection name to normalize
 * @returns Normalized collection name
 */
export function normalizeCollectionName(collectionName: string): string {
  return collectionName.toLowerCase()
    .replace(/[\s-]+/g, '_') // Replace spaces and hyphens with underscores
    .replace(/^1_for_1$/, 'one_for_one') // Special case for "1-for-1" -> "one_for_one"
    .replace(/^1_for_1_deals?$/, 'one_for_one_deals'); // Special case for "1-for-1 Deals" -> "one_for_one_deals"
}

/**
 * Check if a deal belongs to a specific collection
 * @param dealCollections - Comma-separated collection names
 * @param collectionName - Collection name to check
 * @returns Boolean indicating if the deal belongs to the collection
 */
export function isInCollection(dealCollections: string | null | undefined, collectionName: string): boolean {
  if (!dealCollections) return false;
  
  const collections = getCollectionNames(dealCollections).map(c => normalizeCollectionName(c));
  const normalizedName = normalizeCollectionName(collectionName);
  
  return collections.includes(normalizedName);
}

/**
 * Filter deals by a specific collection
 * @param deals - Array of deals
 * @param collectionName - Collection name to filter by
 * @returns Filtered array of deals
 */
export function filterDealsByCollection(deals: any[], collectionName: string): any[] {
  return deals.filter(deal => isInCollection(deal.collections, collectionName));
}

/**
 * Get all unique collection names from deals
 * @param deals - Array of deals
 * @returns Array of unique collection names
 */
export function getAllCollections(deals: any[]): string[] {
  const collectionsSet = new Set<string>();
  
  deals.forEach(deal => {
    if (deal.collections) {
      getCollectionNames(deal.collections).forEach(collection => {
        collectionsSet.add(collection);
      });
    }
  });
  
  return Array.from(collectionsSet);
}

/**
 * Group deals by collections
 * @param deals - Array of deals
 * @returns Object mapping collection names to arrays of deals
 */
export function groupDealsByCollection(deals: any[]): Record<string, any[]> {
  const collections = getAllCollections(deals);
  const result: Record<string, any[]> = {};
  
  collections.forEach(collection => {
    result[collection] = filterDealsByCollection(deals, collection);
  });
  
  return result;
}

/**
 * Collection interface
 */
export interface Collection {
  id: string;
  name: string;
  description?: string;
  deals: any[];
}

/**
 * Get collections with meta data and deals
 * @param deals - Array of deals
 * @returns Array of collection objects with deals
 */
export function getCollectionsWithDeals(deals: any[]): Collection[] {
  // You can define your collection metadata here or fetch from an API
  const collectionsMetadata: Record<string, { name: string, description?: string }> = {
    // Beer collections
    'beers_under_10': { 
      name: 'Beers Under $10', 
      description: 'Great beer deals under $10'
    },
    'beers_under_5': { 
      name: 'Beers Under $5', 
      description: 'Fantastic deals on beer under $5'
    },
    'beer_buckets_under_35': {
      name: 'Beer Buckets Under $35',
      description: 'Beer bucket specials under $35'
    },
    
    // Wine collections
    'wines_under_12': { 
      name: 'Wines Under $12', 
      description: 'Great wine deals under $12'
    },
    'wines_under_10': { 
      name: 'Wines Under $10', 
      description: 'Excellent wine deals under $10'
    },
    'wine_deals': { 
      name: 'Wine Deals', 
      description: 'Special offers on wine by the glass and bottle'
    },
    'premium_wine': { 
      name: 'Premium Wine Selection', 
      description: 'Special prices on premium wines'
    },
    
    // Cocktail collections
    'cocktails_under_15': { 
      name: 'Cocktails Under $15', 
      description: 'Great cocktail deals under $15'
    },
    'cocktails_under_12': { 
      name: 'Cocktails Under $12', 
      description: 'Excellent cocktail deals under $12'
    },
    'cocktail_specials': { 
      name: 'Cocktail Specials', 
      description: 'Signature and classic cocktails at special prices'
    },
    
    // 1-for-1 collections
    '1-for-1_deal': { 
      name: '1-for-1 Deals', 
      description: 'Buy one, get one free deals'
    },
    'one_for_one_deals': { 
      name: '1-for-1 Deals', 
      description: 'Buy one, get one free deals'
    },
    'one_for_one_beer': { 
      name: '1-for-1 Beer Deals', 
      description: 'Buy one beer, get one free'
    },
    
    // Other special collections
    'bottles_under_100': {
      name: 'Bottles Under $100',
      description: 'Bottle service under $100'
    },
    'freeflow_deal': {
      name: 'Free Flow Deals',
      description: 'Unlimited drink packages'
    },
    'happy_hour_spirits': { 
      name: 'Happy Hour Spirits', 
      description: 'Spirits at happy hour prices'
    },
    'weekend_specials': { 
      name: 'Weekend Specials', 
      description: 'Special deals available on weekends'
    },
    'craft_beer': { 
      name: 'Craft Beer Selection', 
      description: 'Special prices on craft beer'
    }
  };
  
  const allCollections = getAllCollections(deals);
  return allCollections.map(collectionId => {
    const metadata = collectionsMetadata[collectionId] || { name: formatCollectionName(collectionId) };
    
    return {
      id: collectionId,
      name: metadata.name,
      description: metadata.description,
      deals: filterDealsByCollection(deals, collectionId)
    };
  });
}

/**
 * Format a collection ID into a display name
 * @param collectionId - Collection ID (e.g., "beers_under_10")
 * @returns Formatted name (e.g., "Beers under $10")
 */
function formatCollectionName(collectionId: string): string {
  return collectionId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}