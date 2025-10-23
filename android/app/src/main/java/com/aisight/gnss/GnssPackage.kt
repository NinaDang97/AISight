package com.aisight.gnss

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * A ReactPackage is how RN discovers our native module.
 * - createNativeModules returns our module(s)
 * - createViewManagers would return native UI components (not needed here)
 */
class GnssPackage : ReactPackage {
    override fun createViewManagers(reactContext: ReactApplicationContext): MutableList<ViewManager<*, *>> =
        mutableListOf()

    override fun createNativeModules(reactContext: ReactApplicationContext): MutableList<NativeModule> =
        mutableListOf(GnssModule(reactContext))
}
