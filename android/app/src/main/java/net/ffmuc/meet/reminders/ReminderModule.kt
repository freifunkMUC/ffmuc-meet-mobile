package net.ffmuc.meet.reminders

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager

class ReminderModule(private val ctx: ReactApplicationContext) :
  ReactContextBaseJavaModule(ctx) {
  override fun getName() = "FfmucReminders"

  @ReactMethod
  fun schedule(id: String, at: Double, title: String, body: String, url: String, promise: Promise) {
    Reminders.schedule(ctx, Reminder(id, at.toLong(), title, body, url))
    promise.resolve(null)
  }

  @ReactMethod
  fun cancelAll(promise: Promise) {
    Reminders.cancelAll(ctx)
    promise.resolve(null)
  }

  // Android opens the reminder link with a normal VIEW intent.
  @ReactMethod
  fun takePendingUrl(promise: Promise) {
    promise.resolve(null)
  }
}

class ReminderPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> =
    listOf(ReminderModule(context))

  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> =
    emptyList()
}
