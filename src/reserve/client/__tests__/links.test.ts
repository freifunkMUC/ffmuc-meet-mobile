import {
  extractKey,
  isReservedRoomName,
  isValidSecret,
  manageKeyOf,
  parseLink,
} from '../links';

const S = 'AbCdEfGhIjKlMnOpQrSt_-'; // 22 chars, base64url
const SERVER = 'https://meet.ffmuc.net';

describe('parseLink', () => {
  test.each([
    // Room names and room URLs
    ['myroom', { kind: 'room', server: SERVER, room: 'myroom' }],
    ['  myroom  ', { kind: 'room', server: SERVER, room: 'myroom' }],
    [
      'r-bcdfghjkmnpqrs',
      { kind: 'room', server: SERVER, room: 'r-bcdfghjkmnpqrs' },
    ],
    [
      'https://meet.ffmuc.net/myroom',
      { kind: 'room', server: SERVER, room: 'myroom' },
    ],
    [
      'https://meet.ffmuc.net/myroom/',
      { kind: 'room', server: SERVER, room: 'myroom' },
    ],
    [
      'https://meet.ffmuc.net/myroom#config.startWithAudioMuted=true',
      { kind: 'room', server: SERVER, room: 'myroom' },
    ],
    [
      'https://MEET.ffmuc.net/MyRoom?lang=de',
      { kind: 'room', server: SERVER, room: 'MyRoom' },
    ],
    ['meet.ffmuc.net/myroom', { kind: 'room', server: SERVER, room: 'myroom' }],
    [
      'https://meet.ffmuc.net/M%C3%BCnchen',
      { kind: 'room', server: SERVER, room: 'München' },
    ],
    [
      'https://other.example.org/room1',
      { kind: 'room', server: 'https://other.example.org', room: 'room1' },
    ],
    // v1 host link
    [
      'https://meet.ffmuc.net/r-abc?jwt=eyJ.x.y',
      { kind: 'room', server: SERVER, room: 'r-abc', jwt: 'eyJ.x.y' },
    ],
    // App links
    [
      'ffmuc-meet://meet.ffmuc.net/myroom',
      { kind: 'room', server: SERVER, room: 'myroom' },
    ],
    [
      'jitsi-meet://meet.ffmuc.net/myroom',
      { kind: 'room', server: SERVER, room: 'myroom' },
    ],
    [
      'org.jitsi.meet://meet.ffmuc.net/myroom',
      { kind: 'room', server: SERVER, room: 'myroom' },
    ],
    ['ffmuc-meet://myroom', { kind: 'room', server: SERVER, room: 'myroom' }],
    [
      `ffmuc-meet://meet.ffmuc.net/reserve/h/${S}`,
      { kind: 'host', server: SERVER, key: S },
    ],
    [
      `ffmuc-meet://reserve/s/${S}`,
      { kind: 'speaker', server: SERVER, key: S },
    ],
    // Host, speaker and manage links
    [
      `https://meet.ffmuc.net/reserve/h/${S}`,
      { kind: 'host', server: SERVER, key: S },
    ],
    [
      `https://meet.ffmuc.net/reserve/h/${S}/`,
      { kind: 'host', server: SERVER, key: S },
    ],
    [
      `https://meet.ffmuc.net/reserve/s/${S}`,
      { kind: 'speaker', server: SERVER, key: S },
    ],
    [
      `https://meet.ffmuc.net/reserve/#k=${S}`,
      { kind: 'manage', server: SERVER, key: S },
    ],
    [
      `https://meet.ffmuc.net/reserve#k=${S}`,
      { kind: 'manage', server: SERVER, key: S },
    ],
    [
      'https://meet.ffmuc.net/reserve/#m=v1token',
      { kind: 'manage', server: SERVER, key: 'v1token' },
    ],
    ['https://meet.ffmuc.net/reserve/', { kind: 'reserve', server: SERVER }],
    [
      'https://meet.ffmuc.net/reserve/#gone=expired',
      { kind: 'reserve', server: SERVER },
    ],
    // Invalid
    ['', { kind: 'invalid' }],
    ['   ', { kind: 'invalid' }],
    ['two words', { kind: 'invalid' }],
    ['https://meet.ffmuc.net/', { kind: 'invalid' }],
    ['https://meet.ffmuc.net/a/b', { kind: 'invalid' }],
    ['https://meet.ffmuc.net/reserve/h/short', { kind: 'invalid' }],
    ['https://meet.ffmuc.net/reserve/x/y', { kind: 'invalid' }],
    ['ftp://meet.ffmuc.net/room', { kind: 'invalid' }],
    ['java' + 'script://alert(1)', { kind: 'invalid' }],
    ['https://bad_host!/room', { kind: 'invalid' }],
  ])('%s', (input, expected) => {
    expect(parseLink(input)).toEqual(expected);
  });

  test('custom default server', () => {
    expect(
      parseLink('room', { defaultServer: 'https://example.org/' }),
    ).toEqual({
      kind: 'room',
      server: 'https://example.org',
      room: 'room',
    });
  });
});

describe('extractKey', () => {
  test.each([
    [S, S],
    [`  ${S}  `, S],
    [`https://meet.ffmuc.net/reserve/#k=${S}`, S],
    [`https://meet.ffmuc.net/reserve/h/${S}`, S],
    [`https://meet.ffmuc.net/reserve/h/${S}/`, S],
    [`https://meet.ffmuc.net/reserve/s/${S}`, S],
    ['https://meet.ffmuc.net/reserve/#m=tok', 'tok'],
    ['https://meet.ffmuc.net/r-x?jwt=a.b.c&lang=de', 'a.b.c'],
  ])('%s', (input, key) => {
    expect(extractKey(input)).toBe(key);
  });
});

describe('helpers', () => {
  test('isValidSecret', () => {
    expect(isValidSecret(S)).toBe(true);
    expect(isValidSecret(S + 'x')).toBe(false);
    expect(isValidSecret('AbCdEfGhIjKlMnOpQrSt+/')).toBe(false);
  });
  test('isReservedRoomName', () => {
    expect(isReservedRoomName('r-bcdfghjkmnpqrs')).toBe(true);
    expect(isReservedRoomName('r-bcdfghjkmnpqra')).toBe(false);
    expect(isReservedRoomName('myroom')).toBe(false);
  });
  test('manageKeyOf', () => {
    expect(
      manageKeyOf(parseLink(`https://meet.ffmuc.net/reserve/#k=${S}`)),
    ).toBe(S);
    expect(
      manageKeyOf(parseLink(`https://meet.ffmuc.net/reserve/h/${S}`)),
    ).toBe(S);
    expect(
      manageKeyOf(parseLink(`https://meet.ffmuc.net/reserve/s/${S}`)),
    ).toBeUndefined();
    expect(
      manageKeyOf(parseLink('https://meet.ffmuc.net/room')),
    ).toBeUndefined();
    expect(manageKeyOf(parseLink('https://meet.ffmuc.net/room?jwt=t'))).toBe(
      't',
    );
  });
});
