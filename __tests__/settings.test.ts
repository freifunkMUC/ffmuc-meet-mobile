import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_SETTINGS,
  MAX_NAME,
  loadSettings,
  saveSettings,
} from '../src/storage/settings';

beforeEach(() => AsyncStorage.clear());

test('defaults', async () => {
  expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
});

test('save and load', async () => {
  await saveSettings({
    displayName: '  Anna  ',
    startAudioMuted: true,
    startVideoMuted: false,
  });
  expect(await loadSettings()).toEqual({
    displayName: 'Anna',
    startAudioMuted: true,
    startVideoMuted: false,
  });
});

test('bad data gives defaults, long names are cut', async () => {
  await AsyncStorage.setItem('net.ffmuc.meet.settings', '{broken');
  expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
  await AsyncStorage.setItem(
    'net.ffmuc.meet.settings',
    JSON.stringify({ displayName: 'x'.repeat(200), startAudioMuted: 'yes' }),
  );
  const s = await loadSettings();
  expect(s.displayName).toHaveLength(MAX_NAME);
  expect(s.startAudioMuted).toBe(false);
});
