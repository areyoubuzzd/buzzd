# Switching from Cloudinary to Google Drive for Image Storage

## Why Google Drive is Better for This Project

We've encountered several issues with Cloudinary that make Google Drive a better option for our image storage needs:

1. **API Rate Limits**: Cloudinary has strict API rate limits (500 operations per hour), which we're hitting frequently
2. **Complex Folder Structure**: The folder structure we planned (`home/brands/beer/heineken_pint/`) isn't working as expected
3. **File Format Conversion**: Cloudinary automatically converts our JPG files to SVG format, creating inconsistencies
4. **URL Format Complexities**: Cloudinary uses version numbers in URLs that are difficult to predict/manage

Google Drive offers:
1. **Simpler URL Structure**: Direct links that are easy to use and understand
2. **No API Rate Limits** for basic image viewing
3. **No Automatic Conversions**: What you upload is what gets served
4. **Familiar Interface**: Easy to organize and manage files through the familiar Google Drive UI

## Implementation Details

I've created:

1. **`client/src/lib/google-drive-utils.ts`**: A replacement for our Cloudinary utilities
2. **`client/src/hooks/use-google-drive-images.ts`**: A React hook for using Google Drive images
3. **`GOOGLE_DRIVE_IMAGE_GUIDE.md`**: A comprehensive guide for setting up and using Google Drive

## Next Steps

1. Follow the setup steps in `GOOGLE_DRIVE_IMAGE_GUIDE.md` to create your Google Drive image repository
2. Update component imports to use the new Google Drive utilities
3. Add your image URLs to the `drinkImageMap` in `google-drive-utils.ts`

## Code Example: Using Google Drive Images in a Component

```tsx
// Before (using Cloudinary):
import useDrinkImages from '@/hooks/use-drink-images';

function DrinkCard({ drinkName }) {
  const { getImageUrl } = useDrinkImages();
  const imageUrl = getImageUrl(drinkName);
  
  return <img src={imageUrl} alt={drinkName} />;
}

// After (using Google Drive):
import useDrinkImages from '@/hooks/use-google-drive-images';

function DrinkCard({ drinkName }) {
  const { getImageUrl } = useDrinkImages();
  const imageUrl = getImageUrl(drinkName);
  
  return <img src={imageUrl} alt={drinkName} />;
}
```

As you can see, the switch is very simple since we've maintained compatible APIs between the two implementations.

## Additional Benefits

1. **Direct Control**: You can update images in Google Drive directly without code changes
2. **Error Visibility**: Google Drive makes it immediately obvious if an image is missing
3. **Collaborative Management**: Multiple team members can manage the image repository
4. **Versioning**: Google Drive maintains version history for your files

## Using Placeholder Images During Transition

During the transition, we're using placeholder images that reflect the drink types. Once you upload actual images to Google Drive and update the URLs in the code, these will be replaced with your real images.