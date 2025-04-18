/**
 * Utilities for working with collections data
 */

// Map of collection DB tags to their friendly display names
const collectionDisplayNames: Record<string, string> = {
  // Beer collections
  'beers_under_12': 'Beers Under $12',
  'beers_under_15': 'Beers Under $15',
  'craft_beers': 'Craft Beers',
  'beer_buckets_under_40': 'Beer Buckets Under $40',
  
  // Wine collections
  'wines_under_12': 'Wines Under $12',
  'wines_under_15': 'Wines Under $15',
  'bottles_under_100': 'Bottles Under $100',
  
  // Cocktail collections
  'cocktails_under_12': 'Cocktails Under $12',
  'cocktails_under_15': 'Cocktails Under $15',
  'signature_cocktails': 'Signature Cocktails',
  
  // Spirit collections
  'whisky_deals': 'Whisky Deals',
  'gin_deals': 'Gin Deals',
  
  // Special deal types
  '1for1_deals': '1-for-1 Deals',
  'freeflow_deals': 'Free Flow Deals',
  'two_bottle_discounts': 'Two Bottle Discounts',
  
  // Location-based collections
  'cbd_deals': 'CBD Deals',
  'orchard_deals': 'Orchard Deals',
  'holland_village_deals': 'Holland Village Deals',
  
  // Default collections
  'active_happy_hours': 'Happy Hours Nearby',
  'all_deals': 'All Deals'
};

/**
 * Convert a collection slug/tag from the database to a user-friendly display name
 * @param collectionTag The collection tag from the database (e.g. "beers_under_12")
 * @returns Friendly display name (e.g. "Beers Under $12")
 */
export function getFriendlyCollectionName(collectionTag: string): string {
  // Handle comma-separated collection tags
  if (collectionTag.includes(',')) {
    // If multiple tags, use the first one
    const firstTag = collectionTag.split(',')[0].trim();
    return collectionDisplayNames[firstTag] || prettifyCollectionTag(firstTag);
  }
  
  // Handle single collection tag
  return collectionDisplayNames[collectionTag] || prettifyCollectionTag(collectionTag);
}

/**
 * Convert a DB-style collection tag to a pretty display name by applying
 * basic text transformations if we don't have a pre-defined mapping
 */
function prettifyCollectionTag(tag: string): string {
  // Remove underscores and convert to title case
  return tag
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Extract collection tags from a deal object's collections field
 * @param deal The deal object with a collections field
 * @returns Array of collection tags
 */
export function getCollectionTags(deal: any): string[] {
  if (!deal.collections) return [];
  
  // Split by comma, trim whitespace, and filter out empty values
  return deal.collections
    .split(',')
    .map((tag: string) => tag.trim())
    .filter(Boolean);
}

/**
 * Get the most appropriate collection name for a deal
 * @param deal The deal object with a collections field
 * @returns The friendly display name of the first collection
 */
export function getPrimaryCollectionName(deal: any): string {
  const tags = getCollectionTags(deal);
  if (tags.length === 0) return 'Happy Hour Deals';
  
  return getFriendlyCollectionName(tags[0]);
}

/**
 * Group deals by their collections
 * @param deals Array of deal objects
 * @returns Map of collection names to arrays of deals
 */
export function groupDealsByCollection(deals: any[]): Map<string, any[]> {
  const collections = new Map<string, any[]>();
  
  // Group deals by their collection names
  deals.forEach(deal => {
    const tags = getCollectionTags(deal);
    
    // If no collections specified, add to a default group
    if (tags.length === 0) {
      const defaultGroup = 'all_deals';
      const dealsInCollection = collections.get(defaultGroup) || [];
      dealsInCollection.push(deal);
      collections.set(defaultGroup, dealsInCollection);
      return;
    }
    
    // Add the deal to each of its collections
    tags.forEach(tag => {
      const dealsInCollection = collections.get(tag) || [];
      dealsInCollection.push(deal);
      collections.set(tag, dealsInCollection);
    });
  });
  
  return collections;
}

/**
 * Check if a deal belongs to a specific collection
 * @param deal The deal object
 * @param collectionTag The collection tag to check for
 * @returns True if the deal belongs to the collection
 */
export function dealBelongsToCollection(deal: any, collectionTag: string): boolean {
  if (!deal.collections) return false;
  
  const tags = getCollectionTags(deal);
  return tags.includes(collectionTag);
}

/**
 * Get the priority order of collections for display
 * The most important collections should be displayed first
 */
export const collectionPriorities: string[] = [
  'active_happy_hours',    // Priority 1
  'beers_under_12',        // Priority 10
  'wines_under_12',        // Priority 11
  'craft_beers',           // Priority 12
  'cocktails_under_12',    // Priority 12
  '1for1_deals',           // Priority 15
  'freeflow_deals',        // Priority 16
  'two_bottle_discounts',  // Priority 17
  'wines_under_15',        // Priority 20
  'cocktails_under_15',    // Priority 20
  'signature_cocktails',   // Priority 21
  'bottles_under_100',     // Priority 21
  'beer_buckets_under_40', // Priority 23
  'beers_under_15',        // Priority 25
  'whisky_deals',          // Priority 40
  'gin_deals',             // Priority 41
  'all_deals',             // Priority 60
  'cbd_deals',             // Priority 60
  'orchard_deals',         // Priority 61
  'holland_village_deals'  // Priority 62
];

/**
 * Sort collection names by priority
 * @param collections Array of collection names
 * @returns Sorted array with most important collections first
 */
export function sortCollectionsByPriority(collections: string[]): string[] {
  return [...collections].sort((a, b) => {
    const priorityA = collectionPriorities.indexOf(a);
    const priorityB = collectionPriorities.indexOf(b);
    
    // If both are in the priority list, sort by priority
    if (priorityA !== -1 && priorityB !== -1) {
      return priorityA - priorityB;
    }
    
    // If only one is in the priority list, it comes first
    if (priorityA !== -1) return -1;
    if (priorityB !== -1) return 1;
    
    // If neither is in the priority list, sort alphabetically
    return getFriendlyCollectionName(a).localeCompare(getFriendlyCollectionName(b));
  });
}