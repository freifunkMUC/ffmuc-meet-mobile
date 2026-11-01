import {
  getRoom,
  loadRooms,
  removeRoom,
  saveRoomView,
  setSecretStore,
} from '../src/storage/rooms';
import type { RoomView } from '../src/reserve/client';

const K1 = 'AAAAAAAAAAAAAAAAAAAAAA';
const K2 = 'BBBBBBBBBBBBBBBBBBBBBB';

function view(room: string, key: string, expires: string): RoomView {
  return {
    room,
    status: 'active',
    expires,
    max_ahead_h: 8760,
    durations: [72],
    host_url: `https://meet.ffmuc.net/reserve/h/${key}`,
    speaker_url: 'https://meet.ffmuc.net/reserve/s/CCCCCCCCCCCCCCCCCCCCCC',
    guest_url: `https://meet.ffmuc.net/${room}`,
    manage_url: `https://meet.ffmuc.net/reserve/#k=${key}`,
  };
}

let saved: string | null;
beforeEach(() => {
  saved = null;
  setSecretStore({
    load: async () => saved,
    save: async v => {
      saved = v;
    },
  });
});

test('stores only key, room and expiry', async () => {
  await saveRoomView(view('r-a', K1, '2030-01-01T00:00:00Z'));
  expect(JSON.parse(saved!)).toEqual([
    { key: K1, room: 'r-a', expires: '2030-01-01T00:00:00Z' },
  ]);
});

test('update replaces the key after rotate, sorted by expiry', async () => {
  await saveRoomView(view('r-a', K1, '2030-02-01T00:00:00Z'));
  await saveRoomView(view('r-b', K1, '2030-01-01T00:00:00Z'));
  await saveRoomView(view('r-a', K2, '2030-03-01T00:00:00Z'));
  const list = await loadRooms();
  expect(list.map(r => r.room)).toEqual(['r-b', 'r-a']);
  expect((await getRoom('r-a'))?.key).toBe(K2);
});

test('parallel saves do not lose data', async () => {
  await Promise.all([
    saveRoomView(view('r-a', K1, '2030-01-01T00:00:00Z')),
    saveRoomView(view('r-b', K2, '2030-01-02T00:00:00Z')),
  ]);
  expect((await loadRooms()).length).toBe(2);
});

test('remove', async () => {
  await saveRoomView(view('r-a', K1, '2030-01-01T00:00:00Z'));
  expect(await removeRoom('r-a')).toEqual([]);
});

test('broken data gives an empty list', async () => {
  saved = '[{"room":1}, "x"';
  expect(await loadRooms()).toEqual([]);
  saved = '[{"room":"r","key":"k","expires":"e","jwt":"no"}]';
  expect(await loadRooms()).toEqual([{ room: 'r', key: 'k', expires: 'e' }]);
});
