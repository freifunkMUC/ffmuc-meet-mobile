import { useEffect, useRef } from 'react';
import { Linking } from 'react-native';

/** Calls onUrl for the URL that opened the app and for later URLs. */
export function useDeepLinks(onUrl: (url: string) => void): void {
  const cb = useRef(onUrl);
  cb.current = onUrl;
  useEffect(() => {
    let alive = true;
    Linking.getInitialURL()
      .then(url => {
        if (alive && url) {
          cb.current(url);
        }
      })
      .catch(() => {});
    const sub = Linking.addEventListener('url', ({ url }) => cb.current(url));
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
}
