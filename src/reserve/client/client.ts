import { ReserveError, toReserveError } from './errors';
import { DEFAULT_SERVER, DEFAULT_RESERVE_PATH } from './links';
import { solvePow, webCryptoSha256 } from './pow';
import type {
  Challenge,
  JoinInfo,
  JoinRole,
  PowRequestOptions,
  ReserveClientOptions,
  RoomView,
  Sha256,
} from './types';

/** Renew a cached JWT this long before it expires. */
const JWT_MARGIN_MS = 2 * 60 * 1000;

/**
 * Client for the room reservation service (meet-reserve). No framework
 * dependencies: it needs fetch and a SHA-256 function.
 */
export class ReserveClient {
  readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly sha256?: Sha256;
  private readonly powBatchSize?: number;
  /** JWTs in memory only, by room and role. Never persisted. */
  private readonly jwtCache = new Map<string, JoinInfo>();

  constructor(opts: ReserveClientOptions = {}) {
    this.baseUrl = (
      opts.baseUrl ?? DEFAULT_SERVER + DEFAULT_RESERVE_PATH
    ).replace(/\/+$/, '');
    const f = opts.fetch ?? globalThis.fetch;
    if (!f) {
      throw new Error('ReserveClient: no fetch');
    }
    this.fetchFn = f.bind(globalThis);
    this.sha256 = opts.sha256 ?? webCryptoSha256();
    this.powBatchSize = opts.powBatchSize;
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
    signal?: AbortSignal,
  ): Promise<T> {
    let res: Response;
    try {
      res = await this.fetchFn(`${this.baseUrl}/api/${path}`, {
        method,
        headers:
          body === undefined
            ? { Accept: 'application/json' }
            : {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      });
    } catch (e) {
      if (signal?.aborted) {
        throw new ReserveError('aborted', 'aborted');
      }
      throw new ReserveError(
        'network',
        e instanceof Error ? e.message : String(e),
      );
    }
    let json: unknown;
    try {
      json = await res.json();
    } catch {
      json = undefined;
    }
    if (!res.ok) {
      throw toReserveError(res.status, json);
    }
    if (json === undefined || json === null || typeof json !== 'object') {
      throw new ReserveError('internal', 'invalid answer', res.status);
    }
    return json as T;
  }

  /** GET /api/challenge */
  challenge(signal?: AbortSignal): Promise<Challenge> {
    return this.request<Challenge>('GET', 'challenge', undefined, signal);
  }

  /** Gets a challenge, solves it and POSTs body with challenge and nonce. */
  private async withPow<T>(
    path: string,
    body: Record<string, unknown>,
    opts: PowRequestOptions = {},
  ): Promise<T> {
    if (!this.sha256) {
      throw new Error('ReserveClient: no SHA-256 implementation');
    }
    const c = await this.challenge(opts.signal);
    const nonce = await solvePow(c.challenge, c.difficulty, {
      sha256: this.sha256,
      onProgress: opts.onProgress,
      signal: opts.signal,
      batchSize: this.powBatchSize,
    });
    return this.request<T>(
      'POST',
      path,
      { ...body, challenge: c.challenge, nonce },
      opts.signal,
    );
  }

  /** Reserves a new room. hours = 0 uses the default duration. */
  reserve(hours: number, opts?: PowRequestOptions): Promise<RoomView> {
    return this.withPow<RoomView>('reserve', { hours }, opts);
  }

  /** Extends a room. key = host secret or a manage or host link. */
  extend(
    key: string,
    hours: number,
    opts?: PowRequestOptions,
  ): Promise<RoomView> {
    return this.withPow<RoomView>('extend', { key, hours }, opts);
  }

  /** Room status and links. */
  manage(key: string): Promise<RoomView> {
    return this.request<RoomView>('POST', 'manage', { key });
  }

  /** Makes new host, speaker and manage links. The old ones stop working. */
  async rotate(key: string): Promise<RoomView> {
    const v = await this.request<RoomView>('POST', 'rotate', { key });
    this.forgetJwts(v.room);
    return v;
  }

  /** Deletes the room for good. */
  async delete(key: string): Promise<{ deleted: boolean }> {
    const r = await this.request<{ deleted: boolean }>('POST', 'delete', {
      key,
    });
    this.jwtCache.clear();
    return r;
  }

  /**
   * Gets a JWT to join as host or speaker. key = host or speaker secret, or
   * any link that has one. A cached JWT is used until shortly before it
   * expires. Viewer links (plain room URLs) need no JWT: join them directly.
   */
  async join(
    key: string,
    role?: JoinRole,
    now: () => number = Date.now,
  ): Promise<JoinInfo> {
    const ck = `${key}\n${role ?? ''}`;
    const hit = this.jwtCache.get(ck);
    if (hit && Date.parse(hit.jwt_expires) - JWT_MARGIN_MS > now()) {
      return hit;
    }
    this.jwtCache.delete(ck);
    const body: Record<string, string> = { key };
    if (role) {
      body.role = role;
    }
    const info = await this.request<JoinInfo>('POST', 'join', body);
    this.jwtCache.set(ck, info);
    return info;
  }

  /** Drops cached JWTs, for one room or all. */
  forgetJwts(room?: string): void {
    if (room === undefined) {
      this.jwtCache.clear();
      return;
    }
    for (const [k, v] of this.jwtCache) {
      if (v.room === room) {
        this.jwtCache.delete(k);
      }
    }
  }
}
