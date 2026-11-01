import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Settings {
  displayName: string;
  startAudioMuted: boolean;
  startVideoMuted: boolean;
}

const KEY = 'net.ffmuc.meet.settings';

export const DEFAULT_SETTINGS: Settings = {
  displayName: '',
  startAudioMuted: false,
  startVideoMuted: false,
};

/** Display names longer than this are cut. */
export const MAX_NAME = 64;

function clean(v: unknown): Settings {
  const o = (v && typeof v === 'object' ? v : {}) as Partial<Settings>;
  return {
    displayName:
      typeof o.displayName === 'string'
        ? o.displayName.trim().slice(0, MAX_NAME)
        : '',
    startAudioMuted: o.startAudioMuted === true,
    startVideoMuted: o.startVideoMuted === true,
  };
}

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? clean(JSON.parse(raw)) : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(s: Settings): Promise<Settings> {
  const v = clean(s);
  await AsyncStorage.setItem(KEY, JSON.stringify(v));
  return v;
}
