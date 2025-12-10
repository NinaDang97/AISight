# AISight

Repository for TUNI course COMP.SE.610/620

## First time running steps and some tips for setting the environment

> Running scripts in elevated powershell is vital!

1. Setup your environment according to [this guide](https://reactnative.dev/docs/set-up-your-environment)
2. **⚠️ IMPORTANT: Set up environment variables** - See [SECURITY_SETUP.md](SECURITY_SETUP.md) for instructions
   ```sh
   cp .env.example .env
   # Edit .env and add your MapTiler API key
   ```
3. Create AVD (Android Virual Device) with Android 35 SDK and bring it up and running.
4. Run the development servers. The project was initialized according to [this guide](https://reactnative.dev/docs/getting-started-without-a-framework)
``` sh
npm install
npm start # this will start Metro (javascript build tool), suggested to be running in its own terminal
npm run android # this should open an android emulator and after a while it should install the app
```
5. Try doing some changes in the codebase and see if the changes are reflected

### Code formatting
The project supports Prettier for code formatting so following should make your life a little bit easier
1. Install Prettier VS Code extension
2. In VS Code select Prettier as you default formatter
   - If you `Ctrl+Shift+P` and run `Format Document` it should as you to configure your default on your first run
3. (Set autoformatting on: `Settings => Format on save`)


## Flow for development (there can be better ways to do stuff)

0. After `git pull`ing your code remember to `npm install` to get the new packages
1. Start your android emulator either from 
  - Android Studio => Virtual Device Manager
  - from shell (you get more logs this way) deault path in Windows `C:\Users\<USER>\AppData\Local\Android\Sdk\emulator`
2. From elevated shell navigate to repo and `npm start` to run the node server
3. Open another elevated shell and from repo `npm run android`
  - This should install the application to the emulator and start it automatically
  - Running this script will start development server and emulator on its own but at least I had some issues with running it this way
4. Try doing some changes in the code and save. Changes should be reflected after loading.

## Troubleshooting
- You can try running the React Native doctor to diagnose any remaining problems: `npx react-native doctor`
- Gradle seems to be a little bit pain in the back. Uninstalling `c:/users/<user>/.gradle` and running the `android` script seems to solve some things
- To clean gradel cache do following
``` sh
# in repo folder
cd android
.\gradle clean

# if it doesn't work try stopping the gradle service with
.\gradlew --stop

# to display gradle instances
.\gradlew --status
```
- If you are running this on a laptop and your avd is not starting, it may be due to screen size being too small. I switched display scaling from 125% too 100% and emulator started succesfully.

- You can clear Metro cache by running
``` sh
npm start -- --reset-cache
```

- If changing environments becomes a problem (doing changes in `.env` files), try uninstalling the app manually from the device and then reinstalling. Also try cleaning any caches before reinstallation. 

# Building for production

Following should work at least on Windows with elevated Powershell

``` sh
# Clean gradle cache
cd android
./gradlew clean

# Run metro and clean its cache
npm start -- --reset-cache

# !! Remove the application from the connected device

# Build the app for production
npm run android -- --mode="release"

```



This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).



# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
