import { createHash } from 'crypto';
import { checkPow, leadingZeroBits, solvePow } from '../pow';
import { ReserveError } from '../errors';

const sha256 = (s: string) =>
  new Uint8Array(createHash('sha256').update(s, 'utf8').digest());

// Vectors checked with the Go code of the server (crypto/sha256, bits.LeadingZeros8).
const REAL_CHALLENGE =
  '1793545841.780a6a416866e4d01a2d12ee.d18069227b7cdc0c0d88e22c887ad317';

describe('leadingZeroBits', () => {
  test.each([
    [[0xff], 0],
    [[0x80], 0],
    [[0x7f], 1],
    [[0x01], 7],
    [[0x00, 0xff], 8],
    [[0x00, 0x00, 0x0f], 20],
    [[0x00, 0x00, 0x03, 0x02], 22],
    [[0x00, 0x00], 16],
  ])('%j -> %i', (bytes, n) => {
    expect(leadingZeroBits(new Uint8Array(bytes))).toBe(n);
  });
});

describe('checkPow', () => {
  test('known vector, difficulty 18', async () => {
    expect(await checkPow(REAL_CHALLENGE, '233995', 18, sha256)).toBe(true);
    expect(await checkPow(REAL_CHALLENGE, '233995', 22, sha256)).toBe(true);
    expect(await checkPow(REAL_CHALLENGE, '233995', 23, sha256)).toBe(false);
  });
  test('wrong nonce fails', async () => {
    expect(await checkPow('test-challenge', '1201', 12, sha256)).toBe(false);
  });
});

describe('solvePow', () => {
  test('finds the first nonce (difficulty 12)', async () => {
    expect(
      await solvePow('test-challenge', 12, { sha256, batchSize: 256 }),
    ).toBe('1202');
  });

  test('finds the first nonce of a real challenge (difficulty 18)', async () => {
    const progress: number[] = [];
    const nonce = await solvePow(REAL_CHALLENGE, 18, {
      sha256,
      batchSize: 10000,
      onProgress: p => progress.push(p.ratio),
    });
    expect(nonce).toBe('233995');
    expect(progress.length).toBeGreaterThan(1);
    expect(progress[progress.length - 1]).toBe(1);
    for (let i = 1; i < progress.length; i++) {
      expect(progress[i]).toBeGreaterThanOrEqual(progress[i - 1]);
    }
  });

  test('works with async sha256', async () => {
    const asyncSha = async (s: string) => sha256(s);
    expect(await solvePow('test-challenge', 12, { sha256: asyncSha })).toBe(
      '1202',
    );
  });

  test('difficulty 0 needs no work', async () => {
    expect(await solvePow('x', 0, { sha256 })).toBe('0');
  });

  test('stops when aborted', async () => {
    const ac = new AbortController();
    const p = solvePow('never', 64, {
      sha256,
      batchSize: 100,
      signal: ac.signal,
      onProgress: () => ac.abort(),
    });
    await expect(p).rejects.toBeInstanceOf(ReserveError);
    await expect(p).rejects.toMatchObject({ code: 'aborted' });
  });
});
