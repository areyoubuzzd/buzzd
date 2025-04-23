import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { db } from '../db';
import {
  deals,
  establishments,
  collections,
  DrinkCategory,
  WINE_TYPES,
  SPIRIT_TYPES,
  BEER_TYPES,
  calculateSavingsPercentage
} from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

// Environment variables for Google Sheets API
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');

// ✅ Guard block to prevent setup in non-production environments
if (process.env.NODE_ENV === 'production') {
  if (!SPREADSHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
    throw new Error('Missing Google Sheets credentials in environment variables');
  }

  const serviceAccountAuth = new JWT({
    email: CLIENT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);

  // TODO: Add sheet logic below if needed in production
  console.log('✅ Google Sheets integration initialized');
} else {
  console.log('📄 Skipping Google Sheets integration (NODE_ENV is not production)');
}

