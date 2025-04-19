/**
 * Local image service - Simple replacement for Cloudflare Images
 * Stores images on the server filesystem and serves them via Express
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

// Base directory for storing images
const IMAGE_BASE_DIR = path.join(process.cwd(), 'public', 'images');
const DRINKS_DIR = path.join(IMAGE_BASE_DIR, 'drinks');

// Fixed dimensions for stored images - reduced to 300x300 for efficiency
const IMAGE_WIDTH = 300;
const IMAGE_HEIGHT = 300;

// Make sure directories exist
if (!fs.existsSync(IMAGE_BASE_DIR)) {
  fs.mkdirSync(IMAGE_BASE_DIR, { recursive: true });
}

if (!fs.existsSync(DRINKS_DIR)) {
  fs.mkdirSync(DRINKS_DIR, { recursive: true });
}

interface ImageMetadata {
  id: string;
  originalName: string;
  category?: string;
  drinkName?: string;
  width: number;
  height: number;
  mimeType: string;
  size: number;
  createdAt: Date;
  path: string;
  url: string;
}

interface CategoryFolder {
  category: string;
  path: string;
}

// Store image metadata for better retrieval
const imageMetadataCache: Record<string, ImageMetadata> = {};

// Create category directories if they don't exist
export function ensureCategoryFolder(category: string): CategoryFolder {
  const sanitizedCategory = category.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
  const categoryPath = path.join(DRINKS_DIR, sanitizedCategory);
  
  if (!fs.existsSync(categoryPath)) {
    fs.mkdirSync(categoryPath, { recursive: true });
  }
  
  return {
    category: sanitizedCategory,
    path: categoryPath
  };
}

// Save an image file to the local filesystem
export async function saveImage(
  filePath: string, 
  metadata: {
    category?: string;
    drinkName?: string;
    originalName: string;
    mimeType: string;
  }
): Promise<ImageMetadata> {
  try {
    // Generate a unique ID for the image
    const imageId = uuidv4();
    
    // Determine the category folder
    const category = metadata.category || 'general';
    const { path: categoryPath } = ensureCategoryFolder(category);
    
    // Get the file extension
    const fileExt = path.extname(metadata.originalName).toLowerCase() || '.jpg';
    
    // Create the destination filename
    const filename = `${imageId}${fileExt}`;
    const destPath = path.join(categoryPath, filename);
    
    // Process the image with sharp to resize to exactly 300x300
    const image = sharp(filePath);
    
    // Always resize to exactly 300x300 square with cover fit
    // This ensures all images are exactly 300x300 for consistency
    await image
      .resize({
        width: IMAGE_WIDTH,
        height: IMAGE_HEIGHT,
        fit: sharp.fit.cover,  // Use cover to fill the square without distortion
        position: 'center'     // Center the image to keep the important parts
      })
      // Convert to either JPEG or WebP (based on original format)
      .toFormat(path.extname(metadata.originalName).toLowerCase() === '.webp' ? 'webp' : 'jpeg', {
        quality: 85  // Good balance of quality and file size
      })
      .toFile(destPath);
    
    // Get final image dimensions
    const finalMetadata = await sharp(destPath).metadata();
    
    // Create metadata for the saved image
    const imageMetadata: ImageMetadata = {
      id: imageId,
      originalName: metadata.originalName,
      category: category,
      drinkName: metadata.drinkName,
      width: finalMetadata.width || 0,
      height: finalMetadata.height || 0,
      mimeType: metadata.mimeType,
      size: fs.statSync(destPath).size,
      createdAt: new Date(),
      path: destPath,
      url: `/direct-image/${category}/${filename}` // Use direct image route for reliable serving
    };
    
    // Cache the metadata
    imageMetadataCache[imageId] = imageMetadata;
    
    // Save metadata to a JSON file for persistence
    const metadataPath = path.join(IMAGE_BASE_DIR, 'metadata.json');
    let existingMetadata: Record<string, ImageMetadata> = {};
    
    if (fs.existsSync(metadataPath)) {
      try {
        existingMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      } catch (e) {
        console.error('Error reading metadata file:', e);
      }
    }
    
    existingMetadata[imageId] = imageMetadata;
    fs.writeFileSync(metadataPath, JSON.stringify(existingMetadata, null, 2));
    
    return imageMetadata;
  } catch (error) {
    console.error('Error saving image:', error);
    throw new Error(`Failed to save image: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Get image metadata by ID
export function getImageMetadata(imageId: string): ImageMetadata | null {
  return imageMetadataCache[imageId] || null;
}

// Get image URL by ID
export function getImageUrl(imageId: string, width?: number, height?: number): string {
  const metadata = getImageMetadata(imageId);
  if (!metadata) return '';
  
  let url = metadata.url;
  
  // Add dimensions if specified
  if (width || height) {
    url += '?';
    if (width) url += `width=${width}`;
    if (width && height) url += '&';
    if (height) url += `height=${height}`;
  }
  
  return url;
}

// Get random images for a category
export function getRandomImagesForCategory(category: string, count: number = 1): string[] {
  const images = Object.values(imageMetadataCache)
    .filter(img => img.category === category);
  
  if (images.length === 0) return [];
  
  // Shuffle the array
  const shuffled = [...images].sort(() => 0.5 - Math.random());
  
  // Return requested number of image IDs
  return shuffled.slice(0, count).map(img => img.id);
}

// Load existing metadata
export function loadImageMetadata(): void {
  const metadataPath = path.join(IMAGE_BASE_DIR, 'metadata.json');
  
  if (fs.existsSync(metadataPath)) {
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      
      Object.assign(imageMetadataCache, metadata);
      
      console.log(`Loaded ${Object.keys(metadata).length} image metadata entries`);
    } catch (e) {
      console.error('Error loading image metadata:', e);
    }
  }
}

// Initialize by loading existing metadata
loadImageMetadata();