import { NativeModules } from 'react-native';

const native = {
  schedule: jest.fn(async () => {}),
  cancelAll: jest.fn(async () => {}),
  takePendingUrl: jest.fn(async () => null as string | null),
  requestPermission: jest.fn(async () => true),
};
NativeModules.FfmucReminders = native;

const {
  extendLink,
  planReminders,
  roomOfExtendLink,
  syncReminders,
  takePendingReminderUrl,
} = require('../src/reminders') as typeof import('../src/reminders');

const HOUR = 3600_000;
const NOW = Date.parse('2026-11-01T12:00:00Z');
const room = (name: string, inHours: number) => ({
  key: 'k',
  room: name,
  expires: new Date(NOW + inHours * HOUR).toISOString(),
});

beforeEach(() => jest.clearAllMocks());

describe('planReminders', () => {
  test('3 days and 1 day before expiry', () => {
    const plan = planReminders([room('r-a', 30 * 24)], NOW);
    expect(plan.map(p => p.hours)).toEqual([72, 24]);
    expect(plan[0].at).toBe(NOW + (30 * 24 - 72) * HOUR);
    expect(plan[0].id).toBe('r-a.72');
  });

  test('only reminders in the future', () => {
    expect(planReminders([room('r-a', 48)], NOW).map(p => p.hours)).toEqual([
      24,
    ]);
    expect(planReminders([room('r-a', 10)], NOW)).toEqual([]);
    expect(planReminders([room('r-a', -5)], NOW)).toEqual([]);
  });

  test('sorted by time, bad dates skipped', () => {
    const plan = planReminders(
      [
        room('r-late', 400),
        room('r-soon', 100),
        { key: 'k', room: 'r-bad', expires: 'never' },
      ],
      NOW,
    );
    expect(plan.map(p => p.id)).toEqual([
      'r-soon.72',
      'r-soon.24',
      'r-late.72',
      'r-late.24',
    ]);
  });
});

describe('extend links', () => {
  test('round trip', () => {
    expect(extendLink('r-abc')).toBe('ffmuc-meet://app/extend/r-abc');
    expect(roomOfExtendLink(extendLink('r-abc'))).toBe('r-abc');
    expect(roomOfExtendLink(extendLink('a b'))).toBe('a b');
  });

  test.each([
    'ffmuc-meet://r-abc',
    'ffmuc-meet://app/extend/',
    'jitsi-meet://app/extend/r-abc',
    'https://meet.ffmuc.net/app/extend/r-abc',
    'ffmuc-meet://app/extend/a/b',
  ])('other link %s is not an extend link', url => {
    expect(roomOfExtendLink(url)).toBeUndefined();
  });
});

const live = (name: string, inHours: number) => ({
  key: 'k',
  room: name,
  expires: new Date(Date.now() + inHours * HOUR).toISOString(),
});

describe('syncReminders', () => {
  test('replaces all reminders', async () => {
    await syncReminders([live('r-a', 30 * 24)]);
    expect(native.cancelAll).toHaveBeenCalledTimes(1);
    expect(native.requestPermission).toHaveBeenCalled();
    expect(native.schedule).toHaveBeenCalledTimes(2);
    const [id, at, title, body, url] = native.schedule.mock
      .calls[0] as unknown as [string, number, string, string, string];
    expect(id).toBe('r-a.72');
    expect(at).toBeGreaterThan(Date.now());
    expect(title).toContain('r-a');
    expect(body).toContain('3 days');
    expect(url).toBe('ffmuc-meet://app/extend/r-a');
  });

  test('no rooms: cancel only, no permission prompt', async () => {
    await syncReminders([]);
    expect(native.cancelAll).toHaveBeenCalled();
    expect(native.requestPermission).not.toHaveBeenCalled();
    expect(native.schedule).not.toHaveBeenCalled();
  });

  test('permission denied: nothing scheduled', async () => {
    native.requestPermission.mockResolvedValueOnce(false);
    await syncReminders([live('r-a', 30 * 24)]);
    expect(native.schedule).not.toHaveBeenCalled();
  });

  test('pending URL', async () => {
    native.takePendingUrl.mockResolvedValueOnce('ffmuc-meet://app/extend/x');
    expect(await takePendingReminderUrl()).toBe('ffmuc-meet://app/extend/x');
    expect(await takePendingReminderUrl()).toBeUndefined();
  });
});
