import { t } from './i18n';

/** "3 days", "1 week", "1 year". */
export function formatDuration(hours: number): string {
  if (hours % 8760 === 0) {
    const n = hours / 8760;
    return n === 1 ? t('duration.year') : t('duration.years', { n });
  }
  if (hours % 168 === 0 && hours < 720) {
    const n = hours / 168;
    return n === 1 ? t('duration.week') : t('duration.weeks', { n });
  }
  if (hours % 24 === 0) {
    const n = hours / 24;
    return n === 1 ? t('duration.day') : t('duration.days', { n });
  }
  return t('duration.hours', { n: hours });
}

let locale: string | undefined;

export function setFormatLocale(l: string | undefined): void {
  locale = l;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    return iso;
  }
  try {
    return d.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return d.toISOString();
  }
}

export function isExpired(iso: string, now: number = Date.now()): boolean {
  const ms = Date.parse(iso);
  return !isNaN(ms) && ms <= now;
}
