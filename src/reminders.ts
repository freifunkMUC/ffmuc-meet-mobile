import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import { t } from './i18n';
import type { StoredRoom } from './storage/rooms';

/** Hours before expiry: 3 days and 1 day. */
export const REMINDER_HOURS = [72, 24];

const HOUR = 3600_000;

/** App link that a reminder opens: the extend screen of the room. */
export function extendLink(room: string): string {
  return `ffmuc-meet://app/extend/${encodeURIComponent(room)}`;
}

/** The room of an extend link, or undefined. */
export function roomOfExtendLink(url: string): string | undefined {
  const m = /^ffmuc-meet:\/\/app\/extend\/([^/?#]+)\/?$/i.exec(url.trim());
  if (!m) {
    return undefined;
  }
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return undefined;
  }
}

export interface PlannedReminder {
  id: string;
  at: number;
  room: string;
  hours: number;
}

/** Reminders still in the future for the rooms. */
export function planReminders(
  rooms: StoredRoom[],
  now: number = Date.now(),
): PlannedReminder[] {
  const out: PlannedReminder[] = [];
  for (const r of rooms) {
    const expires = Date.parse(r.expires);
    if (!Number.isFinite(expires)) {
      continue;
    }
    for (const hours of REMINDER_HOURS) {
      const at = expires - hours * HOUR;
      if (at > now) {
        out.push({ id: `${r.room}.${hours}`, at, room: r.room, hours });
      }
    }
  }
  return out.sort((a, b) => a.at - b.at);
}

interface FfmucRemindersModule {
  schedule(
    id: string,
    at: number,
    title: string,
    body: string,
    url: string,
  ): Promise<void>;
  cancelAll(): Promise<void>;
  takePendingUrl(): Promise<string | null>;
  requestPermission?(): Promise<boolean>;
}

const native: FfmucRemindersModule | undefined = NativeModules.FfmucReminders;

async function allowed(): Promise<boolean> {
  if (Platform.OS === 'android') {
    if (Number(Platform.Version) < 33) {
      return true;
    }
    const p = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
    if (await PermissionsAndroid.check(p)) {
      return true;
    }
    return (
      (await PermissionsAndroid.request(p)) ===
      PermissionsAndroid.RESULTS.GRANTED
    );
  }
  return native?.requestPermission ? native.requestPermission() : false;
}

let queue: Promise<unknown> = Promise.resolve();

/** Replaces all scheduled reminders with the reminders for the rooms. */
export function syncReminders(rooms: StoredRoom[]): Promise<void> {
  const run = async () => {
    if (!native) {
      return;
    }
    await native.cancelAll();
    const plan = planReminders(rooms);
    if (plan.length === 0 || !(await allowed())) {
      return;
    }
    for (const r of plan) {
      await native.schedule(
        r.id,
        r.at,
        t('reminder.title', { room: r.room }),
        t(r.hours >= 48 ? 'reminder.body3' : 'reminder.body1'),
        extendLink(r.room),
      );
    }
  };
  const next = queue.then(run, run);
  queue = next.catch(() => undefined);
  return next;
}

/** The link of a tapped reminder when the app was not running (iOS). */
export async function takePendingReminderUrl(): Promise<string | undefined> {
  try {
    return (await native?.takePendingUrl()) ?? undefined;
  } catch {
    return undefined;
  }
}
