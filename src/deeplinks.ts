import { useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import { takePendingReminderUrl } from './reminders';

/** Calls onUrl for the URL that opened the app and for later URLs. */
export function useDeepLinks(onUrl: (url: string) => void): void {
  const cb = useRef(onUrl);
  cb.current = onUrl;
  useEffect(() => {
    let alive = true;
    let last = { url: '', at: 0 };
    // A tapped reminder can arrive twice on iOS: as a link and as pending URL.
    const open = (url: string | null | undefined) => {
      const now = Date.now();
      if (!alive || !url || (url === last.url && now - last.at < 3000)) {
        return;
      }
      last = { url, at: now };
      cb.current(url);
    };
    Linking.getInitialURL()
      .then(async url => open(url ?? (await takePendingReminderUrl())))
      .catch(() => {});
    const sub = Linking.addEventListener('url', ({ url }) => {
      takePendingReminderUrl().catch(() => {});
      open(url);
    });
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
}
