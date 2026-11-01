import { ReserveError } from './errors';
import type { PowOptions, Sha256 } from './types';

/** Number of leading zero bits in a hash. */
export function leadingZeroBits(hash: Uint8Array): number {
  let n = 0;
  for (const b of hash) {
    if (b === 0) {
      n += 8;
      continue;
    }
    return n + Math.clz32(b) - 24;
  }
  return n;
}

/** True if SHA-256(challenge + ":" + nonce) has enough leading zero bits. */
export async function checkPow(
  challenge: string,
  nonce: string,
  difficulty: number,
  sha256: Sha256,
): Promise<boolean> {
  return leadingZeroBits(await sha256(`${challenge}:${nonce}`)) >= difficulty;
}

const yieldToEventLoop = () =>
  new Promise<void>(resolve => setTimeout(resolve, 0));

/**
 * Finds a decimal nonce so that SHA-256(challenge + ":" + nonce) has at least
 * `difficulty` leading zero bits. Works in batches and yields to the event
 * loop between batches, so a UI thread stays responsive.
 */
export async function solvePow(
  challenge: string,
  difficulty: number,
  opts: PowOptions,
): Promise<string> {
  const { sha256, batchSolver, onProgress, signal } = opts;
  if (difficulty <= 0) {
    return String(opts.start ?? 0);
  }
  const expected = 2 ** difficulty;
  let hashes = 0;
  if (batchSolver) {
    const batch = Math.max(1, opts.batchSize ?? 20000);
    for (let n = opts.start ?? 0; ; n += batch) {
      if (signal?.aborted) {
        throw new ReserveError('aborted', 'aborted');
      }
      const found = await batchSolver(challenge, difficulty, n, batch);
      if (found !== null && found !== undefined) {
        onProgress?.({ hashes: hashes + found - n + 1, ratio: 1 });
        return String(found);
      }
      hashes += batch;
      onProgress?.({ hashes, ratio: 1 - Math.exp(-hashes / expected) });
    }
  }
  if (!sha256) {
    throw new Error('solvePow: no sha256 or batchSolver');
  }
  const batch = Math.max(1, opts.batchSize ?? 2048);
  for (let n = opts.start ?? 0; ; ) {
    if (signal?.aborted) {
      throw new ReserveError('aborted', 'aborted');
    }
    for (let i = 0; i < batch; i++, n++) {
      const nonce = String(n);
      const h = await sha256(`${challenge}:${nonce}`);
      hashes++;
      if (leadingZeroBits(h) >= difficulty) {
        onProgress?.({ hashes, ratio: 1 });
        return nonce;
      }
    }
    onProgress?.({ hashes, ratio: 1 - Math.exp(-hashes / expected) });
    await yieldToEventLoop();
  }
}

type Subtle = {
  digest(alg: string, data: Uint8Array): Promise<ArrayBuffer>;
};
type Encoder = new () => { encode(s: string): Uint8Array };

/** SHA-256 with WebCrypto, if the platform has it. */
export function webCryptoSha256(): Sha256 | undefined {
  const g = globalThis as {
    crypto?: { subtle?: Subtle };
    TextEncoder?: Encoder;
  };
  const subtle = g.crypto?.subtle;
  if (!subtle || !g.TextEncoder) {
    return undefined;
  }
  const enc = new g.TextEncoder();
  return async (input: string) =>
    new Uint8Array(await subtle.digest('SHA-256', enc.encode(input)));
}
