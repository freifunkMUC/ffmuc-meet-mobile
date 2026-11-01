import { de } from './de';
import { en, Messages } from './en';

export type { MessageKey } from './en';
type MessageKey = keyof Messages;

const catalogs: Record<string, Messages> = { en, de };
let current: Messages = en;
let language = 'en';

/** Language code of the device, for example "de". */
export function deviceLocale(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || 'en';
  } catch {
    return 'en';
  }
}

/** Selects the catalog for a locale ("de-DE" uses "de"). Else English. */
export function setLanguage(locale: string): void {
  const lang = locale.toLowerCase().split(/[-_]/)[0];
  language = catalogs[lang] ? lang : 'en';
  current = catalogs[language];
}

export function getLanguage(): string {
  return language;
}

export function t(
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  const s = current[key] ?? en[key] ?? key;
  return vars
    ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m))
    : s;
}
