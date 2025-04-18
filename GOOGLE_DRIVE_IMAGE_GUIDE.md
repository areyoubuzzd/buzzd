# Google Drive Image Storage Guide

This guide explains how to use Google Drive as an image repository for your application, which can be more reliable than Cloudinary due to fewer API restrictions and easier management.

## Setting Up Google Drive for Image Storage

### Step 1: Create a folder structure in Google Drive

1. Create a main folder for your application images (e.g., "Happy Hour App Images")
2. Inside the main folder, create category folders:
   - beer
   - wine
   - cocktail
   - spirits
   - whisky
3. Inside each category folder, create drink-specific folders using the underscore naming format:
   - beer/heineken_pint
   - beer/tiger_pint
   - beer/asahi_pint
   - wine/red_wine
   - cocktail/margarita
   - etc.

### Step 2: Upload images to these folders

1. Upload drink images to their respective folders
2. Name the images sequentially: 1.jpg, 2.jpg, 3.jpg, etc.
3. Make sure the images are reasonably sized (recommended: 400x400 px for optimal balance of quality and performance)

### Step 3: Make the images publicly accessible

1. Right-click on your main image folder
2. Click "Share"
3. Change access from "Restricted" to "Anyone with the link"
4. Set permission to "Viewer"
5. Copy the link for your records

### Step 4: Get direct image URLs

For each image you want to use:

1. Right-click on the image
2. Select "Share"
3. Click "Copy link"
4. The link will look like this: `https://drive.google.com/file/d/FILE_ID/view?usp=sharing`
5. Convert this to a direct image URL:
   `https://drive.google.com/uc?export=view&id=FILE_ID`

Where FILE_ID is the long string from the sharing URL.

### Step 5: Add these URLs to the code

1. Open `client/src/lib/google-drive-utils.ts`
2. Find the `drinkImageMap` object
3. Add your direct Google Drive image URLs to the appropriate drink entries

For example:
```typescript
const drinkImageMap: Record<string, string[]> = {
  'tiger_pint': [
    'https://drive.google.com/uc?export=view&id=abc123def456',
    'https://drive.google.com/uc?export=view&id=ghi789jkl012',
  ],
  'heineken_pint': [
    'https://drive.google.com/uc?export=view&id=mno345pqr678',
    'https://drive.google.com/uc?export=view&id=stu901vwx234',
  ],
  // Add more drinks as needed
};
```

## Switching from Cloudinary to Google Drive

### Step 1: Import the new utility functions

In any file where you were using Cloudinary utilities, change:
```typescript
import { getRandomDrinkImageUrl, getDefaultDrinkImageUrl } from '@/lib/cloudinary-utils';
```

To:
```typescript
import { getRandomDrinkImageUrl, getDefaultDrinkImageUrl } from '@/lib/google-drive-utils';
```

### Step 2: Update any component that uses these functions

No code changes are needed for components that already use these utility functions, since we've maintained the same function signatures.

## Advantages Over Cloudinary

1. **No API limits**: Google Drive doesn't impose strict API call limits like Cloudinary
2. **Easier management**: Upload, organize and manage files through Google Drive's familiar interface
3. **Direct control**: Update images directly without complex API calls
4. **No specialized client needed**: Simple HTTP requests work for accessing images
5. **Cost-effective**: Google Drive has generous free storage quotas

## Common Issues and Solutions

### CORS Issues

If you encounter CORS issues, use the `uc?export=view&id=` URL format as shown above.

### Image Loading Delays

Google Drive may occasionally have slower image loading times than specialized CDNs. To mitigate:

1. Optimize image dimensions before uploading (aim for 400x400 pixels)
2. Use image compression to reduce file sizes
3. Consider preloading key images

### Maximum Requests

For very high-traffic applications, consider a hybrid approach - using Google Drive for less frequently accessed images and a CDN for the most common ones.