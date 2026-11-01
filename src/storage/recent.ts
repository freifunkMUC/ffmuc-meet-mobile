import AsyncStorage from '@react-native-async-storage/async-storage';

/** A recent meeting. Only server and room name: no secrets, no tokens. */
export interface RecentMeeting {
  server: string;
  room: string;
  /** Time of the last join, ms since epoch. */
  at: number;
}

const KEY = 'recent-meetings';
const MAX = 15;

export async function loadRecent(): Promise<RecentMeeting[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as RecentMeeting[]) : [];
    return Array.isArray(list)
      ? list.filter(
          r => typeof r?.room === 'string' && typeof r?.server === 'string',
        )
      : [];
  } catch {
    return [];
  }
}

async function save(list: RecentMeeting[]): Promise<RecentMeeting[]> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
  return list;
}

export async function addRecent(
  server: string,
  room: string,
  at: number = Date.now(),
): Promise<RecentMeeting[]> {
  const list = (await loadRecent()).filter(
    r => !(r.server === server && r.room === room),
  );
  return save([{ server, room, at }, ...list].slice(0, MAX));
}

export async function removeRecent(
  server: string,
  room: string,
): Promise<RecentMeeting[]> {
  const list = await loadRecent();
  return save(list.filter(r => !(r.server === server && r.room === room)));
}
