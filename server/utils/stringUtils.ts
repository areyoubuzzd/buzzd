/**
 * Utility functions for string manipulation
 */

/**
 * Normalize a string by removing spaces, special characters and making lowercase
 * This helps with creating slugs or IDs from display names
 * 
 * @param str - String to normalize
 * @returns Normalized string
 */
export function normalizeString(str: string): string {
  return str.toLowerCase()
    .replace(/[\s-]+/g, '_')   // Replace spaces and hyphens with underscores
    .replace(/[^\w_]+/g, '')   // Remove special characters
    .replace(/^1_for_1$/, 'one_for_one')             // Special case for "1-for-1" -> "one_for_one"
    .replace(/^1_for_1_deals?$/, 'one_for_one_deals'); // Special case for "1-for-1 Deals" -> "one_for_one_deals"
}

/**
 * Format a slug into a display name
 * @param slug - Slug (e.g., "beers_under_10")
 * @returns Formatted name (e.g., "Beers Under $10")
 */
export function formatSlugToDisplayName(slug: string): string {
  // Special case transformations
  if (slug === 'one_for_one_deals' || slug === '1_for_1_deal') {
    return '1-for-1 Deals';
  }
  if (slug === 'one_for_one_beer' || slug === '1_for_1_beer') {
    return '1-for-1 Beer Deals';
  }
  
  // Convert monetary values in slug to dollar signs
  let displayName = slug
    .replace(/_under_/g, ' Under $')
    .replace(/_below_/g, ' Below $')
    .replace(/_above_/g, ' Above $')
    .replace(/_over_/g, ' Over $');
  
  // Convert underscores to spaces and capitalize each word
  return displayName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}