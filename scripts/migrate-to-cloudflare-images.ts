/**
 * Script to migrate images from Cloudinary to Cloudflare Images
 * 
 * This script does the following:
 * 1. Fetches all deals and establishments with image URLs from Cloudinary
 * 2. Downloads each image
 * 3. Uploads to Cloudflare Images
 * 4. Updates the database records with the new Cloudflare image IDs
 * 
 * Run with: npx tsx scripts/migrate-to-cloudflare-images.ts
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { db } from '../server/db';
import { deals, establishments } from '../shared/schema';
import { eq } from 'drizzle-orm';
import FormData from 'form-data';

// Ensure the temp directory exists
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Helper function to download an image from a URL
async function downloadImage(imageUrl: string, filePath: string): Promise<boolean> {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(filePath, response.data);
    console.log(`Downloaded image from ${imageUrl}`);
    return true;
  } catch (error) {
    console.error(`Failed to download image from ${imageUrl}:`, error);
    return false;
  }
}

// Helper function to upload an image to Cloudflare Images
async function uploadToCloudflare(filePath: string, metadata: Record<string, any>): Promise<string | null> {
  try {
    // Get a direct upload URL from our API
    const response = await axios.post('http://localhost:5000/api/cloudflare/direct-upload', metadata);
    const { uploadURL, id } = response.data;
    
    // Create a form with the image file
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    
    // Upload to Cloudflare Images
    await axios.post(uploadURL, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    
    console.log(`Uploaded image to Cloudflare Images with ID: ${id}`);
    return id;
  } catch (error) {
    console.error('Failed to upload to Cloudflare Images:', error);
    return null;
  }
}

// Main function to migrate deals with images
async function migrateDealsImages() {
  // Fetch all deals with image URLs
  const dealsWithImages = await db
    .select()
    .from(deals)
    .where(eq(deals.imageUrl, undefined));
    
  console.log(`Found ${dealsWithImages.length} deals with image URLs to migrate.`);
  
  for (const deal of dealsWithImages) {
    if (!deal.imageUrl) continue;
    
    // Skip if already migrated
    if (deal.imageId) {
      console.log(`Deal #${deal.id} already has a Cloudflare image ID: ${deal.imageId}`);
      continue;
    }
    
    // Generate a temporary file path
    const fileName = `deal_${deal.id}_${Date.now()}.jpg`;
    const filePath = path.join(tempDir, fileName);
    
    // Download the image
    const downloaded = await downloadImage(deal.imageUrl, filePath);
    if (!downloaded) continue;
    
    // Prepare metadata
    const metadata = {
      type: 'drink',
      category: deal.alcohol_category || 'general',
      name: deal.drink_name || 'unnamed',
      establishmentId: deal.establishmentId ? String(deal.establishmentId) : undefined,
      dealId: String(deal.id),
      migrated: 'true',
    };
    
    // Upload to Cloudflare
    const imageId = await uploadToCloudflare(filePath, metadata);
    if (!imageId) continue;
    
    // Update the database record
    await db
      .update(deals)
      .set({ imageId })
      .where(eq(deals.id, deal.id));
      
    console.log(`Updated deal #${deal.id} with Cloudflare image ID: ${imageId}`);
    
    // Clean up the temporary file
    fs.unlinkSync(filePath);
  }
}

// Function to migrate establishment images
async function migrateEstablishmentImages() {
  // Fetch all establishments with image URLs
  const establishmentsWithImages = await db
    .select()
    .from(establishments)
    .where(eq(establishments.imageUrl, undefined));
    
  console.log(`Found ${establishmentsWithImages.length} establishments with image URLs to migrate.`);
  
  for (const establishment of establishmentsWithImages) {
    if (!establishment.imageUrl) continue;
    
    // Skip if already migrated
    if (establishment.imageId) {
      console.log(`Establishment #${establishment.id} already has a Cloudflare image ID: ${establishment.imageId}`);
      continue;
    }
    
    // Generate a temporary file path
    const fileName = `establishment_${establishment.id}_${Date.now()}.jpg`;
    const filePath = path.join(tempDir, fileName);
    
    // Download the image
    const downloaded = await downloadImage(establishment.imageUrl, filePath);
    if (!downloaded) continue;
    
    // Prepare metadata
    const metadata = {
      type: 'establishment',
      category: 'logo',
      name: establishment.name || 'unnamed',
      establishmentId: String(establishment.id),
      migrated: 'true',
    };
    
    // Upload to Cloudflare
    const imageId = await uploadToCloudflare(filePath, metadata);
    if (!imageId) continue;
    
    // Update the database record
    await db
      .update(establishments)
      .set({ imageId })
      .where(eq(establishments.id, establishment.id));
      
    console.log(`Updated establishment #${establishment.id} with Cloudflare image ID: ${imageId}`);
    
    // Clean up the temporary file
    fs.unlinkSync(filePath);
  }
}

// Main function to run the migration
async function main() {
  try {
    console.log('Starting migration from Cloudinary to Cloudflare Images...');
    
    // Migrate deal images
    await migrateDealsImages();
    
    // Migrate establishment images
    await migrateEstablishmentImages();
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

main();