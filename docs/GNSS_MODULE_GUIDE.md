# GNSS Module - Guide

## Overview

**Key Features:**
- Real-time location updates (1 Hz)
- Satellite status (count, signal strength, constellations)
- Raw GNSS measurements
- CSV logging with export to Downloads
- Global state management (logging can be controlled from anywhere)

---

## Quick Start

### Import the Module

```typescript
import { NativeModules, NativeEventEmitter } from 'react-native';
import {
  GnssModule,
  GnssExportModule,
  GnssLocation,
  GnssStatus,
  GnssMeasurement,
} from '../../native/GnssModule';

// Create event emitter
const GnssNativeModule = NativeModules.GnssModule;
const gnssEvents = new NativeEventEmitter(GnssNativeModule);
```

### Basic Usage

```typescript
function MyComponent() {
  const [location, setLocation] = useState<GnssLocation | null>(null);

  useEffect(() => {
    // Start GNSS collection
    GnssModule.start();

    // Listen to location updates
    const subscription = gnssEvents.addListener('gnssLocation', (data) => {
      setLocation(data);
    });

    // Cleanup
    return () => {
      subscription.remove();
      GnssModule.stop();
    };
  }, []);

  return (
    <Text>
      Position: {location?.latitude}, {location?.longitude}
    </Text>
  );
}
```

---

## Available Events

The module emits three types of events. You can subscribe to any or all of them depending on your needs.

### 1. `gnssLocation` - Position Updates

**Frequency:** ~1 Hz (every second)

**Data Structure:**
```typescript
type GnssLocation = {
  provider: string;      // "gps" or "network"
  latitude: number;      // degrees (-90 to 90)
  longitude: number;     // degrees (-180 to 180)
  altitude?: number;     // meters above sea level
  accuracy?: number;     // horizontal accuracy in meters
  speed?: number;        // meters per second
  bearing?: number;      // degrees (0-360, 0=North)
  time: number;          // milliseconds since epoch
};
```

**Example Data:**
```json
{
  "provider": "gps",
  "latitude": 60.16952,
  "longitude": 24.93545,
  "altitude": 45.2,
  "accuracy": 3.8,
  "speed": 0.5,
  "bearing": 180.5,
  "time": 1729686152000
}
```

**Usage Example:**
```typescript
gnssEvents.addListener('gnssLocation', (data: GnssLocation) => {
  console.log(`Lat: ${data.latitude}, Lon: ${data.longitude}`);
  console.log(`Accuracy: ${data.accuracy}m`);

  // Update map marker
  updateMapPosition(data.latitude, data.longitude);

  // Calculate speed in km/h
  const speedKmh = (data.speed || 0) * 3.6;
  console.log(`Speed: ${speedKmh.toFixed(1)} km/h`);
});
```

---

### 2. `gnssStatus` - Satellite Information

**Frequency:** ~1 Hz (when satellite status changes)

**Data Structure:**
```typescript
type GnssStatus = {
  satellitesInView: number;              // total satellites visible
  satellitesUsed: number;                // satellites used for position fix
  avgCn0DbHz?: number;                   // average signal strength (dB-Hz)
  constellations?: Record<string, number>; // count by system
};
```

**Example Data:**
```json
{
  "satellitesInView": 24,
  "satellitesUsed": 15,
  "avgCn0DbHz": 38.5,
  "constellations": {
    "GPS": 12,
    "GALILEO": 8,
    "GLONASS": 4
  }
}
```

**Usage Example:**
```typescript
gnssEvents.addListener('gnssStatus', (data: GnssStatus) => {
  // Check if we have a good fix
  if (data.satellitesUsed >= 4) {
    console.log('Good GPS fix!');
  } else {
    console.warn('Poor GPS signal');
  }

  // Categorize signal quality
  const signalQuality =
    data.avgCn0DbHz >= 40 ? 'Excellent' :
    data.avgCn0DbHz >= 35 ? 'Good' :
    data.avgCn0DbHz >= 30 ? 'Fair' : 'Poor';

  console.log(`Signal: ${signalQuality} (${data.avgCn0DbHz} dB-Hz)`);

  // Show constellation breakdown
  Object.entries(data.constellations || {}).forEach(([system, count]) => {
    console.log(`  ${system}: ${count} satellites`);
  });
});
```

---

### 3. `gnssMeasurement` - Raw Satellite Data

**Frequency:** Variable

**Note:** Only available on Android 7.0+ (API 24+)

**Data Structure:**
```typescript
type GnssMeasurement = {
  svid: number;              // satellite vehicle ID (unique identifier)
  cn0DbHz?: number;          // signal strength for this satellite
  constellation?: string;    // GPS, GLONASS, GALILEO, BEIDOU, etc.
  carrierFrequencyHz?: number; // radio frequency (Hz)
  timeNanos?: number;        // GNSS time (nanoseconds)
};
```

