import { createHash } from 'crypto';
import { ReserveClient } from '../client';
import { ReserveError, toReserveError } from '../errors';

const sha256 = (s: string) =>
  new Uint8Array(createHash('sha256').update(s, 'utf8').digest());

describe('toReserveError', () => {
  test.each([
    [400, { error: 'x', reason: 'invalid' }, 'invalid'],
    [
      404,
      { error: 'unknown room or not a host link', reason: 'unknown' },
      'unknown',
    ],
    [410, { error: 'x', reason: 'replaced' }, 'replaced'],
    [410, { error: 'x', reason: 'deleted' }, 'deleted'],
    [410, { error: 'x', reason: 'expired' }, 'expired'],
    [403, { error: 'x', reason: 'forbidden' }, 'forbidden'],
    [400, { error: 'x', reason: 'malformed' }, 'malformed'],
    [500, { error: 'internal', reason: 'internal' }, 'internal'],
    [
      403,
      { error: 'insufficient', reason: 'pow_insufficient' },
      'pow_insufficient',
    ],
    [403, { error: 'replay', reason: 'pow_replay' }, 'pow_replay'],
    [403, { error: 'expired', reason: 'pow_expired' }, 'pow_expired'],
    [403, { error: 'bad_mac', reason: 'pow_bad_mac' }, 'pow_bad_mac'],
    [403, { error: 'malformed', reason: 'pow_malformed' }, 'pow_malformed'],
    // 429, with or without body
    [429, { error: 'slow down' }, 'too_many_requests'],
    [429, undefined, 'too_many_requests'],
    [400, { reason: 'too_many_requests' }, 'too_many_requests'],
    // Fallback to error text (servers without reason)
    [410, { error: 'room was deleted' }, 'deleted'],
    [410, { error: 'room expired' }, 'expired'],
    [410, { error: 'this link was replaced by new links' }, 'replaced'],
    [404, { error: 'unknown room or not a host link' }, 'unknown'],
    [403, { error: 'insufficient' }, 'pow_insufficient'],
    // Unknown reason falls back to text, then to status
    [410, { error: 'room expired', reason: 'something_new' }, 'expired'],
    [418, { error: 'teapot' }, 'http'],
    [502, undefined, 'internal'],
    [400, 'not json', 'http'],
  ])('%i %j -> %s', (status, body, code) => {
    const e = toReserveError(status, body);
    expect(e).toBeInstanceOf(ReserveError);
    expect(e.code).toBe(code);
    expect(e.status).toBe(status);
  });

  test('message prefers error text', () => {
    expect(
      toReserveError(410, { error: 'room expired', reason: 'expired' }).message,
    ).toBe('room expired');
    expect(toReserveError(502, undefined).message).toBe('HTTP 502');
  });

  test('isGone', () => {
    expect(toReserveError(410, { reason: 'deleted' }).isGone).toBe(true);
    expect(toReserveError(429, {}).isGone).toBe(false);
  });
});

type Call = { url: string; method: string; body?: unknown };

function mockFetch(responses: Array<{ status: number; body: unknown }>) {
  const calls: Call[] = [];
  const fn = jest.fn(async (url: string, init?: RequestInit) => {
    calls.push({
      url,
      method: init?.method ?? 'GET',
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });
    const r = responses.shift();
    if (!r) {
      throw new Error('no more responses');
    }
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      json: async () => {
        if (r.body === undefined) {
          throw new SyntaxError('no json');
        }
        return r.body;
      },
    } as Response;
  });
  return { fn: fn as unknown as typeof fetch, calls };
}

const view = {
  room: 'r-bcdfghjkmnpqrs',
  status: 'active',
  expires: '2030-01-01T00:00:00Z',
  max_ahead_h: 8760,
  durations: [72, 168],
  host_url: 'https://meet.ffmuc.net/reserve/h/x',
  speaker_url: 'https://meet.ffmuc.net/reserve/s/y',
  guest_url: 'https://meet.ffmuc.net/r-bcdfghjkmnpqrs',
  manage_url: 'https://meet.ffmuc.net/reserve/#k=x',
};

