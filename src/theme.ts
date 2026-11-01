import { useMemo } from 'react';
import { ColorSchemeName, StyleSheet, useColorScheme } from 'react-native';

export interface Palette {
  scheme: 'light' | 'dark';
  accent: string;
  accent2: string;
  background: string;
  card: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  /** Accent as text, AA on background and card. */
  accentText: string;
  /** Yellow as text (section titles), AA on background. */
  danger: string;
  success: string;
  warn: string;
  badge: Record<BadgeKind, { bg: string; fg: string }>;
  /** Card shadow. Light: soft and neutral. Dark: deeper. */
  elevation: Elevation;
  /** Card border width. */
  cardBorder: number;
}

export interface Elevation {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
  elevation: number;
}

export type BadgeKind = 'host' | 'speaker' | 'viewer' | 'manage';

/** Colours of https://meet.ffmuc.net/reserve. */
export const dark: Palette = {
  scheme: 'dark',
  accent: '#dc0067',
  accent2: '#ff4d94',
  background: '#16181d',
  card: '#222831',
  surface: '#1c2027',
  border: 'rgba(255,255,255,0.10)',
  text: '#eef0f3',
  textMuted: '#9ba3ae',
  accentText: '#ff8fbd',
  danger: '#ff5a5a',
  success: '#2fd18a',
  warn: '#ffb547',
  badge: {
    host: { bg: 'rgba(220,0,103,0.22)', fg: '#ff8fbd' },
    speaker: { bg: 'rgba(245,196,0,0.16)', fg: '#ffd84d' },
    viewer: { bg: 'rgba(255,255,255,0.10)', fg: '#d6dae0' },
    manage: { bg: '#dc0067', fg: '#ffffff' },
  },
  elevation: {
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardBorder: 1,
};

/** Light variant. All text pairs have WCAG AA contrast (4.5:1). */
export const light: Palette = {
  scheme: 'light',
  accent: '#dc0067',
  accent2: '#ff4d94',
  background: '#f4f5f7',
  card: '#ffffff',
  surface: '#eceef2',
  border: 'rgba(22,24,29,0.12)',
  text: '#16181d',
  textMuted: '#5b6470',
  accentText: '#b0004f',
  danger: '#b3261e',
  success: '#1a7f4b',
  warn: '#8a5300',
  badge: {
    host: { bg: 'rgba(220,0,103,0.12)', fg: '#b0004f' },
    speaker: { bg: '#fff4c2', fg: '#5c4800' },
    viewer: { bg: 'rgba(22,24,29,0.07)', fg: '#3d434b' },
    manage: { bg: '#dc0067', fg: '#ffffff' },
  },
  elevation: {
    shadowColor: '#16181d',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardBorder: StyleSheet.hairlineWidth,
};

export function paletteFor(scheme: ColorSchemeName): Palette {
  return scheme === 'light' ? light : dark;
}

/** The palette for the system light or dark mode. Updates live. */
export function useTheme(): Palette {
  return paletteFor(useColorScheme());
}

/** Styles that depend on the palette, made once per palette. */
export function makeStyles<T>(fn: (c: Palette) => T): () => T {
  const cache = new Map<Palette, T>();
  return function useStyles() {
    const c = useTheme();
    return useMemo(() => {
      let s = cache.get(c);
      if (!s) {
        s = fn(c);
        cache.set(c, s);
      }
      return s;
    }, [c]);
  };
}

/** Pink gradient of the primary buttons. */
export function accentGradient(c: Palette): string {
  return `linear-gradient(135deg, ${c.accent}, ${c.accent2})`;
}

export const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
};

export const radius = 18;
export const smallRadius = 10;

export const SERVER_URL = 'https://meet.ffmuc.net';
export const RESERVE_BASE = `${SERVER_URL}/reserve`;
