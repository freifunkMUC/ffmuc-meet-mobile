import * as Keychain from 'react-native-keychain';
import { RoomView, extractKey } from '../reserve/client';

/**
 * A room in "My rooms". Only these fields are stored, in the Keychain (iOS)
 * or encrypted with the Android Keystore. No JWTs, no speaker secrets.
 */
export interface StoredRoom {
  /** Host secret. */
  key: string;
  room: string;
  /** Cached expiry, RFC 3339. */
  expires: string;
}

export interface SecretStore {
  load(): Promise<string | null>;
  save(value: string): Promise<void>;
}

const SERVICE = 'net.ffmuc.meet.rooms';

export const keychainStore: SecretStore = {
  async load() {
    const r = await Keychain.getGenericPassword({ service: SERVICE });
    return r ? r.password : null;
  },
  async save(value) {
    await Keychain.setGenericPassword('rooms', value, {
      service: SERVICE,
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
      storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
    });
  },
};

let store: SecretStore = keychainStore;
let queue: Promise<unknown> = Promise.resolve();

/** For tests. */
export function setSecretStore(s: SecretStore): void {
  store = s;
}

/** Runs storage changes one after the other. */
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const next = queue.then(fn, fn);
  queue = next.catch(() => undefined);
  return next;
}

function isStoredRoom(r: unknown): r is StoredRoom {
  const o = r as StoredRoom;
  return (
    !!o &&
    typeof o.key === 'string' &&
    typeof o.room === 'string' &&
    typeof o.expires === 'string'
  );
}

async function read(): Promise<StoredRoom[]> {
  try {
    const raw = await store.load();
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list)
      ? list.filter(isStoredRoom).map(({ key, room, expires }) => ({
          key,
          room,
          expires,
        }))
      : [];
  } catch {
    return [];
  }
}

type Listener = (rooms: StoredRoom[]) => void;
const listeners = new Set<Listener>();

/** Calls fn after each change of the stored rooms. Returns "unsubscribe". */
export function onRoomsChanged(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

async function write(list: StoredRoom[]): Promise<StoredRoom[]> {
  await store.save(JSON.stringify(list));
  const sorted = sortRooms(list);
  listeners.forEach(fn => fn(sorted));
  return list;
}

/** Rooms sorted by expiry, soonest first. */
export function loadRooms(): Promise<StoredRoom[]> {
  return serial(read).then(sortRooms);
}

export function sortRooms(list: StoredRoom[]): StoredRoom[] {
  return [...list].sort(
    (a, b) => Date.parse(a.expires) - Date.parse(b.expires),
  );
}

/** The host secret in a server answer (from its manage link). */
export function keyOfView(view: RoomView): string {
  const key = extractKey(view.manage_url) || extractKey(view.host_url);
  if (!key) {
    throw new Error('no host secret in answer');
  }
  return key;
}

/** Adds or updates a room from a server answer. */
export function saveRoomView(view: RoomView): Promise<StoredRoom> {
  return serial(async () => {
    const entry: StoredRoom = {
      key: keyOfView(view),
      room: view.room,
      expires: view.expires,
    };
    const list = (await read()).filter(r => r.room !== view.room);
    await write([...list, entry]);
    return entry;
  });
}

export function getRoom(room: string): Promise<StoredRoom | undefined> {
  return serial(read).then(list => list.find(r => r.room === room));
}

export function removeRoom(room: string): Promise<StoredRoom[]> {
  return serial(async () =>
    sortRooms(await write((await read()).filter(r => r.room !== room))),
  );
}
