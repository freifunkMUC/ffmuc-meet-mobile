import { createHash } from 'crypto';
import { sha256 } from '../src/crypto/sha256';

const hex = (b: Uint8Array) => Buffer.from(b).toString('hex');

test.each([
  '',
  'abc',
  'test-challenge:1202',
  'a'.repeat(55),
  'a'.repeat(56),
  'a'.repeat(64),
  'x'.repeat(1000),
  'Grüße 🎉 Freifunk',
])('same as Node.js crypto: %#', s => {
  expect(hex(sha256(s))).toBe(
    createHash('sha256').update(s, 'utf8').digest('hex'),
  );
});
