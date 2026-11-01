package net.ffmuc.meet.pow

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class PowPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> =
    listOf(PowModule(context))

  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> =
    emptyList()
}