describe('ReserveClient', () => {
  test('reserve solves the challenge and posts the nonce', async () => {
    const { fn, calls } = mockFetch([
      {
        status: 200,
        body: {
          challenge: 'test-challenge',
          difficulty: 12,
          durations: [72],
          default: 72,
          max_ahead_h: 8760,
        },
      },
      { status: 200, body: view },
    ]);
    const c = new ReserveClient({ fetch: fn, sha256 });
    const onProgress = jest.fn();
    const v = await c.reserve(72, { onProgress });
    expect(v.room).toBe(view.room);
    expect(calls[0]).toEqual({
      url: 'https://meet.ffmuc.net/reserve/api/challenge',
      method: 'GET',
      body: undefined,
    });
    expect(calls[1]).toEqual({
      url: 'https://meet.ffmuc.net/reserve/api/reserve',
      method: 'POST',
      body: { hours: 72, challenge: 'test-challenge', nonce: '1202' },
    });
    expect(onProgress).toHaveBeenLastCalledWith(
      expect.objectContaining({ ratio: 1 }),
    );
  });

  test('extend sends key, hours and PoW', async () => {
    const { fn, calls } = mockFetch([
      {
        status: 200,
        body: {
          challenge: 'test-challenge',
          difficulty: 12,
          durations: [72],
          default: 72,
          max_ahead_h: 8760,
        },
      },
      { status: 200, body: view },
    ]);
    await new ReserveClient({
      fetch: fn,
      sha256,
      baseUrl: 'https://example.org/reserve/',
    }).extend('K', 168);
    expect(calls[1]).toEqual({
      url: 'https://example.org/reserve/api/extend',
      method: 'POST',
      body: {
        key: 'K',
        hours: 168,
        challenge: 'test-challenge',
        nonce: '1202',
      },
    });
  });

  test.each(['manage', 'rotate', 'delete'] as const)(
    '%s posts the key',
    async op => {
      const { fn, calls } = mockFetch([
        { status: 200, body: op === 'delete' ? { deleted: true } : view },
      ]);
      await new ReserveClient({ fetch: fn, sha256 })[op]('K');
      expect(calls[0]).toEqual({
        url: `https://meet.ffmuc.net/reserve/api/${op}`,
        method: 'POST',
        body: { key: 'K' },
      });
    },
  );

  test('errors become ReserveError', async () => {
    const { fn } = mockFetch([
      { status: 410, body: { error: 'room expired', reason: 'expired' } },
    ]);
    await expect(
      new ReserveClient({ fetch: fn, sha256 }).manage('K'),
    ).rejects.toMatchObject({
      code: 'expired',
      status: 410,
    });
  });

  test('network failure', async () => {
    const fn = (async () => {
      throw new TypeError('Network request failed');
    }) as unknown as typeof fetch;
    await expect(
      new ReserveClient({ fetch: fn, sha256 }).manage('K'),
    ).rejects.toMatchObject({ code: 'network' });
  });

  test('join caches the JWT in memory until shortly before expiry', async () => {
    const info = (exp: string, jwt: string) => ({
      server: 'https://meet.ffmuc.net',
      room: view.room,
      role: 'host',
      jwt,
      jwt_expires: exp,
      room_expires: '2030-01-01T00:00:00Z',
    });
    const { fn, calls } = mockFetch([
      { status: 200, body: info('2030-01-01T01:00:00Z', 'j1') },
      { status: 200, body: info('2030-01-01T02:00:00Z', 'j2') },
      {
        status: 200,
        body: { ...info('2030-01-01T02:00:00Z', 'j3'), role: 'speaker' },
      },
    ]);
    const c = new ReserveClient({ fetch: fn, sha256 });
    const t0 = Date.parse('2030-01-01T00:00:00Z');
    expect((await c.join('K', 'host', () => t0)).jwt).toBe('j1');
    expect((await c.join('K', 'host', () => t0 + 30 * 60_000)).jwt).toBe('j1');
    expect(calls).toHaveLength(1);
    expect(calls[0].body).toEqual({ key: 'K', role: 'host' });
    // 1 minute before expiry: renew
    expect((await c.join('K', 'host', () => t0 + 59 * 60_000)).jwt).toBe('j2');
    // Other role: own cache entry
    expect((await c.join('K', 'speaker', () => t0)).jwt).toBe('j3');
    expect(calls).toHaveLength(3);
  });

  test('join without role sends only the key', async () => {
    const { fn, calls } = mockFetch([
      {
        status: 200,
        body: {
          server: 's',
          room: 'r',
          role: 'speaker',
          jwt: 'j',
          jwt_expires: '2000-01-01T00:00:00Z',
          room_expires: '',
        },
      },
    ]);
    await new ReserveClient({ fetch: fn, sha256 }).join('K');
    expect(calls[0].body).toEqual({ key: 'K' });
  });

  test('rotate drops cached JWTs of the room', async () => {
    const j = {
      server: 's',
      room: view.room,
      role: 'host',
      jwt: 'j1',
      jwt_expires: '2999-01-01T00:00:00Z',
      room_expires: '',
    };
    const { fn, calls } = mockFetch([
      { status: 200, body: j },
      { status: 200, body: view },
      { status: 200, body: { ...j, jwt: 'j2' } },
    ]);
    const c = new ReserveClient({ fetch: fn, sha256 });
    await c.join('K', 'host');
    await c.rotate('K');
    expect((await c.join('K', 'host')).jwt).toBe('j2');
    expect(calls).toHaveLength(3);
  });
});