**Example Data (array of measurements):**
```json
[
  {
    "svid": 23,
    "cn0DbHz": 42.5,
    "constellation": "GPS",
    "carrierFrequencyHz": 1575420000,
    "timeNanos": 145823674523000
  },
  {
    "svid": 8,
    "cn0DbHz": 38.2,
    "constellation": "GALILEO",
    "carrierFrequencyHz": 1575420000,
    "timeNanos": 145823674523000
  },
  // ... 20-30 more satellites
]
```

**Usage Example:**
```typescript
gnssEvents.addListener('gnssMeasurement', (measurements: GnssMeasurement[]) => {
  console.log(`Tracking ${measurements.length} satellites`);

  // Find strongest satellite
  const strongest = measurements.reduce((max, m) =>
    (m.cn0DbHz || 0) > (max.cn0DbHz || 0) ? m : max
  );
  console.log(`Strongest: ${strongest.constellation} SV${strongest.svid} at ${strongest.cn0DbHz} dB-Hz`);

  // Group by constellation
  const byConstellation = measurements.reduce((acc, m) => {
    const system = m.constellation || 'Unknown';
    if (!acc[system]) acc[system] = [];
    acc[system].push(m);
    return acc;
  }, {} as Record<string, GnssMeasurement[]>);

  // Display by system
  Object.entries(byConstellation).forEach(([system, sats]) => {
    console.log(`${system}: ${sats.length} satellites`);
  });
});
```

---

## Native Module Methods

### `GnssModule.start(): Promise<void>`

Starts GNSS data collection. Must be called before receiving events.

**Requirements:**
- Location permission must be granted
- Only works on Android

```typescript
// Request permission first
const result = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);

if (result === RESULTS.GRANTED) {
  await GnssModule.start();
  console.log('GNSS started');
}
```

---

### `GnssModule.stop(): Promise<void>`

Stops GNSS data collection and event emissions.

```typescript
await GnssModule.stop();
console.log('GNSS stopped');
```

---

### `GnssModule.setRawLogging(enabled: boolean, fileName?: string): Promise<string | null>`

Starts or stops CSV logging.

**Parameters:**
- `enabled` - `true` to start logging, `false` to stop
- `fileName` - Optional custom filename (default: `gnss_log_YYYYMMDD_HHMMSS.csv`)

**Returns:** File path when starting, `null` when stopping

```typescript
// Start logging
const logPath = await GnssModule.setRawLogging(true, null);
console.log(`Logging to: ${logPath}`);
// Example: /data/user/0/com.aisight/files/gnss/gnss_log_20241023_143052.csv

// Stop logging
await GnssModule.setRawLogging(false, null);
```

---

### `GnssModule.getRawLogPath(): Promise<string | null>`

Gets the current log file path.

```typescript
const path = await GnssModule.getRawLogPath();
if (path) {
  console.log(`Current log: ${path}`);
}
```

---

### `GnssModule.getLoggingState(): Promise<LoggingState>`

Gets complete logging state information.

```typescript
type LoggingState = {
  isLogging: boolean;
  logFilePath?: string;
  linesWritten: number;
};

const state = await GnssModule.getLoggingState();
console.log(`Logging: ${state.isLogging}`);
console.log(`File: ${state.logFilePath}`);
console.log(`Lines: ${state.linesWritten}`);
```

---

### `GnssExportModule.exportCSV(logFilePath: string, displayName?: string): Promise<string>`

Exports the CSV log file to Downloads/Aisight folder.

**Parameters:**
- `logFilePath` - Path from `getRawLogPath()` or `getLoggingState()`
- `displayName` - Optional custom filename (default: `gnss_data_YYYYMMDD_HHMMSS.csv`)

**Returns:** URI (Android 10+) or absolute path (Android 9-)

```typescript
const logPath = await GnssModule.getRawLogPath();
if (logPath) {
  const exportedPath = await GnssExportModule.exportCSV(logPath, null);
  console.log(`Exported to: ${exportedPath}`);
  Alert.alert('Success', `Saved to Downloads/Aisight`);
}
```

---

## CSV Log Format

The CSV log contains both location and measurement data in a single file.

**Columns:**
```
timestamp,datetime,type,latitude,longitude,altitude,accuracy,speed,bearing,provider,svid,constellation,cn0DbHz,carrierFrequencyHz,timeNanos
```

**Location Row Example:**
```csv
1729686152000,2024-10-23 14:35:52.000,location,60.16952,24.93545,45.2,3.8,0.5,180.5,gps,,,,,
```

