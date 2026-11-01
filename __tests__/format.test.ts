import { formatDuration, isExpired } from '../src/format';

test.each([
  [72, '3 days'],
  [168, '1 week'],
  [336, '2 weeks'],
  [720, '30 days'],
  [2160, '90 days'],
  [8760, '1 year'],
  [24, '1 day'],
  [5, '5 hours'],
])('formatDuration(%i) = %s', (h, s) => {
  expect(formatDuration(h)).toBe(s);
});

test('isExpired', () => {
  expect(
    isExpired('2020-01-01T00:00:00Z', Date.parse('2021-01-01T00:00:00Z')),
  ).toBe(true);
  expect(
    isExpired('2030-01-01T00:00:00Z', Date.parse('2021-01-01T00:00:00Z')),
  ).toBe(false);
  expect(isExpired('bad')).toBe(false);
});
