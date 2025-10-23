import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
  Alert,
  Switch,
  Pressable,
} from "react-native";
import { request, PERMISSIONS, RESULTS } from "react-native-permissions";
import { NativeModules, NativeEventEmitter } from "react-native";
import {
  GnssModule,
  GnssExportModule,
  GnssLocation,
  GnssStatus,
  GnssMeasurement,
} from "../../native/GnssModule";

// Event emitter for listening to GNSS events
// Pass the native module instance to NativeEventEmitter to avoid warnings
const GnssNativeModule = NativeModules.GnssModule;
const gnssEvents = new NativeEventEmitter(GnssNativeModule);

export default function GnssScreen() {
  // ---------- React state ----------
  const [loc, setLoc] = useState<GnssLocation | null>(null);
  const [status, setStatus] = useState<GnssStatus | null>(null);
  const [measurements, setMeasurements] = useState<GnssMeasurement[]>([]);

  // Logging state
  const [logging, setLogging] = useState(false);
  const [logPath, setLogPath] = useState<string | null>(null);

  // Fetch logging state on mount and when toggling
  useEffect(() => {
    GnssModule.getLoggingState()
      .then(state => {
        setLogging(state.isLogging);
        setLogPath(state.logFilePath ?? null);
      })
      .catch(() => {});
  }, [logging]);

  useEffect(() => {
    // Subscribe to raw events
    const sub1 = gnssEvents.addListener("gnssLocation", (value: GnssLocation) => {
      setLoc(value);
    });

    const sub2 = gnssEvents.addListener("gnssStatus", (value: GnssStatus) => {
      setStatus(value);
    });

    const sub3 = gnssEvents.addListener("gnssMeasurement", (arr: GnssMeasurement[]) => {
      setMeasurements(arr);
    });

    // 2) Ask for permission and start native streaming when granted.
    (async () => {
      if (Platform.OS !== "android") {
        Alert.alert("Android only", "This demo GNSS module is implemented for Android.");
        return;
      }

      const res = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
      if (res === RESULTS.GRANTED) {
        await GnssModule.start();
      } else {
        Alert.alert("Permission needed", "Location permission is required to read GNSS data.");
      }
    })();

    // 3) Cleanup: unsubscribe and stop native when component unmounts
    // IMPORTANT: Empty dependency array - only run on mount/unmount!
    return () => {
      sub1.remove();
      sub2.remove();
      sub3.remove();
      if (Platform.OS === "android") {
        // Stop logging if active
        GnssModule.setRawLogging(false, null).catch(() => {});
        GnssModule.stop().catch(() => {});
      }
    };
  }, []); // ← Empty dependency array!

  const exportCSV = async () => {
    if (Platform.OS !== "android") {
      Alert.alert("Android only", "Export is implemented on Android.");
      return;
    }

    if (!logPath) {
      Alert.alert("No log file", "Please start logging first.");
      return;
    }

    try {
      const uriOrPath = await GnssExportModule.exportCSV(logPath, null);
      Alert.alert(
        "Exported",
        `Saved CSV to Downloads/Aisight\n\n${uriOrPath}`
      );
    } catch (e: any) {
      Alert.alert("Export failed", String(e?.message ?? e));
    }
  };

  /**
   * Toggle handler for the "Raw GNSS logging" switch.
   * - When turning ON: ask native to start logging (optional filename).
   *   Native returns the absolute file path; we show it in the UI.
   * - When turning OFF: ask native to stop logging and clear state.
   */
  const toggleLogging = async (next: boolean) => {
    if (Platform.OS !== "android") {
      Alert.alert("Android only", "Logging is implemented on Android.");
      return;
    }

    try {
      if (next) {
        const path = await GnssModule.setRawLogging(true, null);
        setLogPath(path ?? null);
        setLogging(true);
      } else {
        await GnssModule.setRawLogging(false, null);
        setLogPath(null);
        setLogging(false);
      }
    } catch (e: any) {
      Alert.alert("Logging error", String(e?.message ?? e));
    }
  };

  const refreshLogPath = async () => {
    try {
      const state = await GnssModule.getLoggingState();
      setLogPath(state.logFilePath ?? null);
      setLogging(state.isLogging);
      if (state.isLogging && !state.logFilePath) {
        Alert.alert("Log file", "Active logging, but path is not available yet.");
      }
    } catch {}
  };

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>GNSS</Text>

      {/* ---- Logging controls card ---- */}
      <View style={styles.card}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={styles.h2}>GNSS Data Logging</Text>
          {/* The Switch flips our logging state and tells native to start/stop writing CSV */}
          <Switch value={logging} onValueChange={toggleLogging} />
        </View>

        <Text style={{ marginTop: 6 }}>
          {logging
            ? `Writing CSV to:\n${logPath ?? "(resolving…)"}`
            : "Logging is off"}
        </Text>

        {logging && (
          <Pressable onPress={refreshLogPath} style={{ marginTop: 8 }}>
            <Text style={{ textDecorationLine: "underline" }}>Refresh log path</Text>
          </Pressable>
        )}

        {logPath ? (
          <Pressable onPress={exportCSV} style={{ marginTop: 8, padding: 8, backgroundColor: "#007AFF", borderRadius: 8 }}>
            <Text style={{ color: "white", fontWeight: "600", textAlign: "center" }}>
              Export CSV to Downloads
            </Text>
          </Pressable>
        ) : (
          <Text style={{ marginTop: 8, opacity: 0.6 }}>No log file yet</Text>
        )}
      </View>

      {/* ---- Location ---- */}
      <View style={styles.card}>
        <Text style={styles.h2}>Location</Text>
        <KV k="Provider" v={loc?.provider ?? "-"} />
        <KV k="Latitude" v={fmt(loc?.latitude)} />
        <KV k="Longitude" v={fmt(loc?.longitude)} />
        <KV k="Altitude (m)" v={fmt(loc?.altitude)} />
        <KV k="Accuracy (m)" v={fmt(loc?.accuracy)} />
        <KV k="Speed (m/s)" v={fmt(loc?.speed)} />
        <KV k="Bearing (°)" v={fmt(loc?.bearing)} />
        <KV k="Time" v={loc ? new Date(loc.time).toLocaleString() : "-"} />
      </View>

      {/* ---- Status ---- */}
      <View style={styles.card}>
        <Text style={styles.h2}>Status</Text>
        <KV
          k="Satellites (used/visible)"
          v={`${status?.satellitesUsed ?? 0}/${status?.satellitesInView ?? 0}`}
        />
        <KV k="Avg C/N0 (dB-Hz)" v={fmt(status?.avgCn0DbHz)} />
      </View>

      {/* ---- Existing UI: Measurements ---- */}
      <View style={styles.card}>
        <Text style={styles.h2}>Measurements (latest batch)</Text>
        <FlatList
          data={measurements}
          keyExtractor={(m, i) => `${m.svid}-${i}`}
          renderItem={({ item }) => (
            <Text style={styles.row}>
              SVID {item.svid} · {item.constellation ?? "?"} · C/N0 {fmt(item.cn0DbHz)} dB-Hz · cf {fmt(item.carrierFrequencyHz)} Hz
            </Text>
          )}
        />
      </View>
    </View>
  );
}

/**
 * Simple "key : value" row component.
 */
function KV({ k, v }: { k: string; v: string | number }) {
  return (
    <View style={styles.kv}>
      <Text style={styles.k}>{k}</Text>
      <Text style={styles.v}>{String(v)}</Text>
    </View>
  );
}

/** Helper to format numbers or show "-" if missing. */
function fmt(n?: number) {
  return typeof n === "number" && Number.isFinite(n)
    ? n.toFixed(6).replace(/\.0+$/, "")
    : "-";
}

/** Styling */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  h1: { fontSize: 24, fontWeight: "700", marginBottom: 12 },
  h2: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  card: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    marginBottom: 12,
    elevation: 1, // Android small shadow
  },
  kv: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  k: { fontWeight: "500" },
  v: { fontVariant: ["tabular-nums"] },
  row: { paddingVertical: 2 },
});