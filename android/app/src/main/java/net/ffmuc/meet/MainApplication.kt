package net.ffmuc.meet

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.oney.WebRTCModule.WebRTCModuleOptions
import net.ffmuc.meet.pow.PowPackage
import net.ffmuc.meet.reminders.ReminderPackage

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          add(PowPackage())
          add(ReminderPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    // Screen sharing needs a foreground service on Android 10 and later.
    WebRTCModuleOptions.getInstance().enableMediaProjectionService = true
    loadReactNative(this)
  }
}
