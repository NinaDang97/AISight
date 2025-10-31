package com.aisight.gnss

import android.content.ContentValues
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Locale

/**
 * GnssExportModule
 *
 * Handles exporting GNSS CSV log files to Downloads folder.
 * Since logs are already in CSV format, this module simply copies
 * the file from internal storage to the user-accessible Downloads folder.
 */
class GnssExportModule(private val reactCtx: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactCtx) {

    override fun getName(): String = "GnssExportModule"

    /**
     * Export CSV log file to Downloads/Aisight folder
     *
     * @param logFilePath Absolute path to the CSV log file
     * @param displayName Optional custom filename (defaults to timestamped name)
     * @return Promise resolving to URI (Android 10+) or path (Android 9-)
     */
    @ReactMethod
    fun exportCSV(
        logFilePath: String,
        displayName: String?,
        promise: Promise
    ) {
        try {
            val src = File(logFilePath)
            if (!src.exists()) {
                promise.reject("NO_FILE", "Log file does not exist: $logFilePath")
                return
            }

            val name = displayName?.takeIf { it.isNotBlank() } ?: run {
                val ts = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(java.util.Date())
                "gnss_data_$ts.csv"
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10+: Use MediaStore
                val resolver = reactCtx.contentResolver
                val values = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, name)
                    put(MediaStore.MediaColumns.MIME_TYPE, "text/csv")
                    put(MediaStore.MediaColumns.RELATIVE_PATH, "Download/Aisight")
                }
                val uri: Uri? = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                if (uri == null) {
                    promise.reject("EXPORT_FAILED", "Failed to create destination in MediaStore.")
                    return
                }
                resolver.openOutputStream(uri)?.use { out ->
                    FileInputStream(src).use { input ->
                        input.copyTo(out)
                        out.flush()
                    }
                }
                promise.resolve(uri.toString())
            } else {
                // Android 9 and below: Direct file system access
                val downloads = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                val dstDir = File(downloads, "Aisight")
                if (!dstDir.exists()) dstDir.mkdirs()
                val dst = File(dstDir, name)

                FileInputStream(src).use { input ->
                    FileOutputStream(dst).use { output ->
                        input.copyTo(output)
                        output.flush()
                    }
                }

                MediaScannerConnection.scanFile(
                    reactCtx,
                    arrayOf(dst.absolutePath),
                    arrayOf("text/csv"),
                    null
                )

                promise.resolve(dst.absolutePath)
            }
        } catch (t: Throwable) {
            promise.reject("EXPORT_ERROR", t)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
