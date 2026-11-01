package net.ffmuc.meet.reminders

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class ReminderReceiver : BroadcastReceiver() {
  override fun onReceive(ctx: Context, intent: Intent) {
    val id = intent.getStringExtra(Reminders.EXTRA_ID) ?: return
    val r = Reminders.get(ctx, id) ?: return
    Reminders.remove(ctx, id)
    Reminders.show(ctx, r)
  }
}

/** Alarms are lost on reboot. Set them again. */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(ctx: Context, intent: Intent) {
    if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
      Reminders.rearmAll(ctx)
    }
  }
}
