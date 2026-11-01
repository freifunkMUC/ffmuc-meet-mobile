import { NativeModules } from 'react-native';
import type { PowBatchSolver } from '../reserve/client';

interface FfmucPowModule {
  solve(
    challenge: string,
    difficulty: number,
    start: number,
    count: number,
  ): Promise<number | null>;
}

const native: FfmucPowModule | undefined = NativeModules.FfmucPow;

/** Proof of work in native code (Android, iOS), or undefined. */
export const nativePowSolver: PowBatchSolver | undefined = native
  ? (challenge, difficulty, start, count) =>
      native.solve(challenge, difficulty, start, count)
  : undefined;
