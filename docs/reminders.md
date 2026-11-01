# Reminders

The app shows a local notification 3 days and 1 day before a room in
"My rooms" expires. When you tap the notification, the app opens the
"Extend" screen of the room.

- The reminders are local. The app does not use a push service.
- The app sets the reminders again when you start it and when your rooms
  change.
- On Android, the reminders stay after a restart of the device.
- On Android, the time is not exact. A reminder can come some minutes late.
  Thus the app does not need the "exact alarm" permission.
- The app asks for the notification permission when you have a room.
  If you do not give the permission, the app shows no reminders.

The notification opens the link `ffmuc-meet://app/extend/<room>`.
