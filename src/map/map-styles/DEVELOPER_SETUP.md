# AISight Environment Setup Guide

## What We're Using

AISight uses environment variables to manage configuration settings like API keys. This approach:
- Keeps sensitive keys out of our code repository
- Allows each developer to use their own API keys
- Makes it easy to switch between development and production settings

## Setup Instructions for New Developers

### 1. Set Up Your Environment Files

```bash
# First, copy the example file to create your base config
cp .env.example .env

# Then create your personal development environment file
cp .env.example .env.development
```

### 2. Get Your MapTiler API Key

The app uses MapTiler for maps, which requires an API key:

1. Create a free account at [MapTiler Cloud](https://www.maptiler.com/cloud/)
2. Go to "Keys" and generate a new API key
3. Open your [.env.development](cci:7://file:///Users/shaikat/Desktop/AISight/.env.development:0:0-0:0) file and add your key:
   ```
   MAPTILER_API_KEY=your_key_here
   ```

### 3. Run the App

You can run the app for development normally with the following commands. It is recommended (and maybe required) to clear npm cache before running the app with `.env` changes for the first time.

```bash
npm start -- --reset-cache

npm run android
# or
npm run ios
```

We've created special npm scripts that automatically use the right environment files:

```bash
# For development (uses your .env.development file)
npm run android:dev
# or
npm run ios:dev
```

The app will start with your personal API key and development settings.

## How It Works

- **react-native-dotenv** loads variables from environment files
- The `ENVFILE` parameter tells it which file to use
- Our config module ([src/config/environment.ts](cci:7://file:///Users/shaikat/Desktop/AISight/src/config/environment.ts:0:0-0:0)) provides access to these variables

## Troubleshooting

For running the app on Mac you can try

```bash
rm -rf $TMPDIR/metro-*
watchman watch-del-all
npm start -- --reset-cache
```

For running in Windows with Powershell you require a different commands. The ones included in `package.json` only work for MacOS and Linux. With the following line you should be able to run the app. Just change 'production' to e.g. development to run different `.env` files.  

```powershell
$env:ENVFILE=".env.production"; npx react-native run-android
```

## Common Questions

**Q: Do I need to commit my [.env.development](cci:7://file:///Users/shaikat/Desktop/AISight/.env.development:0:0-0:0) file?**  
A: No! All environment files are gitignored to keep API keys private.

**Q: How do I test production settings?**  
A: Create a `.env.production` file and run:
```bash
npm run android:prod
# or
npm run ios:prod
```

**Q: What if the map doesn't load?**  
A: Check that your MapTiler API key is correctly set in [.env.development](cci:7://file:///Users/shaikat/Desktop/AISight/.env.development:0:0-0:0)

**Q: How do environment variables work in the code?**  
A: We use the [getMapTilerApiKey()](cci:1://file:///Users/shaikat/Desktop/AISight/src/config/environment.ts:2:0-4:2) function from [src/config/environment.ts](cci:7://file:///Users/shaikat/Desktop/AISight/src/config/environment.ts:0:0-0:0) to access them

## Need Help?

If you encounter any issues with the environment setup, please reach out to the team lead.



## For Testing 

Let's test your environment variable setup to make sure everything is working correctly. Here's what you should do:

First, make sure your .env.development file has a valid MapTiler API key:
MAPTILER_API_KEY=your_actual_key_here
Run the app with the standard command:
bash
npm run android
# or
npm run ios
Check the console logs - you should see:
[ENV] Running in development environment
[ENV] MapTiler API key is set
Verify that the map loads correctly with the MapTiler style.
If you want to test the fallback behavior:

Temporarily remove or blank out the API key in your .env.development file
Run the app again
You should see the default MapLibre style instead of the MapTiler style
Check the console for the warning: "No MapTiler API key found in environment variables, using default MapLibre style"
Note that you removed the custom npm scripts (android:dev, etc.), so you'll need to manually specify the environment file if you want to test different environments:

bash
## ENVFILE=.env.development npm run android
# or
## ENVFILE=.env.production npm run android
Let me know how the testing goes!