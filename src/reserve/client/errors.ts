/**
 * Stable error codes. Server "reason" values are used as is. Proof-of-work
 * reasons come as "pow_<x>". Client-side codes: network, aborted, http.
 */
export type ReserveErrorCode =
  | 'invalid'
  | 'unknown'
  | 'replaced'
  | 'deleted'
  | 'expired'
  | 'forbidden'
  | 'too_many_requests'
  | 'malformed'
  | 'internal'
  | 'pow_malformed'
  | 'pow_bad_mac'
  | 'pow_expired'
  | 'pow_insufficient'
  | 'pow_replay'
  | 'network'
  | 'aborted'
  | 'http';

const KNOWN_CODES: ReadonlySet<string> = new Set<ReserveErrorCode>([
  'invalid',
  'unknown',
  'replaced',
  'deleted',
  'expired',
  'forbidden',
  'too_many_requests',
  'malformed',
  'internal',
  'pow_malformed',
  'pow_bad_mac',
  'pow_expired',
  'pow_insufficient',
  'pow_replay',
]);

/** Error texts of servers that send no "reason". */
const KNOWN_TEXTS: Record<string, ReserveErrorCode> = {
  'room was deleted': 'deleted',
  'room expired': 'expired',
  'this link was replaced by new links': 'replaced',
  'unknown room or not a host link': 'unknown',
  'unknown room or not a host or speaker link': 'unknown',
  'unknown room': 'unknown',
  'no host link found': 'unknown',
  'a speaker link cannot join as host': 'forbidden',
  'duration not allowed': 'malformed',
  'method not allowed': 'malformed',
  malformed: 'malformed',
  internal: 'internal',
};

export class ReserveError extends Error {
  readonly code: ReserveErrorCode;
  /** HTTP status, 0 if there was no answer. */
  readonly status: number;
  /** Raw "reason" from the server, if any. */
  readonly reason?: string;

  constructor(
    code: ReserveErrorCode,
    message: string,
    status = 0,
    reason?: string,
  ) {
    super(message);
    this.name = 'ReserveError';
    this.code = code;
    this.status = status;
    this.reason = reason;
  }

  /** True if the room cannot be used again with this key. */
  get isGone(): boolean {
    return (
      this.code === 'deleted' ||
      this.code === 'replaced' ||
      this.code === 'expired' ||
      this.code === 'invalid' ||
      this.code === 'unknown'
    );
  }
}

/** Maps an error answer of the server to a ReserveError. */
export function toReserveError(status: number, body: unknown): ReserveError {
  const b = (body && typeof body === 'object' ? body : {}) as {
    error?: unknown;
    reason?: unknown;
  };
  const reason = typeof b.reason === 'string' ? b.reason : undefined;
  const text = typeof b.error === 'string' ? b.error : '';
  const message = text || `HTTP ${status}`;

  if (status === 429 || reason === 'too_many_requests') {
    return new ReserveError('too_many_requests', message, status, reason);
  }
  if (reason && KNOWN_CODES.has(reason)) {
    return new ReserveError(
      reason as ReserveErrorCode,
      message,
      status,
      reason,
    );
  }
  const byText = KNOWN_TEXTS[text.toLowerCase()];
  if (byText) {
    return new ReserveError(byText, message, status, reason);
  }
  if (status === 403 && text) {
    // Old servers send the bare PoW reason as error text.
    const pow = `pow_${text}`;
    if (KNOWN_CODES.has(pow)) {
      return new ReserveError(pow as ReserveErrorCode, message, status, reason);
    }
  }
  if (status >= 500) {
    return new ReserveError('internal', message, status, reason);
  }
  return new ReserveError('http', message, status, reason);
}
