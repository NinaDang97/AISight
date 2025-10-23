package com.aisight.gnss

import android.annotation.SuppressLint
import android.location.GnssMeasurementsEvent
import android.location.GnssStatus
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import java.io.BufferedWriter
import java.io.File
import java.io.FileWriter
import java.text.SimpleDateFormat
import java.util.Locale

/**
 * GnssModule (Simplified)
 *
 * Core responsibilities:
 * - Collect raw GNSS/Location data from Android sensors
 * - Manage global logging state (accessible from anywhere in app)
 * - Write raw data directly to CSV log files
 * - Emit raw data events for React Native to consume
 *
 * This module does NOT:
 * - Parse/format data (handled in React Native/TypeScript)
 * - Export files to Downloads (handled by GnssExportModule)
 *
 * Log file format: CSV with columns for both location and measurement data.
 * Each row is either a location update or a GNSS measurement (unused columns are empty).
 */
class GnssModule(private val reactCtx: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactCtx),
    LifecycleEventListener {

    companion object {
        // Global logging state - shared across all instances
        // This allows logging to be toggled from anywhere in the app
        @Volatile var isLogging = false
        @Volatile var logWriter: BufferedWriter? = null
        @Volatile var logFile: File? = null
        @Volatile var lastLogFile: File? = null
        @Volatile var linesWritten = 0
    }

    private var locationManager: LocationManager? = null
    private var locationListener: LocationListener? = null
    private var statusCallback: GnssStatus.Callback? = null
    private var measurementsCallback: GnssMeasurementsEvent.Callback? = null

    private var isStarted = false

    override fun getName(): String = "GnssModule"

    init {
        reactCtx.addLifecycleEventListener(this)
    }

    private fun emit(event: String, payload: Any) {
        reactCtx.getJSModule(RCTDeviceEventEmitter::class.java).emit(event, payload)
    }

    @SuppressLint("MissingPermission")
    @ReactMethod
    fun start(promise: Promise) {
        if (isStarted) {
            promise.resolve(null)
            return
        }

        locationManager = reactCtx.getSystemService(LocationManager::class.java)

        val provider =
            if (locationManager?.isProviderEnabled(LocationManager.GPS_PROVIDER) == true)
                LocationManager.GPS_PROVIDER
            else
                LocationManager.NETWORK_PROVIDER

        locationListener = object : LocationListener {
            override fun onLocationChanged(loc: Location) {
                // Emit raw location data
                emit("gnssLocation", locationToMap(loc))

                // Log location to file if logging is enabled
                if (isLogging) {
                    writeLocationToLog(loc)
                }
            }
            // Required LocationListener callbacks.
            // We intentionally no-op these because our module currently only cares about onLocationChanged()
            // - onProviderEnabled/Disabled: invoked when a provider (GPS/NETWORK) is toggled.
            //   If you need to react (e.g., notify JS to prompt the user), emit an event here.
            // - onStatusChanged: deprecated since API 29. Modern apps should prefer
            //   GnssStatus.Callback for satellite/fix info or listen for PROVIDERS_CHANGED_ACTION.
            override fun onProviderEnabled(provider: String) {}
            override fun onProviderDisabled(provider: String) {}
            @Deprecated("Deprecated in Java")
            override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
        }

        locationManager?.requestLocationUpdates(provider, 1000L, 0f, locationListener!!)

        statusCallback = object : GnssStatus.Callback() {
            override fun onSatelliteStatusChanged(status: GnssStatus) {
                val count = status.satelliteCount
                var used = 0
                var cn0Sum = 0.0
                val constellations = HashMap<String, Int>()

                for (i in 0 until count) {
                    if (status.usedInFix(i)) used++
                    val cn0 = status.getCn0DbHz(i).toDouble()
                    if (cn0.isFinite()) cn0Sum += cn0

                    val cname = constellationName(status.getConstellationType(i))
                    constellations[cname] = (constellations[cname] ?: 0) + 1
                }

                val avgCn0 = if (count > 0) cn0Sum / count else Double.NaN

                val map = Arguments.createMap().apply {
                    putInt("satellitesInView", count)
                    putInt("satellitesUsed", used)
                    if (avgCn0.isFinite()) putDouble("avgCn0DbHz", avgCn0)
                    val constMap = Arguments.createMap()
                    for ((k, v) in constellations) constMap.putInt(k, v)
                    putMap("constellations", constMap)
                }

                // Emit status data
                emit("gnssStatus", map)
            }
        }
        locationManager?.registerGnssStatusCallback(statusCallback!!)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            measurementsCallback = object : GnssMeasurementsEvent.Callback() {
                override fun onGnssMeasurementsReceived(eventArgs: GnssMeasurementsEvent) {
                    val arr = Arguments.createArray()
                    val batchTimeNanos = eventArgs.clock.timeNanos

                    // Capture the logging state at the start
                    val loggingNow = GnssModule.isLogging
                    val writerNow = GnssModule.logWriter

                    for (m in eventArgs.measurements) {
                        val item = Arguments.createMap().apply {
                            putInt("svid", m.svid)
                            val cn0 = m.getCn0DbHz().toDouble()
                            if (cn0.isFinite()) putDouble("cn0DbHz", cn0)
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                try {
                                    if (m.hasCarrierFrequencyHz()) {
                                        putDouble("carrierFrequencyHz", m.getCarrierFrequencyHz().toDouble())
                                    }
                                } catch (_: Throwable) {}
                            }
                            putString("constellation", constellationName(m.constellationType))
                            putDouble("timeNanos", batchTimeNanos.toDouble())
                        }
                        arr.pushMap(item)

                        if (loggingNow && writerNow != null) {
                            writeToLog(m, batchTimeNanos)
                        }
                    }

                    emit("gnssMeasurement", arr)
                }
            }

            try {
                locationManager?.registerGnssMeasurementsCallback(measurementsCallback!!)
            } catch (_: Exception) {}
        }

        isStarted = true
        promise.resolve(null)
    }

    @ReactMethod
    fun stop(promise: Promise) {
        stopInternal()
        promise.resolve(null)
    }

    @ReactMethod
    fun setRawLogging(enabled: Boolean, fileName: String?, promise: Promise) {
        try {
            if (enabled) {
                // Always close any existing writer first
                closeLogWriter()
                // Then open a fresh one
                logWriter = openLogWriter(fileName)
                // Set flag AFTER opening the writer
                isLogging = true

                Log.d("GnssModule", "Logging enabled. isLogging=$isLogging, writer=${logWriter != null}")

                promise.resolve(logFile?.absolutePath)
            } else {
                Log.d("GnssModule", "Logging disabled")
                isLogging = false
                closeLogWriter()
                promise.resolve(null)
            }
        } catch (t: Throwable) {
            Log.e("GnssModule", "setRawLogging error: ${t.message}", t)
            isLogging = false
            closeLogWriter()
            promise.reject("LOGGING_ERROR", t)
        }
    }

    @ReactMethod
    fun getRawLogPath(promise: Promise) {
        promise.resolve((logFile ?: lastLogFile)?.absolutePath)
    }

    @ReactMethod
    fun getLoggingState(promise: Promise) {
        val state = Arguments.createMap().apply {
            putBoolean("isLogging", isLogging)
            putString("logFilePath", (logFile ?: lastLogFile)?.absolutePath)
            putInt("linesWritten", linesWritten)
        }
        promise.resolve(state)
    }

    private fun stopInternal() {
        try {
            locationListener?.let { locationManager?.removeUpdates(it) }
            statusCallback?.let { locationManager?.unregisterGnssStatusCallback(it) }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                measurementsCallback?.let { locationManager?.unregisterGnssMeasurementsCallback(it) }
            }
        } catch (_: Exception) {}

        locationListener = null
        statusCallback = null
        measurementsCallback = null

        isLogging = false
        closeLogWriter()

        isStarted = false
    }

    override fun onHostResume() {}
    override fun onHostPause() {}
    override fun onHostDestroy() {
        if (isStarted) stopInternal()
    }

    private fun writeToLog(m: android.location.GnssMeasurement, batchTimeNanos: Long) {
        try {
            val writer = logWriter ?: return

            val timestamp = System.currentTimeMillis()
            val datetime = SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", Locale.US).format(java.util.Date(timestamp))
            val type = "measurement"
            val svid = m.svid
            val constellation = constellationName(m.constellationType)
            val cn0 = m.getCn0DbHz().toDouble()
            val cn0Str = if (cn0.isFinite()) cn0.toString() else ""

            val carrierFreq = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                try {
                    if (m.hasCarrierFrequencyHz()) {
                        m.getCarrierFrequencyHz().toString()
                    } else ""
                } catch (_: Throwable) {
                    ""
                }
            } else ""

            // CSV format: timestamp,datetime,type,latitude,longitude,altitude,accuracy,speed,bearing,provider,svid,constellation,cn0DbHz,carrierFrequencyHz,timeNanos
            val csvLine = "$timestamp,$datetime,$type,,,,,,,,$svid,$constellation,$cn0Str,$carrierFreq,$batchTimeNanos\n"

            synchronized(writer) {
                writer.append(csvLine)
                writer.flush()
            }

            linesWritten++
        } catch (e: Throwable) {
            Log.e("GnssModule", "Error writing measurement to log: ${e.message}", e)
            isLogging = false
            closeLogWriter()
        }
    }

    private fun writeLocationToLog(loc: Location) {
        try {
            val writer = logWriter ?: return

            val timestamp = loc.time
            val datetime = SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", Locale.US).format(java.util.Date(timestamp))
            val type = "location"
            val lat = loc.latitude
            val lon = loc.longitude
            val alt = if (loc.hasAltitude()) loc.altitude.toString() else ""
            val acc = if (loc.hasAccuracy()) loc.accuracy.toString() else ""
            val speed = if (loc.hasSpeed()) loc.speed.toString() else ""
            val bearing = if (loc.hasBearing()) loc.bearing.toString() else ""
            val provider = loc.provider ?: ""

            // CSV format: timestamp,datetime,type,latitude,longitude,altitude,accuracy,speed,bearing,provider,svid,constellation,cn0DbHz,carrierFrequencyHz,timeNanos
            val csvLine = "$timestamp,$datetime,$type,$lat,$lon,$alt,$acc,$speed,$bearing,$provider,,,,,\n"

            synchronized(writer) {
                writer.append(csvLine)
                writer.flush()
            }

            linesWritten++
        } catch (e: Throwable) {
            Log.e("GnssModule", "Error writing location to log: ${e.message}", e)
            isLogging = false
            closeLogWriter()
        }
    }

    private fun locationToMap(loc: Location): WritableMap {
        val m = Arguments.createMap()
        m.putString("provider", loc.provider)
        m.putDouble("latitude", loc.latitude)
        m.putDouble("longitude", loc.longitude)
        if (loc.hasAltitude()) m.putDouble("altitude", loc.altitude)
        if (loc.hasAccuracy()) m.putDouble("accuracy", loc.accuracy.toDouble())
        if (loc.hasSpeed()) m.putDouble("speed", loc.speed.toDouble())
        if (loc.hasBearing()) m.putDouble("bearing", loc.bearing.toDouble())
        m.putDouble("time", loc.time.toDouble())
        return m
    }

    private fun constellationName(type: Int): String = when (type) {
        GnssStatus.CONSTELLATION_GPS -> "GPS"
        GnssStatus.CONSTELLATION_GLONASS -> "GLONASS"
        GnssStatus.CONSTELLATION_BEIDOU -> "BEIDOU"
        GnssStatus.CONSTELLATION_GALILEO -> "GALILEO"
        GnssStatus.CONSTELLATION_QZSS -> "QZSS"
        GnssStatus.CONSTELLATION_IRNSS -> "IRNSS"
        GnssStatus.CONSTELLATION_SBAS -> "SBAS"
        else -> "UNKNOWN"
    }

    private fun openLogWriter(fileName: String?): BufferedWriter {
        val dir = File(reactCtx.filesDir, "gnss")
        if (!dir.exists()) dir.mkdirs()

        val name = fileName?.takeIf { it.isNotBlank() } ?: run {
            val ts = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(java.util.Date())
            "gnss_log_$ts.csv"
        }

        val f = File(dir, name)
        val isNewFile = !f.exists()

        logFile = f
        lastLogFile = f

        Log.d("GnssModule", "Opening log file: ${f.absolutePath}")

        val writer = BufferedWriter(FileWriter(f, true))

        // Write CSV header if new file
        if (isNewFile) {
            writer.append("timestamp,datetime,type,latitude,longitude,altitude,accuracy,speed,bearing,provider,svid,constellation,cn0DbHz,carrierFrequencyHz,timeNanos\n")
            writer.flush()
        }

        return writer
    }

    private fun closeLogWriter() {
        try { logWriter?.flush() } catch (_: Exception) {}
        try { logWriter?.close() } catch (_: Exception) {}
        logWriter = null
        logFile = null
    }
}