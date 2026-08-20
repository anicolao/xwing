import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import type { GameEvent } from '$lib/game/model';
import { replay } from '$lib/game/reducer';
import type { Seat } from '$lib/manifests/teaching-duel';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import { collection, connectFirestoreEmulator, doc, getDocs, initializeFirestore, onSnapshot, orderBy, query, runTransaction, setDoc, type Firestore } from 'firebase/firestore';

const key = (roomId: string) => `xwing:room:${roomId}:events`;
const channel = (roomId: string) => `xwing:room:${roomId}:changed`;
const useFirestore = browser && (env.PUBLIC_FIREBASE_EMULATOR === 'true' || Boolean(env.PUBLIC_FIREBASE_API_KEY));

export const ROOM_ID = 'FLIGHT7';
export const pairingCode: Record<Seat, string> = { rebel: 'RED-5', imperial: 'ONYX-2' };
type EventInput = GameEvent extends infer Event ? Event extends GameEvent ? Omit<Event, 'id' | 'sequence'> : never : never;

function readLocal(roomId = ROOM_ID): GameEvent[] {
  if (!browser) return [];
  try { return JSON.parse(localStorage.getItem(key(roomId)) ?? '[]') as GameEvent[]; }
  catch { return []; }
}

let remote: Promise<{ auth: Auth; db: Firestore }> | undefined;
function remoteClient() {
  remote ??= (async () => {
    const app = getApps().length ? getApp() : initializeApp({
      apiKey: env.PUBLIC_FIREBASE_API_KEY ?? 'demo-xwing-key',
      authDomain: env.PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'demo-xwing.firebaseapp.com',
      projectId: env.PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-xwing'
    });
    const auth = getAuth(app); const db = initializeFirestore(app, { experimentalForceLongPolling: true });
    if (env.PUBLIC_FIREBASE_EMULATOR === 'true') {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true }); connectFirestoreEmulator(db, '127.0.0.1', 8080);
    }
    if (!auth.currentUser) await signInAnonymously(auth);
    return { auth, db };
  })();
  return remote;
}

async function readRemote(roomId: string) {
  const { db } = await remoteClient(); const snapshot = await getDocs(query(collection(db, 'games', roomId, 'events'), orderBy('sequence')));
  return snapshot.docs.map((entry) => entry.data() as GameEvent);
}

export async function readEvents(roomId = ROOM_ID): Promise<GameEvent[]> { return useFirestore ? readRemote(roomId) : readLocal(roomId); }

export async function appendEvent(event: EventInput, roomId = ROOM_ID): Promise<GameEvent> {
  if (!useFirestore) {
    const events = readLocal(roomId); const complete = { ...event, id: `${roomId}-${events.length + 1}`, sequence: events.length + 1 } as GameEvent;
    const projected = replay([...events, complete]); if (projected.diagnostics.length) throw new Error(projected.diagnostics.at(-1)!.message);
    localStorage.setItem(key(roomId), JSON.stringify([...events, complete])); window.dispatchEvent(new CustomEvent(channel(roomId))); return complete;
  }
  const { db } = await remoteClient(); const events = await readRemote(roomId);
  const complete = { ...event, id: `${roomId}-${events.length + 1}`, sequence: events.length + 1 } as GameEvent;
  const projected = replay([...events, complete]); if (projected.diagnostics.length) throw new Error(projected.diagnostics.at(-1)!.message);
  const serialized = JSON.parse(JSON.stringify(complete)) as GameEvent;
  await runTransaction(db, async (transaction) => {
    const roomReference = doc(db, 'games', roomId); const room = await transaction.get(roomReference);
    if (!room.exists() || room.data().revision !== events.length) throw new Error('Room changed while this action was being accepted. Retry it.');
    transaction.set(doc(db, 'games', roomId, 'events', String(complete.sequence).padStart(8, '0')), serialized);
    transaction.update(roomReference, { revision: complete.sequence, updatedAt: Date.now() });
  });
  return complete;
}

export function subscribeToRoom(roomId: string, listener: (events: GameEvent[]) => void) {
  if (!useFirestore) {
    const update = () => listener(readLocal(roomId)); const storage = (event: StorageEvent) => { if (event.key === key(roomId)) update(); };
    window.addEventListener('storage', storage); window.addEventListener(channel(roomId), update); update();
    return () => { window.removeEventListener('storage', storage); window.removeEventListener(channel(roomId), update); };
  }
  let stopped = false; let unsubscribe = () => {};
  void remoteClient().then(({ db }) => {
    if (stopped) return;
    unsubscribe = onSnapshot(query(collection(db, 'games', roomId, 'events'), orderBy('sequence')), (snapshot) => listener(snapshot.docs.map((entry) => entry.data() as GameEvent)));
  });
  return () => { stopped = true; unsubscribe(); };
}

export async function createRoom(roomId = ROOM_ID) {
  if (!browser) return;
  if (!useFirestore) { localStorage.removeItem(key(roomId)); await appendEvent({ type: 'game/created', actor: 'table', payload: { gameId: roomId, seed: 0x5857494e } }, roomId); return; }
  const { auth, db } = await remoteClient();
  await setDoc(doc(db, 'games', roomId), { revision: 0, tableUid: auth.currentUser!.uid, createdAt: Date.now(), updatedAt: Date.now() });
  await appendEvent({ type: 'game/created', actor: 'table', payload: { gameId: roomId, seed: 0x5857494e } }, roomId);
}

export async function claimSeat(roomId: string, seat: Seat, code: string) {
  if (code.toUpperCase() !== pairingCode[seat]) throw new Error('Pairing code does not match this seat.');
  await appendEvent({ type: 'player/joined', actor: seat, payload: { seat } }, roomId);
}
