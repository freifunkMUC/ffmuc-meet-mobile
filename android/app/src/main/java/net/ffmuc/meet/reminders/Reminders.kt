package net.ffmuc.meet.reminders

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import net.ffmuc.meet.R
import org.json.JSONObject

/** One local reminder. Kept in SharedPreferences so it can return after a reboot. */
data class Reminder(
  val id: String,
  val at: Long,
  val title: String,
  val body: String,
  val url: String,
) {
  fun toJson(): String =
    JSONObject()
      .put("id", id)
      .put("at", at)
      .put("title", title)
      .put("body", body)
      .put("url", url)
      .toString()

  companion object {
    fun fromJson(s: String): Reminder? =
      try {
        val o = JSONObject(s)
        Reminder(
          o.getString("id"),
          o.getLong("at"),
          o.getString("title"),
          o.getString("body"),
          o.getString("url"),
        )
      } catch (e: Exception) {
        null
      }
  }
}

object Reminders {
  private const val PREFS = "net.ffmuc.meet.reminders"
  private const val CHANNEL = "reminders"
  const val EXTRA_ID = "id"

  private fun prefs(ctx: Context) = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun all(ctx: Context): List<Reminder> =
    prefs(ctx).all.values.mapNotNull { (it as? String)?.let(Reminder::fromJson) }

  fun get(ctx: Context, id: String): Reminder? =
    prefs(ctx).getString(id, null)?.let(Reminder::fromJson)

  fun schedule(ctx: Context, r: Reminder) {
    prefs(ctx).edit().putString(r.id, r.toJson()).apply()
    arm(ctx, r)
  }

  fun remove(ctx: Context, id: String) {
    prefs(ctx).edit().remove(id).apply()
  }

  fun cancelAll(ctx: Context) {
    val am = ctx.getSystemService(AlarmManager::class.java)
    for (r in all(ctx)) {
      am.cancel(alarmIntent(ctx, r.id))
    }
    prefs(ctx).edit().clear().apply()
  }

  /** Sets the alarm again, for example after a reboot. */
  fun rearmAll(ctx: Context) {
    val now = System.currentTimeMillis()
    for (r in all(ctx)) {
      if (r.at > now) arm(ctx, r) else remove(ctx, r.id)
    }
  }

  // Inexact alarm: no exact-alarm permission needed. Some minutes late is OK.
  private fun arm(ctx: Context, r: Reminder) {
    val am = ctx.getSystemService(AlarmManager::class.java)
    am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, r.at, alarmIntent(ctx, r.id))
  }

  private fun alarmIntent(ctx: Context, id: String): PendingIntent =
    PendingIntent.getBroadcast(
      ctx,
      id.hashCode(),
      Intent(ctx, ReminderReceiver::class.java).putExtra(EXTRA_ID, id),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

  fun show(ctx: Context, r: Reminder) {
    val nm = ctx.getSystemService(NotificationManager::class.java)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      nm.createNotificationChannel(
        NotificationChannel(
          CHANNEL,
          ctx.getString(R.string.reminder_channel),
          NotificationManager.IMPORTANCE_DEFAULT,
        ),
      )
    }
    val open =
      PendingIntent.getActivity(
        ctx,
        r.id.hashCode(),
        Intent(Intent.ACTION_VIEW, Uri.parse(r.url)).setPackage(ctx.packageName),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
    val n =
      NotificationCompat.Builder(ctx, CHANNEL)
        .setSmallIcon(R.drawable.ic_notification)
        .setColor(0xFFDC0067.toInt())
        .setContentTitle(r.title)
        .setContentText(r.body)
        .setStyle(NotificationCompat.BigTextStyle().bigText(r.body))
        .setContentIntent(open)
        .setAutoCancel(true)
        .build()
    try {
      NotificationManagerCompat.from(ctx).notify(r.id.hashCode(), n)
    } catch (e: SecurityException) {
      // No notification permission.
    }
  }
}
