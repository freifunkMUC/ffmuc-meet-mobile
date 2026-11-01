/** Default server of the reserve service. */
export const DEFAULT_SERVER = 'https://meet.ffmuc.net';
export const DEFAULT_RESERVE_PATH = '/reserve';

/** URL schemes that open the app. They map to https. */
export const APP_SCHEMES = ['ffmuc-meet', 'jitsi-meet', 'org.jitsi.meet'];

export type ParsedLink =
  /** A plain room. jwt is set for a v1 host link (room?jwt=…). */
  | { kind: 'room'; server: string; room: string; jwt?: string }
  /** Short host link /reserve/h/<secret>. */
  | { kind: 'host'; server: string; key: string }
  /** Short speaker link /reserve/s/<secret>. */
  | { kind: 'speaker'; server: string; key: string }
  /** Manage link /reserve/#k=<secret> (or v1 #m=<token>). */
  | { kind: 'manage'; server: string; key: string }
  /** The reserve page without a key. */
  | { kind: 'reserve'; server: string }
  | { kind: 'invalid' };

export interface ParseOptions {
  /** Server for bare room names and app links without host. */
  defaultServer?: string;
  /** Path of the reserve service. Default /reserve */
  reservePath?: string;
}

const SECRET_RE = /^[A-Za-z0-9_-]{22}$/;
const RESERVED_ROOM_RE = /^r-[bcdfghjkmnpqrstvwxz2-9]{14}$/;
const URL_RE = /^([a-z][a-z0-9+.-]*):\/\/([^/?#]*)([^?#]*)(\?[^#]*)?(#.*)?$/i;
const HOST_RE = /^[a-z0-9.-]+(:\d+)?$/i;
const ROOM_RE = /^[^\s/?#&]{1,200}$/u;

/** True for a host or speaker secret (16 random bytes, base64url). */
export function isValidSecret(s: string): boolean {
  return SECRET_RE.test(s);
}

/** True for a room name made by the reserve service. */
export function isReservedRoomName(room: string): boolean {
  return RESERVED_ROOM_RE.test(room);
}

/** True for a name that Jitsi accepts as a room. */
export function isValidRoomName(room: string): boolean {
  return ROOM_RE.test(room);
}

/**
 * Pulls the key out of a pasted manage, host or speaker link, or a v1 host
 * link (?jwt=…). Returns the input (trimmed) if there is no known marker.
 * Same rules as the server.
 */
export function extractKey(
  input: string,
  reservePath = DEFAULT_RESERVE_PATH,
): string {
  let s = input.trim();
  for (const marker of [
    '#k=',
    '#m=',
    'jwt=',
    `${reservePath}/h/`,
    `${reservePath}/s/`,
  ]) {
    const i = s.lastIndexOf(marker);
    if (i >= 0) {
      s = s.slice(i + marker.length);
    }
  }
  const end = s.search(/[&#?/ ]/);
  return end >= 0 ? s.slice(0, end) : s;
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function param(query: string | undefined, name: string): string | undefined {
  if (!query) {
    return undefined;
  }
  for (const part of query.replace(/^\?/, '').split('&')) {
    const eq = part.indexOf('=');
    const k = eq >= 0 ? part.slice(0, eq) : part;
    if (k === name) {
      return safeDecode(eq >= 0 ? part.slice(eq + 1) : '');
    }
  }
  return undefined;
}

function trimSlash(s: string): string {
  return s.replace(/\/+$/, '');
}

/**
 * Parses what a user pasted or what opened the app: a room name, a room URL,
 * a host, speaker or manage link, or an app link (ffmuc-meet://, jitsi-meet://).
 */
export function parseLink(input: string, opts: ParseOptions = {}): ParsedLink {
  const defaultServer = trimSlash(opts.defaultServer ?? DEFAULT_SERVER);
  const reservePath =
    '/' + (opts.reservePath ?? DEFAULT_RESERVE_PATH).replace(/^\/+|\/+$/g, '');
  let s = input.trim();
  if (!s) {
    return { kind: 'invalid' };
  }

  // "meet.ffmuc.net/room" without scheme.
  if (
    !/^[a-z][a-z0-9+.-]*:\/\//i.test(s) &&
    /^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?\//i.test(s)
  ) {
    s = `https://${s}`;
  }

  const m = URL_RE.exec(s);
  if (!m) {
    const room = safeDecode(s);
    return isValidRoomName(room)
      ? { kind: 'room', server: defaultServer, room }
      : { kind: 'invalid' };
  }

  const scheme = m[1].toLowerCase();
  let host = m[2].toLowerCase();
  let path = m[3] || '';
  const query = m[4];
  const hash = m[5];

  if (APP_SCHEMES.includes(scheme)) {
    if (!host.includes('.') && host !== 'localhost') {
      // ffmuc-meet://room or ffmuc-meet://reserve/h/… : no server in the link.
      path = `/${host}${path}`;
      host = '';
    }
  } else if (scheme !== 'https' && scheme !== 'http') {
    return { kind: 'invalid' };
  }
  if (host && !HOST_RE.test(host)) {
    return { kind: 'invalid' };
  }
  const server = host
    ? `${scheme === 'http' ? 'http' : 'https'}://${host}`
    : defaultServer;

  path = trimSlash(path);
  if (path === reservePath || path.startsWith(`${reservePath}/`)) {
    const rest = path.slice(reservePath.length);
    const short = /^\/([hs])\/([^/]+)$/.exec(rest);
    if (short) {
      const key = safeDecode(short[2]);
      if (!isValidSecret(key)) {
        return { kind: 'invalid' };
      }
      return { kind: short[1] === 'h' ? 'host' : 'speaker', server, key };
    }
    if (rest === '') {
      const k =
        hash && /^#[km]=/.test(hash) ? extractKey(hash, reservePath) : '';
      if (k) {
        return { kind: 'manage', server, key: k };
      }
      return { kind: 'reserve', server };
    }
    return { kind: 'invalid' };
  }

  const segments = path.split('/').filter(Boolean);
  if (segments.length !== 1) {
    return { kind: 'invalid' };
  }
  const room = safeDecode(segments[0]);
  if (!isValidRoomName(room)) {
    return { kind: 'invalid' };
  }
  const jwt = param(query, 'jwt');
  return jwt
    ? { kind: 'room', server, room, jwt }
    : { kind: 'room', server, room };
}

/**
 * The key to manage a room, from a parsed link. Only manage and host links,
 * and v1 host links (room?jwt=…), give a key.
 */
export function manageKeyOf(link: ParsedLink): string | undefined {
  switch (link.kind) {
    case 'manage':
    case 'host':
      return link.key;
    case 'room':
      return link.jwt;
    default:
      return undefined;
  }
}
