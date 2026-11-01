import { ReserveClient, manageKeyOf } from './reserve/client';
import { clientFor, parseInput } from './join';
import { StoredRoom, saveRoomView } from './storage/rooms';

export type ImportResult =
  | { ok: true; room: StoredRoom }
  | { ok: false; reason: 'speaker' | 'notHost' };

/**
 * Imports a room from a manage link or host link (or a bare 22-character host secret).
 * The server is asked for the room data, then the room is stored.
 */
export async function importRoom(
  input: string,
  client: Pick<ReserveClient, 'manage'> = clientFor(),
): Promise<ImportResult> {
  const s = input.trim();
  const link = parseInput(s);
  if (link.kind === 'speaker') {
    return { ok: false, reason: 'speaker' };
  }
  let key = manageKeyOf(link);
  if (!key && /^[A-Za-z0-9_-]{22}$/.test(s)) {
    key = s;
  }
  if (!key) {
    return { ok: false, reason: 'notHost' };
  }
  const view = await client.manage(key);
  return { ok: true, room: await saveRoomView(view) };
}
