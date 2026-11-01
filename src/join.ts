import {
  ParsedLink,
  ReserveClient,
  ReserveError,
  parseLink,
} from './reserve/client';
import { sha256 } from './crypto/sha256';
import { nativePowSolver } from './native/pow';
import { RESERVE_BASE, SERVER_URL } from './theme';

export type MeetingRole = 'host' | 'speaker' | 'viewer';

/** What the meeting screen needs. The token lives in memory only. */
export interface MeetingTarget {
  server: string;
  room: string;
  role: MeetingRole;
  token?: string;
}

export type JoinPlan =
  | { kind: 'meeting'; target: MeetingTarget }
  | { kind: 'manage'; server: string; key: string }
  | { kind: 'reserve'; server: string }
  | { kind: 'invalid' };

const clients = new Map<string, ReserveClient>();

/** One client per server, so each has its own JWT cache. */
export function clientFor(server: string = SERVER_URL): ReserveClient {
  let c = clients.get(server);
  if (!c) {
    c = new ReserveClient({
      baseUrl: server === SERVER_URL ? RESERVE_BASE : `${server}/reserve`,
      powSolver: nativePowSolver,
      sha256,
    });
    clients.set(server, c);
  }
  return c;
}

export function parseInput(input: string): ParsedLink {
  return parseLink(input, { defaultServer: SERVER_URL });
}

/**
 * Turns a parsed link into a plan. Host and speaker links get a fresh JWT
 * from the server. Viewer links (plain room URLs) join without a JWT.
 */
export async function planJoin(
  link: ParsedLink,
  getClient: (server: string) => Pick<ReserveClient, 'join'> = clientFor,
): Promise<JoinPlan> {
  switch (link.kind) {
    case 'host':
    case 'speaker': {
      const info = await getClient(link.server).join(link.key, link.kind);
      return {
        kind: 'meeting',
        target: {
          server: info.server || link.server,
          room: info.room,
          role: info.role,
          token: info.jwt,
        },
      };
    }
    case 'manage':
      return { kind: 'manage', server: link.server, key: link.key };
    case 'reserve':
      return { kind: 'reserve', server: link.server };
    case 'room': {
      if (link.jwt) {
        // v1 host link (room?jwt=<host secret>): try as host, else as viewer.
        try {
          const info = await getClient(link.server).join(link.jwt, 'host');
          return {
            kind: 'meeting',
            target: {
              server: info.server || link.server,
              room: info.room,
              role: info.role,
              token: info.jwt,
            },
          };
        } catch (e) {
          if (!(e instanceof ReserveError) || e.status === 0) {
            throw e;
          }
        }
      }
      return {
        kind: 'meeting',
        target: { server: link.server, room: link.room, role: 'viewer' },
      };
    }
    default:
      return { kind: 'invalid' };
  }
}

export type LinkRole = 'host' | 'speaker' | 'viewer' | 'open' | 'manage';

export interface LinkPreview {
  role: LinkRole;
  server: string;
  /** Known for room links only. Secret links show the room after joining. */
  room?: string;
  /** The link can be saved to "My rooms". */
  canSave: boolean;
}

const RESERVED_ROOM = /^r-[a-z0-9]{14}$/;

/** What a pasted text is, before any request. Null if it is not a link. */
export function describeLink(input: string): LinkPreview | null {
  if (!input.trim()) {
    return null;
  }
  const link = parseInput(input);
  switch (link.kind) {
    case 'host':
    case 'speaker':
      return {
        role: link.kind,
        server: link.server,
        canSave: link.kind === 'host' && link.server === SERVER_URL,
      };
    case 'manage':
      return {
        role: 'manage',
        server: link.server,
        canSave: link.server === SERVER_URL,
      };
    case 'room':
      if (link.jwt) {
        return {
          role: 'host',
          server: link.server,
          room: link.room,
          canSave: link.server === SERVER_URL,
        };
      }
      return {
        role: RESERVED_ROOM.test(link.room) ? 'viewer' : 'open',
        server: link.server,
        room: link.room,
        canSave: false,
      };
    default:
      return null;
  }
}
