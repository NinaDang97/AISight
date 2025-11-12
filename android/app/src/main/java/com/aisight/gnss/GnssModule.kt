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
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.ReactContext
import java.io.BufferedWriter
import java.io.File
import java.io.FileWriter
import java.text.SimpleDateFormat
import java.util.Locale

/**
 * GnssModule
 *
 * Core responsibilities:
 * - Collect raw GNSS/Location data from Android sensors
 * - Manage global logging state (accessible from anywhere in app)
 * - Write raw data directly to CSV log files
 * - Emit raw data events for React Native to consume
 *
 * Log file format: CSV with columns for both location and measurement data.
 * Each row is either a location update or a GNSS measurement (unused columns are empty).
 */
class GnssModule(private val reactCtx: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactCtx),
    LifecycleEventListener {

    companion object {
        // ========================================================================
        // Configuration: Update intervals and thresholds
        // ========================================================================

        /**
         * Minimum time interval between location updates in milliseconds
         * Lower values = more frequent updates but higher battery usage
         */
        private const val LOCATION_UPDATE_INTERVAL_MS = 1000L

        /**
         * Minimum distance change for location updates in meters
         * Default: 0f (get all updates regardless of distance)
         * Higher values = updates only when device moves significantly
         */
        private const val LOCATION_UPDATE_MIN_DISTANCE_M = 0f

        // Note: GNSS Status and Measurements callbacks update automatically
        // at hardware sampling rate (typically 1 Hz) and cannot be configured

        // ========================================================================
        // Global logging state - shared across all instances
        // ========================================================================
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

    /**
     * Emit event to React Native using DeviceEventEmitter
     */
    private fun emit(event: String, payload: Any) {
        if (!reactCtx.hasActiveReactInstance()) {
            return
        }

        try {
            val emitter = reactCtx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            emitter?.emit(event, payload)
        } catch (e: Exception) {
            Log.e("GnssModule", "Error emitting event $event: ${e.message}", e)
        }
    }

    @SuppressLint("MissingPermission")
    @ReactMethod
    fun start(promise: Promise) {
        if (isStarted) {
            promise.resolve(null)
            return
        }

        locationManager = reactCtx.getSystemService(LocationManager::class.java)

        // Only use GPS provider - no network fallback
        locationListener = object : LocationListener {
            override fun onLocationChanged(loc: Location) {
                emit("gnssLocation", locationToMap(loc))

                if (isLogging) {
                    writeLocationToLog(loc)
                }
            }
            // Notify React Native when GPS state changes
            override fun onProviderEnabled(provider: String) {
                if (provider == LocationManager.GPS_PROVIDER) {
                    emit("gpsStateChanged", Arguments.createMap().apply {
                        putBoolean("enabled", true)
                    })
                }
            }

            override fun onProviderDisabled(provider: String) {
                if (provider == LocationManager.GPS_PROVIDER) {
                    emit("gpsStateChanged", Arguments.createMap().apply {
                        putBoolean("enabled", false)
                    })
                }
            }

            @Deprecated("Deprecated in Java")
            override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
        }

        try {
            locationManager?.requestLocationUpdates(
                LocationManager.GPS_PROVIDER,
                LOCATION_UPDATE_INTERVAL_MS,
                LOCATION_UPDATE_MIN_DISTANCE_M,
                locationListener!!
            )
        } catch (e: Exception) {
            Log.e("GnssModule", "Error requesting location updates: ${e.message}", e)
        }

        statusCallback = object : GnssStatus.Callback() {
            override fun onSatelliteStatusChanged(status: GnssStatus) {
                val count = status.satelliteCount
                var used = 0
                var cn0Sum = 0.0
                var cn0Count = 0
                val constellations = HashMap<String, Int>()

                for (i in 0 until count) {
                    if (status.usedInFix(i)) used++
                    val cn0 = status.getCn0DbHz(i).toDouble()

                    if (cn0.isFinite() && cn0 > 0) {
                        cn0Sum += cn0
                        cn0Count++
                    }

                    val cname = constellationName(status.getConstellationType(i))
                    constellations[cname] = (constellations[cname] ?: 0) + 1
                }

                val avgCn0 = if (cn0Count > 0) cn0Sum / cn0Count else Double.NaN

                val map = Arguments.createMap().apply {
                    putInt("satellitesInView", count)
                    putInt("satellitesUsed", used)
                    if (avgCn0.isFinite()) putDouble("avgCn0DbHz", avgCn0)
                    val constMap = Arguments.createMap()
                    for ((k, v) in constellations) constMap.putInt(k, v)
                    putMap("constellations", constMap)
                }

                emit("gnssStatus", map)
            }
        }

        try {
            locationManager?.registerGnssStatusCallback(statusCallback!!)
        } catch (e: Exception) {
            Log.e("GnssModule", "Error registering GNSS status callback: ${e.message}", e)
        }

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
            } catch (e: Exception) {
                Log.e("GnssModule", "Error registering GNSS measurements callback: ${e.message}", e)
            }
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
                closeLogWriter()
                logWriter = openLogWriter(fileName)
                isLogging = true
                promise.resolve(logFile?.absolutePath)
            } else {
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

    @ReactMethod
    fun isGpsEnabled(promise: Promise) {
        val locationManager = reactCtx.getSystemService(LocationManager::class.java)
        val isEnabled = locationManager?.isProviderEnabled(LocationManager.GPS_PROVIDER) == true
        promise.resolve(isEnabled)
    }

    @ReactMethod
    fun listLogFiles(promise: Promise) {
        try {
            val dir = File(reactCtx.filesDir, "gnss")
            if (!dir.exists() || !dir.isDirectory) {
                promise.resolve(Arguments.createArray())
                return
            }

            val files = dir.listFiles { file -> file.isFile && file.name.endsWith(".csv") }
                ?.sortedByDescending { it.lastModified() } // Most recent first
                ?: emptyList()

            val result = Arguments.createArray()
            for (file in files) {
                val fileInfo = Arguments.createMap().apply {
                    putString("name", file.name)
                    putString("path", file.absolutePath)
                    putDouble("size", file.length().toDouble())
                    putDouble("lastModified", file.lastModified().toDouble())
                }
                result.pushMap(fileInfo)
            }

            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("LIST_ERROR", e)
        }
    }

    @ReactMethod
    fun deleteLogFile(filePath: String, promise: Promise) {
        try {
            val file = File(filePath)

            // Security check: ensure file is in the gnss directory
            val gnssDir = File(reactCtx.filesDir, "gnss")
            if (!file.canonicalPath.startsWith(gnssDir.canonicalPath)) {
                promise.reject("SECURITY_ERROR", "File is not in the GNSS directory")
                return
            }

            // Don't delete the currently active log file
            if (file == logFile) {
                promise.reject("DELETE_ERROR", "Cannot delete active log file. Stop logging first.")
                return
            }

            if (file.exists()) {
                val deleted = file.delete()
                if (deleted) {
                    promise.resolve(true)
                } else {
                    promise.reject("DELETE_ERROR", "Failed to delete file")
                }
            } else {
                promise.reject("FILE_NOT_FOUND", "File does not exist")
            }
        } catch (e: Exception) {
            Log.e("GnssModule", "Error deleting file: ${e.message}", e)
            promise.reject("DELETE_ERROR", e)
        }
    }

    private fun stopInternal() {
        try {
            locationListener?.let { locationManager?.removeUpdates(it) }
            statusCallback?.let { locationManager?.unregisterGnssStatusCallback(it) }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                measurementsCallback?.let { locationManager?.unregisterGnssMeasurementsCallback(it) }
            }
        } catch (e: Exception) {
            Log.e("GnssModule", "Error in stopInternal: ${e.message}", e)
        }

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

        // Delete previous log file if it only contains the header
        lastLogFile?.let { prevFile ->
            if (prevFile.exists() && prevFile.length() > 0) {
                val lineCount = prevFile.readLines().size
                if (lineCount <= 1) {
                    prevFile.delete()
                }
            }
        }

        val name = fileName?.takeIf { it.isNotBlank() } ?: run {
            val ts = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(java.util.Date())
            "gnss_log_$ts.csv"
        }

        val f = File(dir, name)
        val isNewFile = !f.exists()

        logFile = f
        lastLogFile = f
        linesWritten = 0

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