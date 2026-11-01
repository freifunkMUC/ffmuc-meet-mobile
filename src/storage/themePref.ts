import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

export type ThemePref = 'system' | 'light' | 'dark';

const KEY = 'net.ffmuc.meet.theme';

/** Light or dark for the whole app, native bars included. */
export function applyThemePref(pref: ThemePref): void {
  Appearance.setColorScheme(pref === 'system' ? 'unspecified' : pref);
}

export async function loadThemePref(): Promise<ThemePref> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

export async function setThemePref(pref: ThemePref): Promise<void> {
  applyThemePref(pref);
  await AsyncStorage.setItem(KEY, pref);
}
