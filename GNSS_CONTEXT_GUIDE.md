# GNSS Context - Implementation Guide

## Overview

The `GnssContext` provides centralized GNSS data management across the application. It handles:
- Starting/stopping GNSS tracking
- Managing event listeners for real-time satellite data
- Logging GNSS data to CSV files
- Sharing data across multiple screens without multiple start() calls

## How It Works

### Architecture

1. **Single Source of Truth**: The context maintains one active GNSS module instance
2. **Event-Driven Updates**: Uses `DeviceEventEmitter` to receive data from native Android module
3. **Automatic Cleanup**: Manages listener lifecycle to prevent memory leaks
4. **State Management**: Provides reactive state updates to all consuming components

### Data Flow

```
Native Android GNSS Module
  ↓ (emits events)
DeviceEventEmitter
  ↓ (listeners)
GnssContext State (location, status, measurements)
  ↓ (useGnss hook)
React Components (GnssScreen, MapScreen, etc.)
```

## Usage in Screens

### Step 1: Import the Hook

```typescript
import { useGnss } from '../../components/contexts';
```

### Step 2: Access GNSS Data

```typescript
export const YourScreen = () => {
  // Destructure what you need from the context
  const {
    // State
    isTracking,      // boolean - is GNSS currently tracking
    isLogging,       // boolean - is data being logged to file
    location,        // GnssLocation | null - current GPS position
    status,          // GnssStatus | null - satellite status
    measurements,    // GnssMeasurement[] - raw GNSS measurements
    isGpsEnabled,    // boolean - is GPS enabled on device

    // Control functions
    startTracking,   // () => Promise<boolean>
    stopTracking,    // () => Promise<void>
    startLogging,    // (fileName?: string) => Promise<string | null>
    stopLogging,     // () => Promise<void>
  } = useGnss();

  // Use the data in your component
  return (
    <View>
      {isTracking && location && (
        <Text>
          Position: {location.latitude}, {location.longitude}
        </Text>
      )}
      {status && (
        <Text>
          Satellites: {status.satellitesUsed} / {status.satellitesInView}
        </Text>
      )}
    </View>
  );
};
```

### Step 3: Control Tracking (Optional)

Most screens will just **read** data. Only screens that need to control tracking (like GnssScreen) should call start/stop:

```typescript
// Start tracking (checks permissions automatically)
const handleStart = async () => {
  const success = await startTracking();
  if (!success) {
    Alert.alert('Error', 'Failed to start GNSS tracking');
  }
};

// Stop tracking
const handleStop = async () => {
  await stopTracking();
};
```

## Data Types

### GnssLocation
```typescript
{
  provider: string;      // "gps"
  latitude: number;      // degrees
  longitude: number;     // degrees
  altitude?: number;     // meters above sea level
  accuracy?: number;     // horizontal accuracy in meters
  speed?: number;        // meters per second
  bearing?: number;      // degrees (0-360)
  time: number;          // milliseconds since epoch
}
```

### GnssStatus
```typescript
{
  satellitesInView: number;              // total visible satellites
  satellitesUsed: number;                // satellites used for fix
  avgCn0DbHz?: number;                   // average signal strength
  constellations?: Record<string, number>; // e.g., { GPS: 12, GALILEO: 8 }
}
```

### GnssMeasurement
```typescript
{
  svid: number;              // satellite vehicle ID
  cn0DbHz?: number;          // signal strength
  constellation?: string;    // GPS, GLONASS, GALILEO, etc.
  carrierFrequencyHz?: number;
  timeNanos?: number;
}
```

## Best Practices

### 1. Read-Only Access (Recommended for Most Screens)

```typescript
// Good: Just read the data
const { location, status, isTracking } = useGnss();

useEffect(() => {
  if (isTracking && location) {
    // Use location data for your features
    updateMap(location);
  }
}, [isTracking, location]);
```

### 2. Avoid Multiple start() Calls

```typescript
// Bad: Don't start tracking in every screen
const MyScreen = () => {
  useEffect(() => {
    startTracking(); // ❌ Don't do this
  }, []);
};

// Good: Let GnssScreen control tracking, just read the data
const MyScreen = () => {
  const { location, isTracking } = useGnss();
  // ✅ Just use the data
};
```

### 3. Handle Null States

```typescript
const { location, status } = useGnss();

// Always check for null
if (!location) {
  return <Text>No GPS data available</Text>;
}

// Safe to use
const coords = `${location.latitude}, ${location.longitude}`;
```

### 4. Logging Data

```typescript
// Start logging with automatic timestamp-based filename
const handleStartLogging = async () => {
  const filePath = await startLogging();
  if (filePath) {
    console.log('Logging to:', filePath);
  }
};

// Or with custom filename
const filePath = await startLogging('my_custom_log.csv');

// Stop logging
await stopLogging();
```

## Implementation Notes

### Why DeviceEventEmitter?

React Native 0.76+ with bridgeless mode doesn't support the standard event emission for custom native modules. We use `DeviceEventEmitter` as it's the working solution for this architecture.

### Automatic Cleanup

The context automatically:
- Removes all event listeners when tracking stops
- Cleans up on component unmount
- Prevents memory leaks

### Permission Handling

`startTracking()` automatically:
1. Checks if GPS is enabled
2. Requests location permissions if needed
3. Returns `false` if either check fails

### Logging

- Logs are saved to app's internal storage as CSV files
- Filenames are auto-generated with timestamps: `gnss_log_2025-11-11_20-15-30.csv`
- Includes location, satellite status, and raw measurements
- Can be exported to Downloads folder (see GnssScreen for example)

## Example: Anomaly Screen Integration

See the commented demo code in [AnomalyScreen.tsx](src/screens/AnomalyScreen/AnomalyScreen.tsx):

```typescript
// 1. Import the hook
import { useGnss } from '../../components/contexts';

// 2. Access the data
const { location, status, isTracking } = useGnss();

// 3. Display the data
{isTracking && (
  <View>
    <Text>GNSS Tracking Active</Text>
    {location && (
      <Text>Position: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</Text>
    )}
    {status && (
      <Text>Satellites: {status.satellitesUsed} / {status.satellitesInView}</Text>
    )}
  </View>
)}
```

**To remove demo code before commit:**
1. Remove the import line (line 6)
2. Remove the useGnss() call (line 25)
3. Remove the display block (lines 200-216)

## Troubleshooting

### No Data Appearing

1. **Check if tracking is active**: `isTracking` should be `true`
2. **Check GPS**: Ensure device GPS is enabled
3. **Check permissions**: Location permission must be granted
4. **Go outside**: GPS needs clear sky view for satellite signal

### Events Not Received

The context uses `DeviceEventEmitter` which works with bridgeless mode. If events aren't received, check:
- Native module is properly registered in `MainApplication.kt`
- Android build is up to date (`./gradlew clean` then rebuild)

### Logging Not Working

Check logcat for:
- `isLogging=true` when logging is enabled
- `Writing location to log file...` when data is written
- `logWriter=${logWriter != null}` should be `true`

If logging fails, check:
- Tracking must be active before logging
- Check available storage space
- Check logcat for write errors
