/**
 * Data Obfuscator
 * 
 * This utility transforms field names in outgoing API responses to make
 * scraping more difficult, and transforms incoming field names to match
 * our internal data model.
 */

// Map of internal field names to obfuscated external names
// The shorter and less descriptive, the better
const fieldMappings = {
  // Deal fields
  id: 'i',
  establishmentId: 'ei',
  alcohol_category: 'ac',
  alcohol_subcategory: 'as',
  alcohol_subcategory2: 'as2',
  drink_name: 'dn',
  standard_price: 'sp',
  happy_hour_price: 'hp',
  savings: 'sv',
  savings_percentage: 'sp2', // Changed to sp2 to avoid collision
  valid_days: 'vd',
  hh_start_time: 'st',
  hh_end_time: 'et',
  collections: 'cl',
  description: 'ds',
  distance: 'dt',

  // Establishment fields
  name: 'nm',
  address: 'ad',
  city: 'ct',
  postalCode: 'pc',
  cuisine: 'cs',
  imageUrl: 'iu',
  rating: 'rt',
  latitude: 'lt',
  longitude: 'ln',
  
  // Collection fields
  slug: 'sl',
  priority: 'pr',
  active: 'ac2', // Changed to ac2 to avoid collision with alcohol_category
  
  // Add more field mappings as needed
};

// Reverse mapping for incoming data
const reverseFieldMappings: Record<string, string> = {};
Object.keys(fieldMappings).forEach(key => {
  const value = fieldMappings[key as keyof typeof fieldMappings];
  reverseFieldMappings[value] = key;
});

/**
 * Transform an object's field names using the mapping
 */
export function obfuscateData(data: any): any {
  if (Array.isArray(data)) {
    return data.map(item => obfuscateData(item));
  }
  
  if (data === null || typeof data !== 'object') {
    return data;
  }
  
  const result: Record<string, any> = {};
  
  Object.keys(data).forEach(key => {
    const obfuscatedKey = fieldMappings[key as keyof typeof fieldMappings] || key;
    const value = data[key];
    
    // Recursively obfuscate nested objects
    if (value !== null && typeof value === 'object') {
      result[obfuscatedKey] = obfuscateData(value);
    } else {
      result[obfuscatedKey] = value;
    }
  });
  
  return result;
}

/**
 * Transform an object's field names back to the internal format
 */
export function deobfuscateData(data: any): any {
  if (Array.isArray(data)) {
    return data.map(item => deobfuscateData(item));
  }
  
  if (data === null || typeof data !== 'object') {
    return data;
  }
  
  const result: Record<string, any> = {};
  
  Object.keys(data).forEach(key => {
    const internalKey = reverseFieldMappings[key] || key;
    const value = data[key];
    
    // Recursively deobfuscate nested objects
    if (value !== null && typeof value === 'object') {
      result[internalKey] = deobfuscateData(value);
    } else {
      result[internalKey] = value;
    }
  });
  
  return result;
}

/**
 * Express middleware to obfuscate response data
 */
export function obfuscateResponseMiddleware(req: any, res: any, next: any) {
  // Save a reference to the original res.json function
  const originalJson = res.json;
  
  // Override the json method to obfuscate data before sending
  res.json = function(data: any) {
    // Transform data field names
    const obfuscatedData = obfuscateData(data);
    
    // Call original json method with transformed data
    return originalJson.call(this, obfuscatedData);
  };
  
  next();
}

/**
 * Express middleware to deobfuscate request data
 */
export function deobfuscateRequestMiddleware(req: any, res: any, next: any) {
  if (req.body && typeof req.body === 'object') {
    req.body = deobfuscateData(req.body);
  }
  
  if (req.query && typeof req.query === 'object') {
    req.query = deobfuscateData(req.query);
  }
  
  next();
}