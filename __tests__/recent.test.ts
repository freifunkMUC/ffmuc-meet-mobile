import AsyncStorage from '@react-native-async-storage/async-storage';
import { addRecent, loadRecent, removeRecent } from '../src/storage/recent';

beforeEach(() => AsyncStorage.clear());

test('adds newest first, without duplicates, max 15', async () => {
  for (let i = 0; i < 20; i++) {
    await addRecent('https://meet.ffmuc.net', `room${i}`, i);
  }
  await addRecent('https://meet.ffmuc.net', 'room10', 99);
  const list = await loadRecent();
  expect(list).toHaveLength(15);
  expect(list[0]).toEqual({
    server: 'https://meet.ffmuc.net',
    room: 'room10',
    at: 99,
  });
  expect(list.filter(r => r.room === 'room10')).toHaveLength(1);
});

test('removes one entry', async () => {
  await addRecent('https://a.example', 'x');
  await addRecent('https://b.example', 'x');
  const list = await removeRecent('https://a.example', 'x');
  expect(list.map(r => r.server)).toEqual(['https://b.example']);
});

test('ignores broken data', async () => {
  await AsyncStorage.setItem('recent-meetings', '{bad');
  expect(await loadRecent()).toEqual([]);
});
