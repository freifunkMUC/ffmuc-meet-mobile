import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { loadThemePref, setThemePref } from '../src/storage/themePref';

beforeEach(() => AsyncStorage.clear());

test('default is system', async () => {
  expect(await loadThemePref()).toBe('system');
});

test.each([
  ['dark', 'dark'],
  ['light', 'light'],
  ['system', 'unspecified'],
] as const)('%s is stored and applied as %s', async (pref, native) => {
  const spy = jest
    .spyOn(Appearance, 'setColorScheme')
    .mockImplementation(() => {});
  await setThemePref(pref);
  expect(spy).toHaveBeenCalledWith(native);
  expect(await loadThemePref()).toBe(pref);
  spy.mockRestore();
});

test('unknown value gives system', async () => {
  await AsyncStorage.setItem('net.ffmuc.meet.theme', 'blue');
  expect(await loadThemePref()).toBe('system');
});
