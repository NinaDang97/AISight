# AISight

A proof-of-concept Android application to monitor and detect GNSS anomalies in maritime domain. The app uses AIS data from Digitraffic (service by Fintraffic) to display realtime vessel movements in addition to data from Android devices built-in GNSS receiver. Other core tech used includes React Native development libraries and MapLibre. The project was done for TUNI project course COMP.SE.610/620 and it was collaborated together with TUNI GNSS unit.

<img width="200" alt="image" src="https://github.com/user-attachments/assets/bc3005dd-af54-4694-88f4-f41d476ebb2c" />
<img width="200" alt="image" src="https://github.com/user-attachments/assets/4f6a835e-b205-415b-a206-95eb0b3b1e4e" />
<img width="200" alt="image" src="https://github.com/user-attachments/assets/4b22bcbd-1c28-43b3-be0f-311d3d20560e" />

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


## Flow for development

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

## Building for production

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

# The built apk should appear in folder android\app\build\outputs\apk\release
```



This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).
