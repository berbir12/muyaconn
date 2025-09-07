# Fix Icon Dimensions

## Issue
Your app icons are 512x513 pixels instead of the required 512x512 pixels (square).

## Files to Fix
- `./assets/images/icon.png` (512x513 → 512x512)
- `./assets/images/adaptive-icon.png` (512x513 → 512x512)

## Solutions

### Option 1: Use Online Tool
1. Go to https://www.iloveimg.com/resize-image
2. Upload your icon files
3. Set dimensions to 512x512
4. Download and replace the files

### Option 2: Use ImageMagick (if installed)
```bash
magick assets/images/icon.png -resize 512x512! assets/images/icon.png
magick assets/images/adaptive-icon.png -resize 512x512! assets/images/adaptive-icon.png
```

### Option 3: Use GIMP/Photoshop
1. Open the icon files
2. Resize to 512x512 pixels
3. Save and replace

### Option 4: Create New Icons
If you don't have the original source files, you can create new square icons using:
- Canva (https://canva.com)
- Figma (https://figma.com)
- Adobe Express (https://express.adobe.com)

## After Fixing
Run `npx expo-doctor` again to verify the icons are now square.

## Current Status
✅ Splash screen fixed
✅ App.json configuration fixed
✅ Dependencies updated
✅ Lock files cleaned up
⏳ Icon dimensions need fixing
⏳ EAS setup pending
