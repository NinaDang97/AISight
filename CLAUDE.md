# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

** Important:  Never include emojis or decorative markers in any texts, messages or responses**

## Project Overview

AISight is a React Native mobile application for marine traffic tracking, developed for TUNI course COMP.SE.610/620. The app runs on Android (primary platform) and includes features for mapping, GNSS data collection, and location tracking.

**Key Technologies:**
- React Native 0.76.8 with TypeScript
- React Navigation (stack + bottom tabs)
- MapLibre for mapping
- Custom native modules (Kotlin) for GNSS data collection

## Development Commands

### Initial Setup
```bash
npm install
# Start Metro bundler (run in separate terminal)
npm start
# Build and run on Android emulator
npm run android
```

### Testing & Quality
```bash
npm test          # Run Jest tests
npm run lint      # Run ESLint
```

### iOS Setup (if needed)
```bash
bundle install
bundle exec pod install
npm run ios
```

### Troubleshooting
- Clean Gradle cache: `cd android && .\gradlew clean && .\gradlew --stop`
- Diagnose environment: `npx react-native doctor`
- Reset to remote state: `git reset`

**Important:** Always run scripts in **elevated PowerShell** on Windows. Run `npm install` after pulling new code to update dependencies.

## Architecture

### Navigation Hierarchy
The app uses a nested navigation structure managed by React Navigation:

```
RootNavigator (Stack)
├── Splash Screen
├── OnboardingNavigator (Stack)
│   ├── Welcome
│   ├── Permissions
│   └── Tutorial
└── MainTabNavigator (Bottom Tabs)
    ├── HomeTab → HomeStackNavigator
    ├── MapTab → MapStackNavigator
    ├── ProfileTab → ProfileStackNavigator
    ├── SettingsTab → SettingsStackNavigator
    └── GnssTab → GnssStackNavigator
```

**Navigation Flow:**
1. Splash screen on launch
2. Onboarding for new users
3. Main app interface with 5 bottom tabs

**Type-Safe Navigation:**
- Route names defined in `src/navigation/routes/index.ts` using `Routes` const object
- All navigators have corresponding TypeScript param lists
- Use `navigationRef` from `src/navigation/helpers/navigationRef.ts` for imperative navigation

### Native Modules

**GnssModule** (Kotlin): Bridges Android GNSS/Location APIs to React Native
- **Location:** `android/app/src/main/java/com/aisight/gnss/GnssModule.kt`
- **JS Interface:** `src/native/GnssModule.ts`
- **Registration:** Added to `MainApplication.kt` as custom React package

**Capabilities:**
- Start/stop GNSS measurements and location updates
- Raw GNSS data logging to NDJSON format
- Export logs as raw JSON or GeoJSON (for MapLibre)
- Event-driven updates via React Native DeviceEventEmitter

**Events emitted:**
- `gnssLocation` - Location updates (lat/lon/alt/accuracy)
- `gnssStatus` - Satellite status (count, CN0, constellations)
- `gnssMeasurement` - Raw GNSS measurements (Android 7+)

**Important:** Module uses static state for logging to persist across instance recreation. Always check `isLogging` state before modifying log files.

### Project Structure
```
src/
├── components/common/     # Reusable UI components (Button, SafeAreaWrapper)
├── map/                   # MapLibre integration
│   └── map-styles/        # Map style configurations
├── native/                # Native module TypeScript interfaces
├── navigation/
│   ├── helpers/           # Navigation utilities (navigationRef)
│   ├── navigators/        # Navigator components
│   ├── routes/            # Route definitions and types
│   └── types.ts           # Navigation type definitions
├── screens/               # Screen components organized by feature
└── styles/                # Global styles and themes

android/
└── app/src/main/java/com/aisight/
    ├── MainActivity.kt
    ├── MainApplication.kt
    └── gnss/              # GNSS native module
```

## Android Configuration

**Build Settings** (`android/build.gradle`):
- Min SDK: 24 (Android 7.0)
- Target SDK: 34
- Compile SDK: 35
- Kotlin: 1.9.25

**Permissions** (AndroidManifest.xml):
- `INTERNET` - For map tiles
- `ACCESS_FINE_LOCATION` - For GNSS data
- `ACCESS_COARSE_LOCATION` - Fallback location

**Required Environment:**
- Android Virtual Device with Android SDK 35
- Gradle properly configured (delete `~/.gradle` if issues occur)
- Emulator must run before `npm run android`

## Code Style & Conventions

**ESLint Configuration:**
- TypeScript recommended rules enabled
- React hooks validation enforced
- Prettier integration for formatting
- Unused vars prefixed with `_` are allowed
- No `console.log` (use `console.warn` or `console.error`)

**Import Organization:**
- Imports are sorted case-insensitively
- No duplicate imports allowed

**React Conventions:**
- Functional components with hooks (no class components)
- Prop types not needed (TypeScript handles validation)
- No `React.` prefix needed for JSX (React 17+)

## Communication Style

**IMPORTANT: Never use emojis or decorative markers in code, commit messages, or communication.**

- Do not use emojis (no robot icons, checkmarks, arrows, etc.)
- Use plain text only for all communication
- In documentation and comments, use "*" for multiplication (e.g., "2 * 3 = 6")
- Keep all text professional and marker-free

## MapLibre Integration

The app uses `@maplibre/maplibre-react-native` for mapping:
- Default map style in `src/map/map-styles/styles.ts`
- Map centered on coordinates: `[19.93481, 60.09726]` (Maarianhamina region)
- GeoJSON support for displaying GNSS tracks
- Dynamic layer management for adding/removing map features

## Common Development Workflows

### Adding a New Screen
1. Create component in `src/screens/<FeatureName>/`
2. Add route name to `src/navigation/routes/index.ts`
3. Update corresponding param list type
4. Add to appropriate navigator in `src/navigation/navigators/`

### Adding a New Native Module Method
1. Add Kotlin method with `@ReactMethod` annotation
2. Update TypeScript interface in `src/native/`
3. If method emits events, register listeners in React component
4. Use `addListener`/`removeListeners` methods for proper cleanup

### Working with GNSS Data
- Always request location permissions before calling `GnssModule.start()`
- Use React Native's `PermissionsAndroid` API
- Handle permission denials gracefully
- Clean up listeners in `useEffect` cleanup functions

## Git Workflow

**IMPORTANT: NEVER push to the main branch without explicit instructions from the user.**

- Work on feature branches (e.g., `dev_jrauta`, `dev_sadid`)
- Merge branches locally for testing
- Only push to main when explicitly asked by the user
- Always confirm before executing any `git push` commands to main or origin/main
- Never include emojis or decorative markers in commit messages
- Keep commit messages professional and plain text only

## Testing Notes

- Jest configured with `react-native` preset
- Test files: `*.test.ts`, `*.test.tsx`, or `**/__tests__/**`
- `@typescript-eslint/no-explicit-any` disabled in tests
- Run individual test: `npm test -- <test-file-path>`
