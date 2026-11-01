import { de } from '../src/i18n/de';
import { en } from '../src/i18n/en';
import { getLanguage, setLanguage, t } from '../src/i18n';

const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();

afterEach(() => setLanguage('en'));

test('German has the same keys and placeholders as English', () => {
  expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort());
  for (const k of Object.keys(en) as (keyof typeof en)[]) {
    expect([k, vars(de[k])]).toEqual([k, vars(en[k])]);
    expect(de[k].trim()).not.toBe('');
  }
});

test.each([
  ['de', 'de'],
  ['de-DE', 'de'],
  ['de_AT', 'de'],
  ['en-US', 'en'],
  ['fr-FR', 'en'],
  ['', 'en'],
])('locale %s uses %s', (locale, lang) => {
  setLanguage(locale);
  expect(getLanguage()).toBe(lang);
});

test('German texts and variables', () => {
  setLanguage('de-DE');
  expect(t('home.reserved')).toBe('Reservierte Räume');
  expect(t('rooms.expires', { date: 'X' })).toBe('Gültig bis X');
  expect(t('role.host')).toBe('Moderation');
});
