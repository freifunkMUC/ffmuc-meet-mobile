import { en, MessageKey, Messages } from './en';

export type { MessageKey } from './en';

const catalogs: Record<string, Messages> = { en };
let current: Messages = en;

export function setLanguage(lang: string): void {
  current = catalogs[lang] ?? en;
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