**Measurement Row Example:**
```csv
1729686152123,2024-10-23 14:35:52.123,measurement,,,,,,,,,23,GPS,42.5,1575420000,145823674523000
```

**Usage:** Import into Excel, Google Sheets, Python pandas, R, etc.

---

## Common Use Cases

### Use Case 1: Display Current Position on Map

```typescript
function MapScreen() {
  const [position, setPosition] = useState<{lat: number, lon: number} | null>(null);

  useEffect(() => {
    GnssModule.start();

    const sub = gnssEvents.addListener('gnssLocation', (data) => {
      setPosition({ lat: data.latitude, lon: data.longitude });
    });

    return () => {
      sub.remove();
      GnssModule.stop();
    };
  }, []);

  return (
    <MapView
      center={position}
      zoom={15}
    />
  );
}
```

---

### Use Case 2: Track Distance Traveled

```typescript
function DistanceTracker() {
  const [distance, setDistance] = useState(0);
  const [lastPos, setLastPos] = useState<GnssLocation | null>(null);

  useEffect(() => {
    GnssModule.start();

    const sub = gnssEvents.addListener('gnssLocation', (data) => {
      if (lastPos) {
        const dist = calculateDistance(
          lastPos.latitude, lastPos.longitude,
          data.latitude, data.longitude
        );
        setDistance(prev => prev + dist);
      }
      setLastPos(data);
    });

    return () => {
      sub.remove();
      GnssModule.stop();
    };
  }, [lastPos]);

  return <Text>Distance: {(distance / 1000).toFixed(2)} km</Text>;
}

// Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}
```

---

### Use Case 3: GPS Quality Indicator

```typescript
function GPSQualityIndicator() {
  const [quality, setQuality] = useState<string>('Unknown');
  const [color, setColor] = useState<string>('gray');

  useEffect(() => {
    GnssModule.start();

    const sub = gnssEvents.addListener('gnssStatus', (data) => {
      // Determine quality based on satellites and signal
      if (data.satellitesUsed >= 10 && (data.avgCn0DbHz || 0) >= 40) {
        setQuality('Excellent');
        setColor('green');
      } else if (data.satellitesUsed >= 6 && (data.avgCn0DbHz || 0) >= 35) {
        setQuality('Good');
        setColor('lightgreen');
      } else if (data.satellitesUsed >= 4) {
        setQuality('Fair');
        setColor('orange');
      } else {
        setQuality('Poor');
        setColor('red');
      }
    });

    return () => {
      sub.remove();
      GnssModule.stop();
    };
  }, []);

  return (
    <View style={{ backgroundColor: color, padding: 10, borderRadius: 5 }}>
      <Text>GPS Quality: {quality}</Text>
    </View>
  );
}
```

---

### Use Case 4: Record Track with Logging

```typescript
function TrackRecorder() {
  const [recording, setRecording] = useState(false);
  const [logPath, setLogPath] = useState<string | null>(null);

  const startRecording = async () => {
    await GnssModule.start();
    const path = await GnssModule.setRawLogging(true, null);
    setLogPath(path);
    setRecording(true);
  };

  const stopRecording = async () => {
    await GnssModule.setRawLogging(false, null);
    setRecording(false);
  };

  const exportTrack = async () => {
    if (logPath) {
      const exportPath = await GnssExportModule.exportCSV(logPath, 'my_track.csv');
      Alert.alert('Exported', `Track saved to Downloads/Aisight\n${exportPath}`);
    }
  };

  return (
    <View>
      <Button
        title={recording ? "Stop Recording" : "Start Recording"}
        onPress={recording ? stopRecording : startRecording}
      />
      {logPath && !recording && (
        <Button title="Export Track" onPress={exportTrack} />
      )}
    </View>
  );
}
```

---

### Use Case 5: Speed Display with Units

```typescript
function SpeedDisplay() {
  const [speed, setSpeed] = useState(0);

  useEffect(() => {
    GnssModule.start();

    const sub = gnssEvents.addListener('gnssLocation', (data) => {
      // Convert m/s to km/h
      const kmh = (data.speed || 0) * 3.6;
      setSpeed(kmh);
    });

    return () => {
      sub.remove();
      GnssModule.stop();
    };
  }, []);

  return (
    <View>
      <Text style={{ fontSize: 48 }}>{speed.toFixed(1)}</Text>
      <Text style={{ fontSize: 16 }}>km/h</Text>
      <Text style={{ fontSize: 12 }}>
        {(speed / 1.60934).toFixed(1)} mph
      </Text>
    </View>
  );
}
```

---

## Helper Functions

### Format Latitude/Longitude

