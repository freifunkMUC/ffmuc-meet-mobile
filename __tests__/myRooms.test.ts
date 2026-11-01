import { importRoom } from '../src/myRooms';
import { setSecretStore } from '../src/storage/rooms';

const KEY = 'AAAAAAAAAAAAAAAAAAAAAA';
const view = {
  room: 'r-abc',
  status: 'active' as const,
  expires: '2030-01-01T00:00:00Z',
  max_ahead_h: 8760,
  durations: [72],
  host_url: `https://meet.ffmuc.net/reserve/h/${KEY}`,
  speaker_url: 'https://meet.ffmuc.net/reserve/s/BBBBBBBBBBBBBBBBBBBBBB',
  guest_url: 'https://meet.ffmuc.net/r-abc',
  manage_url: `https://meet.ffmuc.net/reserve/#k=${KEY}`,
};

let saved: string | null = null;
beforeEach(() => {
  saved = null;
  setSecretStore({
    load: async () => saved,
    save: async v => {
      saved = v;
    },
  });
});

test.each([
  `https://meet.ffmuc.net/reserve/#k=${KEY}`,
  `https://meet.ffmuc.net/reserve/h/${KEY}`,
  `ffmuc-meet://meet.ffmuc.net/reserve/h/${KEY}`,
  KEY,
])('imports %s', async input => {
  const manage = jest.fn(async () => view);
  const r = await importRoom(input, { manage });
  expect(manage).toHaveBeenCalledWith(KEY);
  expect(r).toEqual({
    ok: true,
    room: { key: KEY, room: 'r-abc', expires: view.expires },
  });
  expect(saved).toContain('r-abc');
});

test('speaker link is rejected without a request', async () => {
  const manage = jest.fn();
  expect(
    await importRoom(
      'https://meet.ffmuc.net/reserve/s/BBBBBBBBBBBBBBBBBBBBBB',
      {
        manage,
      },
    ),
  ).toEqual({ ok: false, reason: 'speaker' });
  expect(manage).not.toHaveBeenCalled();
});

test.each(['https://meet.ffmuc.net/someroom', 'hello'])(
  '%s is not a host link',
  async input => {
    const manage = jest.fn();
    expect(await importRoom(input, { manage })).toEqual({
      ok: false,
      reason: 'notHost',
    });
    expect(manage).not.toHaveBeenCalled();
  },
);

test('server errors are passed on and nothing is stored', async () => {
  const err = new Error('gone');
  await expect(
    importRoom(KEY, { manage: async () => Promise.reject(err) }),
  ).rejects.toBe(err);
  expect(saved).toBeNull();
});
