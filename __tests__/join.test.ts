import { ReserveError } from '../src/reserve/client';
import { parseInput, planJoin, describeLink, recentJoin } from '../src/join';

const KEY = 'AAAAAAAAAAAAAAAAAAAAAA';
const info = (role: 'host' | 'speaker') => ({
  server: 'https://meet.ffmuc.net',
  room: 'r-bcdfghjkmnpqrs',
  role,
  jwt: `jwt-${role}`,
  jwt_expires: '2030-01-01T00:00:00Z',
  room_expires: '2030-01-02T00:00:00Z',
});

function fakeClient(impl?: (key: string, role?: string) => unknown) {
  const join = jest.fn(async (key: string, role?: 'host' | 'speaker') =>
    impl ? impl(key, role) : info(role ?? 'host'),
  );
  return { join, get: () => ({ join } as never) };
}

describe('planJoin', () => {
  test('room name joins as viewer without JWT', async () => {
    const c = fakeClient();
    const plan = await planJoin(parseInput('my-room'), c.get);
    expect(plan).toEqual({
      kind: 'meeting',
      target: {
        server: 'https://meet.ffmuc.net',
        room: 'my-room',
        role: 'viewer',
      },
    });
    expect(c.join).not.toHaveBeenCalled();
  });

  test('room URL of other server joins there', async () => {
    const plan = await planJoin(parseInput('https://meet.example.org/abc'));
    expect(plan).toEqual({
      kind: 'meeting',
      target: {
        server: 'https://meet.example.org',
        room: 'abc',
        role: 'viewer',
      },
    });
  });

  test.each([
    ['https://meet.ffmuc.net/reserve/h/' + KEY, 'host'],
    ['https://meet.ffmuc.net/reserve/s/' + KEY, 'speaker'],
    ['ffmuc-meet://reserve/h/' + KEY, 'host'],
    ['jitsi-meet://meet.ffmuc.net/reserve/s/' + KEY, 'speaker'],
  ] as const)('%s gets a JWT as %s', async (link, role) => {
    const c = fakeClient();
    const plan = await planJoin(parseInput(link), c.get);
    expect(c.join).toHaveBeenCalledWith(KEY, role);
    expect(plan).toEqual({
      kind: 'meeting',
      target: {
        server: 'https://meet.ffmuc.net',
        room: 'r-bcdfghjkmnpqrs',
        role,
        token: `jwt-${role}`,
      },
    });
  });

  test('manage link gives manage plan', async () => {
    const plan = await planJoin(
      parseInput(`https://meet.ffmuc.net/reserve/#k=${KEY}`),
    );
    expect(plan).toEqual({
      kind: 'manage',
      server: 'https://meet.ffmuc.net',
      key: KEY,
    });
  });

  test('reserve page gives reserve plan', async () => {
    const plan = await planJoin(parseInput('https://meet.ffmuc.net/reserve/'));
    expect(plan.kind).toBe('reserve');
  });

  test('invalid input', async () => {
    expect(await planJoin(parseInput('a/b/c'))).toEqual({ kind: 'invalid' });
  });

  test('v1 host link joins as host', async () => {
    const c = fakeClient();
    const plan = await planJoin(
      parseInput(`https://meet.ffmuc.net/room1?jwt=${KEY}`),
      c.get,
    );
    expect(c.join).toHaveBeenCalledWith(KEY, 'host');
    expect(plan.kind === 'meeting' && plan.target.role).toBe('host');
  });

  test('v1 host link falls back to viewer on server error', async () => {
    const c = fakeClient(() => {
      throw new ReserveError('unknown', 'unknown', 400);
    });
    const plan = await planJoin(
      parseInput(`https://meet.ffmuc.net/room1?jwt=${KEY}`),
      c.get,
    );
    expect(plan).toEqual({
      kind: 'meeting',
      target: {
        server: 'https://meet.ffmuc.net',
        room: 'room1',
        role: 'viewer',
      },
    });
  });

  test('v1 host link: network error is not hidden', async () => {
    const c = fakeClient(() => {
      throw new ReserveError('network', 'network', 0);
    });
    await expect(
      planJoin(parseInput(`https://meet.ffmuc.net/room1?jwt=${KEY}`), c.get),
    ).rejects.toMatchObject({ code: 'network' });
  });

  test('server errors pass through', async () => {
    const c = fakeClient(() => {
      throw new ReserveError('forbidden', 'forbidden', 403);
    });
    await expect(
      planJoin(parseInput(`https://meet.ffmuc.net/reserve/s/${KEY}`), c.get),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });
});

describe('describeLink', () => {
  const K = 'AAAAAAAAAAAAAAAAAAAAAA';
  test.each([
    ['', null],
    ['   ', null],
    [`https://meet.ffmuc.net/reserve/h/${K}`, { role: 'host', canSave: true }],
    [
      `https://meet.ffmuc.net/reserve/s/${K}`,
      { role: 'speaker', canSave: false },
    ],
    [
      `https://meet.ffmuc.net/reserve/#k=${K}`,
      { role: 'manage', canSave: true },
    ],
    [
      'https://meet.ffmuc.net/r-abcdefghijklmn',
      { role: 'viewer', room: 'r-abcdefghijklmn' },
    ],
    ['team-weekly', { role: 'open', room: 'team-weekly', canSave: false }],
    [`https://other.example/reserve/h/${K}`, { role: 'host', canSave: false }],
  ])('%s', (input, expected) => {
    const r = describeLink(input);
    if (expected === null) {
      expect(r).toBeNull();
    } else {
      expect(r).toMatchObject(expected);
    }
  });
});

describe('plain rooms join without the reserve API', () => {
  const fetchSpy = jest.fn();
  beforeEach(() => {
    fetchSpy.mockReset();
    (global as { fetch: unknown }).fetch = fetchSpy;
  });

  test.each([
    ['my-room', 'https://meet.ffmuc.net', 'my-room'],
    ['https://meet.ffmuc.net/MyTeam', 'https://meet.ffmuc.net', 'MyTeam'],
    ['meet.ffmuc.net/stammtisch', 'https://meet.ffmuc.net', 'stammtisch'],
    ['ffmuc-meet://meet.ffmuc.net/abc', 'https://meet.ffmuc.net', 'abc'],
    ['jitsi-meet://meet.ffmuc.net/abc', 'https://meet.ffmuc.net', 'abc'],
    [
      'https://meet.ffmuc.net/r-bcdfghjkmnpqrs',
      'https://meet.ffmuc.net',
      'r-bcdfghjkmnpqrs',
    ],
    ['https://meet.example.org/abc', 'https://meet.example.org', 'abc'],
  ])('%s', async (input, server, room) => {
    const c = fakeClient();
    const plan = await planJoin(parseInput(input), c.get);
    expect(plan).toEqual({
      kind: 'meeting',
      target: { server, room, role: 'viewer' },
    });
    expect(c.join).not.toHaveBeenCalled();
    // Also with the real client: no network request at all.
    await planJoin(parseInput(input));
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('recentJoin', () => {
  const R = 'r-bcdfghjkmnpqrs';
  const keys = new Map([[R, KEY]]);

  test('open room: plain URL, no badge', () => {
    expect(
      recentJoin({ server: 'https://meet.ffmuc.net', room: 'my room' }, keys),
    ).toEqual({ url: 'https://meet.ffmuc.net/my%20room' });
  });

  test('reserved room in My rooms: host link', () => {
    expect(
      recentJoin({ server: 'https://meet.ffmuc.net', room: R }, keys),
    ).toEqual({ url: `https://meet.ffmuc.net/reserve/h/${KEY}`, role: 'host' });
  });

  test('other reserved room: viewer', () => {
    expect(
      recentJoin({ server: 'https://meet.ffmuc.net', room: R }, new Map()),
    ).toEqual({ url: `https://meet.ffmuc.net/${R}`, role: 'viewer' });
  });

  test('other server: no host link, no badge', () => {
    expect(
      recentJoin({ server: 'https://meet.example.org', room: R }, keys),
    ).toEqual({ url: `https://meet.example.org/${R}` });
  });
});