```typescript
function formatCoordinate(value: number, isLatitude: boolean): string {
  const direction = isLatitude
    ? (value >= 0 ? 'N' : 'S')
    : (value >= 0 ? 'E' : 'W');

  const abs = Math.abs(value);
  const degrees = Math.floor(abs);
  const minutes = (abs - degrees) * 60;

  return `${degrees}° ${minutes.toFixed(3)}' ${direction}`;
}

// Usage:
// formatCoordinate(60.16952, true)  → "60° 10.171' N"
// formatCoordinate(24.93545, false) → "24° 56.127' E"
```

### Convert Bearing to Direction

```typescript
function bearingToDirection(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

// Usage:
// bearingToDirection(0)    → "N"
// bearingToDirection(45)   → "NE"
// bearingToDirection(180)  → "S"
```

### Categorize Accuracy

```typescript
function categorizeAccuracy(accuracy: number): string {
  if (accuracy <= 5) return 'Excellent';
  if (accuracy <= 10) return 'Good';
  if (accuracy <= 20) return 'Fair';
  if (accuracy <= 50) return 'Poor';
  return 'Very Poor';
}
```

### Format Timestamp

```typescript
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);

  // Simple format
  return date.toLocaleString();

  // Or custom format
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}
```

---

## Best Practices

### 1. Always Clean Up Listeners

```typescript
useEffect(() => {
  const subscription = gnssEvents.addListener('gnssLocation', callback);

  return () => {
    subscription.remove(); // ✅ Always remove!
  };
}, []);
```

### 2. Check Permissions Before Starting

```typescript
const startGNSS = async () => {
  const result = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);

  if (result !== RESULTS.GRANTED) {
    Alert.alert('Permission Required', 'Location permission is needed');
    return;
  }

  await GnssModule.start();
};
```

### 3. Handle Optional Fields

```typescript
gnssEvents.addListener('gnssLocation', (data) => {
  // Use optional chaining and default values
  const altitude = data.altitude ?? 0;
  const speed = data.speed ?? 0;

  // Or check before using
  if (data.accuracy !== undefined) {
    console.log(`Accuracy: ${data.accuracy}m`);
  }
});
```

### 4. Stop GNSS When Not Needed

```typescript
// Stop when app goes to background
useEffect(() => {
  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'background') {
      GnssModule.stop();
    } else if (state === 'active') {
      GnssModule.start();
    }
  });

  return () => subscription.remove();
}, []);
```

---

## Troubleshooting

### No Events Received

**Problem:** Listener is set up but no data arrives

**Solutions:**
1. Check if `GnssModule.start()` was called
2. Verify location permission is granted
3. Make sure device has GPS enabled
4. Check if listener was added before `start()`

```typescript
// ✅ Correct order
await GnssModule.start();
gnssEvents.addListener('gnssLocation', callback);

// ❌ Wrong - listener added after start might miss initial events
gnssEvents.addListener('gnssLocation', callback);
await GnssModule.start();
```

---

### Poor GPS Signal Indoors

**Problem:** Low satellite count or no fix indoors

**Solutions:**
- Move near a window
- Go outside for better signal
- Check `satellitesUsed` count (need at least 4 for fix)
- Use `provider: "network"` as fallback (less accurate)

---

### Logging Not Working

**Problem:** CSV file is empty or not created

**Solutions:**
1. Check if logging was started: `await GnssModule.setRawLogging(true, null)`
2. Verify GNSS is running: `await GnssModule.start()`
3. Check logging state: `await GnssModule.getLoggingState()`
4. Make sure data is being received (check events)

---

### Export Fails

**Problem:** Export to Downloads fails

**Solutions:**
1. Check if log file exists: `const path = await GnssModule.getRawLogPath()`
2. Ensure storage permission (automatic on Android 10+)
3. Check device storage space
4. Try with `null` display name first

---

## Performance Considerations

### Event Frequency

- **Location:** ~1 Hz (every second)
- **Status:** ~1 Hz (when changed)
- **Measurements:** Variable (1-10 Hz, device-dependent)

### Memory Usage

- Each event creates a new JavaScript object
- Remove listeners when not needed
- Don't store large arrays in state

```typescript
// ❌ Bad - stores all measurements
const [allMeasurements, setAllMeasurements] = useState<GnssMeasurement[]>([]);

gnssEvents.addListener('gnssMeasurement', (data) => {
  setAllMeasurements(prev => [...prev, ...data]); // Memory grows unbounded!
});

// ✅ Good - only stores latest
const [latestMeasurements, setLatestMeasurements] = useState<GnssMeasurement[]>([]);

gnssEvents.addListener('gnssMeasurement', (data) => {
  setLatestMeasurements(data); // Replaces previous
});
```