import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// Define types for our data
interface Restaurant {
  restaurantId: string;
  name: string;
  address: string;
  postalCode: string;
  phoneNumber: string;
  cuisine: string;
  area: string;
  priority: number;
  latitude: number;
  longitude: number;
  website: string;
  openingHours: string;
  logoUrl: string;
}

interface Deal {
  dealId: string;
  restaurantId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  daysActive: string[];
  dealStatus: 'active' | 'upcoming' | 'inactive';
  dealType: 'drink' | 'food' | 'both';
  alcoholCategory: string;
  alcoholSubCategory: string;
  brandName: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  isFeatured: boolean;
  isPremium: boolean;
  isOneForOne: boolean;
  tags: string[];
  customBgImageUrl?: string;
  customBrandImageUrl?: string;
}

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

class GoogleSheetsService {
  private auth: JWT;
  public sheets: any; // Make sheets public so it can be accessed from outside
  public spreadsheetId: string; // Make spreadsheetId public too

  constructor() {
    // Make sure we have the environment variables
    if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || !process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
      console.warn('Google Sheets credentials not found in environment variables');
    }

    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      console.warn('Google Sheets spreadsheet ID not found in environment variables');
    }

    // Extract ID from URL if a full URL was provided
    let spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '';
    
    console.log('Original spreadsheet ID or URL:', spreadsheetId);
    
    // If it's a full URL, extract just the ID
    if (spreadsheetId.includes('spreadsheets/d/')) {
      const match = spreadsheetId.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        spreadsheetId = match[1];
        console.log('Extracted spreadsheet ID:', spreadsheetId);
      }
    }
    
    this.spreadsheetId = spreadsheetId;
    console.log('Using spreadsheet ID:', this.spreadsheetId);
    
    // Initialize auth
    this.auth = new JWT({
      email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: SCOPES,
    });

    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  /**
   * Fetch all restaurants from the Google Sheet
   */
  async getRestaurants(): Promise<Restaurant[]> {
    try {
      // Use Sheet1 which contains the restaurant data
      const sheetName = 'Sheet1';
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A2:L`, // A to L columns for restaurant data
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return [];
      }

      // Map row data to restaurant objects based on your actual sheet structure:
      // [restaurantId, name, address, area, postalCode, phoneNumber, cuisine, latitude, longitude, website, openingHours, logoUrl]
      return rows.map((row: string[]) => {
        // Only process rows that have at least a restaurant ID
        if (!row[0]) return null;
        
        return {
          restaurantId: row[0],
          name: row[1] || '',
          address: row[2] || '',
          area: row[3] || '',
          postalCode: row[4] || '',
          phoneNumber: row[5] || '',
          cuisine: row[6] || '',
          priority: 0, // Default priority if not specified
          latitude: row[7] ? parseFloat(row[7]) : null,
          longitude: row[8] ? parseFloat(row[8]) : null,
          website: row[9] || '',
          openingHours: row[10] || '',
          logoUrl: row[11] || ''
        };
      }).filter(Boolean) as Restaurant[]; // Remove null entries
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      throw error;
    }
  }

  /**
   * Fetch all deals from the Google Sheet
   */
  async getDeals(): Promise<Deal[]> {
    try {
      // Get metadata to see what sheets exist
      const metadata = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });
      
      // Find a deals sheet or use the second sheet if available
      const dealsSheet = metadata.data.sheets.find((s: any) => 
        s.properties.title.toLowerCase() === 'deals'
      );
      
      const sheetName = dealsSheet?.properties?.title || 
                        (metadata.data.sheets.length > 1 ? metadata.data.sheets[1].properties.title : 'Deals');
      
      console.log('Using sheet for deals:', sheetName);
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A2:W`, // Adjust range based on your data
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return [];
      }

      // Map row data to deal objects
      return rows.map((row: string[]) => ({
        dealId: row[0],
        restaurantId: row[1],
        title: row[2],
        description: row[3],
        startTime: row[4],
        endTime: row[5],
        startDate: row[6],
        endDate: row[7],
        daysActive: row[8] ? row[8].split(',').map((day: string) => day.trim()) : [],
        dealStatus: row[9] as 'active' | 'upcoming' | 'inactive',
        dealType: row[10] as 'drink' | 'food' | 'both',
        alcoholCategory: row[11],
        alcoholSubCategory: row[12],
        brandName: row[13],
        originalPrice: parseFloat(row[14]) || 0,
        discountedPrice: parseFloat(row[15]) || 0,
        discountPercentage: parseFloat(row[16]) || 0,
        isFeatured: row[17] === 'TRUE',
        isPremium: row[18] === 'TRUE',
        isOneForOne: row[19] === 'TRUE',
        tags: row[20] ? row[20].split(',').map((tag: string) => tag.trim()) : [],
        customBgImageUrl: row[21],
        customBrandImageUrl: row[22]
      }));
    } catch (error) {
      console.error('Error fetching deals:', error);
      throw error;
    }
  }

  /**
   * Get a specific restaurant by ID
   */
  async getRestaurantById(restaurantId: string): Promise<Restaurant | null> {
    const restaurants = await this.getRestaurants();
    return restaurants.find(restaurant => restaurant.restaurantId === restaurantId) || null;
  }

  /**
   * Get a specific deal by ID
   */
  async getDealById(dealId: string): Promise<Deal | null> {
    const deals = await this.getDeals();
    return deals.find(deal => deal.dealId === dealId) || null;
  }

  /**
   * Get deals from a specific restaurant
   */
  async getDealsByRestaurantId(restaurantId: string): Promise<Deal[]> {
    const deals = await this.getDeals();
    return deals.filter(deal => deal.restaurantId === restaurantId);
  }

  /**
   * Get active deals (deals currently in progress)
   */
  async getActiveDeals(): Promise<Deal[]> {
    const deals = await this.getDeals();
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];

    return deals.filter(deal => {
      // Check deal status
      if (deal.dealStatus !== 'active') return false;
      
      // Check date range if specified
      if (deal.startDate && deal.startDate > today) return false;
      if (deal.endDate && deal.endDate < today) return false;
      
      // Check if deal is active on this day of the week
      if (deal.daysActive.length > 0 && !deal.daysActive.includes(weekday)) return false;
      
      // Check time if needed (would require additional parsing of time strings)
      
      return true;
    });
  }
}

// Create and export a singleton instance
export const googleSheetsService = new GoogleSheetsService();