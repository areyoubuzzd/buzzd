/**
 * Type definitions for API responses and data models
 */

export interface Deal {
  id: number;
  establishmentId: number;
  alcohol_category: string;
  alcohol_subcategory: string;
  alcohol_subcategory2?: string;
  drink_name: string;
  standard_price: number;
  happy_hour_price: number;
  savings: number;
  savings_percentage: number;
  valid_days: string;
  hh_start_time: string;
  hh_end_time: string;
  collections?: string;
  description?: string;
  imageUrl?: string | null;
  imageId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  
  // Optional fields that may come from the frontend
  isOneForOne?: boolean;
  dealPrice?: number;
  regularPrice?: number;
  brand?: string;
  subCategory?: string;
  startTime?: string;
  endTime?: string;
  establishment?: Establishment;
}

export interface Establishment {
  id: number;
  external_id?: string;
  name: string;
  address: string;
  city?: string;
  postalCode?: string;
  cuisine?: string;
  imageUrl?: string | null;
  imageId?: string | null;
  rating?: number;
  description?: string;
  latitude?: number;
  longitude?: number;
  
  // Optional fields that may come from the frontend
  activeDeals?: Deal[];
  hasActiveDeals?: boolean;
  distance?: number;
  isFavorite?: boolean;
}

export interface Collection {
  id: number;
  slug: string;
  name: string;
  description?: string;
  priority: number;
  imageUrl?: string | null;
  deals?: Deal[];
}

export interface User {
  id: number;
  username: string;
  email?: string;
  role: 'user' | 'admin' | 'restaurant';
  isPremium: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}