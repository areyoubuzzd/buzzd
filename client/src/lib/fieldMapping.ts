/**
 * Field mapping utility for client-side code
 * 
 * These mappings ensure our frontend components can properly handle 
 * the obfuscated field names from the API responses.
 */

// This must match the mapping in server/utils/data-obfuscator.ts
const serverToClientMapping: Record<string, string> = {
  // Deal fields
  'i': 'id',
  'ei': 'establishmentId',
  'ac': 'alcohol_category', // Note: this overlaps with 'active' - server needs unique codes
  'as': 'alcohol_subcategory',
  'as2': 'alcohol_subcategory2',
  'dn': 'drink_name',
  'sp': 'standard_price', // Note: this overlaps with 'savings_percentage' - server needs unique codes
  'hp': 'happy_hour_price',
  'sv': 'savings',
  'sp2': 'savings_percentage', // Using sp2 to avoid collision
  'vd': 'valid_days',
  'st': 'hh_start_time',
  'et': 'hh_end_time',
  'cl': 'collections',
  'ds': 'description',
  'dt': 'distance',

  // Establishment fields
  'nm': 'name',
  'ad': 'address',
  'ct': 'city',
  'pc': 'postalCode',
  'cs': 'cuisine',
  'iu': 'imageUrl',
  'rt': 'rating',
  'lt': 'latitude',
  'ln': 'longitude',
  
  // Collection fields
  'sl': 'slug',
  'pr': 'priority',
  'ac2': 'active', // Using ac2 to avoid collision
};

// Generate the reverse mapping
const clientToServerMapping: Record<string, string> = Object.entries(serverToClientMapping)
  .reduce((acc, [server, client]) => {
    acc[client] = server;
    return acc;
  }, {} as Record<string, string>);

/**
 * Convert obfuscated field names to human-readable field names
 */
export function normalizeResponse<T>(data: any): T {
  if (Array.isArray(data)) {
    return data.map(item => normalizeResponse<any>(item)) as unknown as T;
  }
  
  if (data === null || typeof data !== 'object') {
    return data as T;
  }
  
  const result: Record<string, any> = {};
  
  Object.entries(data).forEach(([key, value]) => {
    const normalizedKey = serverToClientMapping[key] || key;
    
    if (value !== null && typeof value === 'object') {
      result[normalizedKey] = normalizeResponse(value);
    } else {
      result[normalizedKey] = value;
    }
  });
  
  return result as T;
}

/**
 * Convert human-readable field names to obfuscated field names
 */
export function obfuscateRequest<T>(data: any): T {
  if (Array.isArray(data)) {
    return data.map(item => obfuscateRequest<any>(item)) as unknown as T;
  }
  
  if (data === null || typeof data !== 'object') {
    return data as T;
  }
  
  const result: Record<string, any> = {};
  
  Object.entries(data).forEach(([key, value]) => {
    const obfuscatedKey = clientToServerMapping[key] || key;
    
    if (value !== null && typeof value === 'object') {
      result[obfuscatedKey] = obfuscateRequest(value);
    } else {
      result[obfuscatedKey] = value;
    }
  });
  
  return result as T;
}