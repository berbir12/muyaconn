

# EAS Setup Guide

## Step 1: Login to Expo
```bash
npx expo login
```
Enter your email/username and password when prompted.

## Step 2: Initialize EAS Project
```bash
npx eas init
```
This will:
- Create an EAS project
- Update your app.json with the correct project ID
- Set up the necessary configuration

## Step 3: Configure Build Settings
```bash
npx eas build:configure
```
This will create an `eas.json` file with build configurations.

## Step 4: Build for Development (Optional)
```bash
npx eas build --platform ios --profile development
```
or
```bash
npx eas build --platform android --profile development
```

## Step 5: Build for Production
```bash
npx eas build --platform all --profile production
```

## Step 6: Submit to App Stores
```bash
npx eas submit --platform ios
npx eas submit --platform android
```

## Important Notes:
- Make sure you have an Apple Developer account for iOS builds
- Make sure you have a Google Play Console account for Android builds
- The first build will take longer as it sets up the build environment
- You'll need to configure your app store credentials in EAS

## Current Status:
✅ Splash screen issue fixed (splash.png created)
⏳ Need to login to Expo
⏳ Need to initialize EAS project
⏳ Need to configure build settings
