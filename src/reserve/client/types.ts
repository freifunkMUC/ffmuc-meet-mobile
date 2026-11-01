/** Answer of GET /api/challenge. */
export interface Challenge {
  challenge: string;
  /** Leading zero bits that SHA-256(challenge + ":" + nonce) must have. */
  difficulty: number;
  /** Allowed durations in hours. */
  durations: number[];
  /** Default duration in hours. */
  default: number;
  /** How far ahead (hours from now) a room can be reserved. */
  max_ahead_h: number;
}

export type RoomStatus = 'active' | 'expired' | 'deleted';

/** Answer of /api/reserve, /api/manage, /api/extend and /api/rotate. */
export interface RoomView {
  room: string;
  status: RoomStatus;
  /** RFC 3339 time. */
  expires: string;
  max_ahead_h: number;
  durations: number[];
  /** Short host link: <base>/h/<host secret>. */
  host_url: string;
  /** Short speaker link: <base>/s/<speaker secret>. */
  speaker_url: string;
  /** Plain room URL for viewers. */
  guest_url: string;
  /** Manage link: <base>/#k=<host secret>. */
  manage_url: string;
  /** Only /api/manage: true if a v1 link was migrated. */
  migrated?: boolean;
}

export type JoinRole = 'host' | 'speaker';

/** Answer of POST /api/join. Never store the jwt. */
export interface JoinInfo {
  /** Jitsi server URL, for example https://meet.ffmuc.net */
  server: string;
  room: string;
  role: JoinRole;
  jwt: string;
  /** RFC 3339 time. */
  jwt_expires: string;
  /** RFC 3339 time. */
  room_expires: string;
}

/** SHA-256 of a UTF-8 string. Sync or async. */
export type Sha256 = (input: string) => Uint8Array | Promise<Uint8Array>;

export interface PowProgress {
  /** Hashes done. */
  hashes: number;
  /** Estimated progress 0..1 (it is a lottery, not a counter). */
  ratio: number;
}

export interface PowOptions {
  sha256: Sha256;
  onProgress?: (p: PowProgress) => void;
  signal?: AbortSignal;
  /** Hashes between progress reports and yields to the event loop. */
  batchSize?: number;
  /** First nonce. Default 0. */
  start?: number;
}

export interface ReserveClientOptions {
  /** Base URL of the reserve service. Default https://meet.ffmuc.net/reserve */
  baseUrl?: string;
  /** fetch implementation. Default globalThis.fetch. */
  fetch?: typeof fetch;
  /** SHA-256 implementation. Default WebCrypto (crypto.subtle). */
  sha256?: Sha256;
  /** Hashes per PoW batch. */
  powBatchSize?: number;
}

export interface PowRequestOptions {
  onProgress?: (p: PowProgress) => void;
  signal?: AbortSignal;
}
