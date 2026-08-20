import { browser } from '$app/environment';
import type { GameEvent } from '$lib/game/model';
import { replay } from '$lib/game/reducer';
import type { Seat } from '$lib/manifests/teaching-duel';

const key = (roomId: string) => `xwing:room:${roomId}:events`;
const channel = (roomId: string) => `xwing:room:${roomId}:changed`;

export const ROOM_ID = 'FLIGHT7';
export const pairingCode: Record<Seat, string> = { rebel: 'RED-5', imperial: 'ONYX-2' };

export function readEvents(roomId = ROOM_ID): GameEvent[] {
  if (!browser) return [];
  try { return JSON.parse(localStorage.getItem(key(roomId)) ?? '[]') as GameEvent[]; }
  catch { return []; }
}

type EventInput = GameEvent extends infer Event ? Event extends GameEvent ? Omit<Event, 'id' | 'sequence'> : never : never;

export function appendEvent(event: EventInput, roomId = ROOM_ID): GameEvent {
  const events = readEvents(roomId);
  const complete = { ...event, id: `${roomId}-${events.length + 1}`, sequence: events.length + 1 } as GameEvent;
  const projected = replay([...events, complete]);
  if (projected.diagnostics.length) throw new Error(projected.diagnostics.at(-1)!.message);
  localStorage.setItem(key(roomId), JSON.stringify([...events, complete]));
  window.dispatchEvent(new CustomEvent(channel(roomId)));
  return complete;
}

export function subscribeToRoom(roomId: string, listener: (events: GameEvent[]) => void) {
  const update = () => listener(readEvents(roomId));
  const storage = (event: StorageEvent) => { if (event.key === key(roomId)) update(); };
  window.addEventListener('storage', storage);
  window.addEventListener(channel(roomId), update);
  update();
  return () => {
    window.removeEventListener('storage', storage);
    window.removeEventListener(channel(roomId), update);
  };
}

export function createRoom(roomId = ROOM_ID) {
  if (!browser) return;
  localStorage.removeItem(key(roomId));
  appendEvent({ type: 'game/created', actor: 'table', payload: { gameId: roomId, seed: 0x5857494e } }, roomId);
}

export function claimSeat(roomId: string, seat: Seat, code: string) {
  if (code.toUpperCase() !== pairingCode[seat]) throw new Error('Pairing code does not match this seat.');
  appendEvent({ type: 'player/joined', actor: seat, payload: { seat } }, roomId);
}
