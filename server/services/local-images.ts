import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for managing local image storage
 */
export class LocalImageService {
  private baseImageDir: string;
  private drinkImagesDir: string;
  private imageMetadata: Map<string, ImageMetadata>;
  
  constructor() {
    this.baseImageDir = path.join(process.cwd(), 'public/images');
    this.drinkImagesDir = path.join(this.baseImageDir, 'drinks');
    this.imageMetadata = new Map();
    
    // Ensure required directories exist
    this.ensureDirectories();
    
    // Load any existing image metadata
    this.loadImageMetadata();
  }
  
  /**
   * Ensure all required directories exist
   */
  private ensureDirectories(): void {
    if (!fs.existsSync(this.baseImageDir)) {
      fs.mkdirSync(this.baseImageDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.drinkImagesDir)) {
      fs.mkdirSync(this.drinkImagesDir, { recursive: true });
    }
    
    // Create standard drink category folders
    const standardCategories = [
      'beer', 'wine_red', 'wine_white', 'cocktail', 'spirit_whisky', 'general'
    ];
    
    standardCategories.forEach(category => {
      const categoryDir = path.join(this.drinkImagesDir, category);
      if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true });
      }
    });
    
    console.log('Serving static images from:', this.baseImageDir);
    console.log('Serving drink images from:', this.drinkImagesDir);
  }
  
  /**
   * Load metadata for all existing images
   */
  private loadImageMetadata(): void {
    try {
      // Find all image metadata files
      const metadataPath = path.join(this.baseImageDir, 'metadata.json');
      
      if (fs.existsSync(metadataPath)) {
        const rawData = fs.readFileSync(metadataPath, 'utf8');
        const metadata = JSON.parse(rawData) as ImageMetadata[];
        
        metadata.forEach(meta => {
          this.imageMetadata.set(meta.id, meta);
        });
        
        console.log(`Loaded ${this.imageMetadata.size} image metadata entries`);
      } else {
        // Create empty metadata file
        this.saveImageMetadata();
        console.log('Created new image metadata file');
      }
    } catch (error) {
      console.error('Error loading image metadata:', error);
    }
  }
  
  /**
   * Save all image metadata to file
   */
  private saveImageMetadata(): void {
    try {
      const metadataPath = path.join(this.baseImageDir, 'metadata.json');
      const metadata = Array.from(this.imageMetadata.values());
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error('Error saving image metadata:', error);
    }
  }
  
  /**
   * Get all image IDs for a specific category
   */
  public getImagesByCategory(category: string): string[] {
    const categoryDir = path.join(this.drinkImagesDir, category.toLowerCase());
    
    if (!fs.existsSync(categoryDir)) {
      return [];
    }
    
    // Get all image files in the category directory
    const files = fs.readdirSync(categoryDir).filter(file => {
      return /\.(jpg|jpeg|png|webp|gif)$/i.test(file);
    });
    
    // Extract just the image IDs without extensions
    return files.map(file => {
      return path.basename(file, path.extname(file));
    });
  }
  
  /**
   * Get all categories with images
   */
  public getAllCategories(): string[] {
    if (!fs.existsSync(this.drinkImagesDir)) {
      return [];
    }
    
    return fs.readdirSync(this.drinkImagesDir).filter(item => {
      const itemPath = path.join(this.drinkImagesDir, item);
      return fs.statSync(itemPath).isDirectory();
    });
  }
  
  /**
   * Get all images organized by category
   */
  public getAllImages(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    
    const categories = this.getAllCategories();
    categories.forEach(category => {
      result[category] = this.getImagesByCategory(category);
    });
    
    return result;
  }
  
  /**
   * Get metadata for a specific image
   */
  public getImageMetadata(imageId: string): ImageMetadata | undefined {
    return this.imageMetadata.get(imageId);
  }
  
  /**
   * Create a new image entry
   */
  public createImage(data: CreateImageData): ImageMetadata {
    const id = data.id || uuidv4();
    const category = data.category.toLowerCase();
    const categoryDir = path.join(this.drinkImagesDir, category);
    
    // Ensure category directory exists
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
    
    const metadata: ImageMetadata = {
      id,
      category,
      filename: data.filename,
      mimeType: data.mimeType,
      size: data.size,
      width: data.width,
      height: data.height,
      uploadedAt: new Date().toISOString(),
      drinkName: data.drinkName,
      dealId: data.dealId,
      establishmentId: data.establishmentId,
    };
    
    // Store metadata
    this.imageMetadata.set(id, metadata);
    this.saveImageMetadata();
    
    return metadata;
  }
  
  /**
   * Delete an image
   */
  public deleteImage(imageId: string): boolean {
    const metadata = this.imageMetadata.get(imageId);
    
    if (!metadata) {
      return false;
    }
    
    // Delete all files with this ID in all categories
    const categories = this.getAllCategories();
    
    for (const category of categories) {
      const categoryDir = path.join(this.drinkImagesDir, category);
      
      // Find matching image files (with any extension)
      const files = fs.readdirSync(categoryDir).filter(file => {
        return path.basename(file, path.extname(file)) === imageId;
      });
      
      // Delete matching files
      for (const file of files) {
        try {
          fs.unlinkSync(path.join(categoryDir, file));
        } catch (error) {
          console.error(`Error deleting image ${file}:`, error);
        }
      }
    }
    
    // Remove metadata
    this.imageMetadata.delete(imageId);
    this.saveImageMetadata();
    
    return true;
  }
}

export interface ImageMetadata {
  id: string;
  category: string;
  filename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  uploadedAt: string;
  drinkName?: string;
  dealId?: number;
  establishmentId?: number;
}

export interface CreateImageData {
  id?: string;
  category: string;
  filename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  drinkName?: string;
  dealId?: number;
  establishmentId?: number;
}

// Create a singleton instance
export const localImageService = new LocalImageService();