import { setFormatLocale } from './format';
import { deviceLocale, getLanguage, setLanguage } from './i18n';

/** Applies the device language. Returns true when the language changed. */
export function applyDeviceLocale(): boolean {
  const before = getLanguage();
  const locale = deviceLocale();
  setLanguage(locale);
  setFormatLocale(locale);
  return getLanguage() !== before;
}
