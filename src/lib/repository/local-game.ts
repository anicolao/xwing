import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import type { GameEvent } from '$lib/game/model';
import { GAME_CONFIG, replay } from '$lib/game/reducer';
import type { Seat } from '$lib/manifests/teaching-duel';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  initializeFirestore,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  type Firestore
} from 'firebase/firestore';
import {
  collection as liteCollection,
  connectFirestoreEmulator as connectLiteFirestoreEmulator,
  getDocs as getLiteDocs,
  getFirestore as getLiteFirestore,
  orderBy as liteOrderBy,
  query as liteQuery,
  type Firestore as LiteFirestore
} from 'firebase/firestore/lite';

const key = (roomId: string) => `xwing:room:${roomId}:events`;
const channel = (roomId: string) => `xwing:room:${roomId}:changed`;
const useFirestore = browser && (env.PUBLIC_FIREBASE_EMULATOR === 'true' || Boolean(env.PUBLIC_FIREBASE_API_KEY));

export const ROOM_ID = 'FLIGHT7';
const tableRoomKey = 'xwing:table-room';
type EventInput = GameEvent extends infer Event
  ? Event extends GameEvent
    ? Omit<Event, 'id' | 'sequence'>
    : never
  : never;

export function tableRoomId(): string {
  if (!browser) return ROOM_ID;
  const existing = sessionStorage.getItem(tableRoomKey);
  if (existing) return existing;
  const roomId =
    env.PUBLIC_FIREBASE_EMULATOR === 'true'
      ? ROOM_ID
      : `FLIGHT-${crypto.randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}`;
  sessionStorage.setItem(tableRoomKey, roomId);
  return roomId;
}

function readLocal(roomId = ROOM_ID): GameEvent[] {
  if (!browser) return [];
  try {
    return JSON.parse(localStorage.getItem(key(roomId)) ?? '[]') as GameEvent[];
  } catch {
    return [];
  }
}

let remote: Promise<{ auth: Auth; db: Firestore; readDb: LiteFirestore }> | undefined;
function remoteClient() {
  remote ??= (async () => {
    const app = getApps().length
      ? getApp()
      : initializeApp({
          apiKey: env.PUBLIC_FIREBASE_API_KEY ?? 'demo-xwing-key',
          authDomain: env.PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'demo-xwing.firebaseapp.com',
          projectId: env.PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-xwing'
        });
    const auth = getAuth(app);
    const db = initializeFirestore(app, { experimentalForceLongPolling: true });
    const readDb = getLiteFirestore(app);
    if (env.PUBLIC_FIREBASE_EMULATOR === 'true') {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      connectLiteFirestoreEmulator(readDb, '127.0.0.1', 8080);
    }
    if (!auth.currentUser) await signInAnonymously(auth);
    return { auth, db, readDb };
  })();
  return remote;
}

async function readRemote(roomId: string) {
  const { readDb } = await remoteClient();
  const snapshot = await getLiteDocs(
    liteQuery(liteCollection(readDb, 'games', roomId, 'events'), liteOrderBy('sequence'))
  );
  return snapshot.docs.map((entry) => entry.data() as GameEvent);
}

export async function readEvents(roomId = ROOM_ID): Promise<GameEvent[]> {
  return useFirestore ? readRemote(roomId) : readLocal(roomId);
}

export async function appendEvent(event: EventInput, roomId = ROOM_ID): Promise<GameEvent> {
  if (!useFirestore) {
    const events = readLocal(roomId);
    const complete = { ...event, id: `${roomId}-${events.length + 1}`, sequence: events.length + 1 } as GameEvent;
    const projected = replay([...events, complete]);
    if (projected.diagnostics.length) throw new Error(projected.diagnostics.at(-1)!.message);
    localStorage.setItem(key(roomId), JSON.stringify([...events, complete]));
    window.dispatchEvent(new CustomEvent(channel(roomId)));
    return complete;
  }
  const { db } = await remoteClient();
  const events = await readRemote(roomId);
  const complete = { ...event, id: `${roomId}-${events.length + 1}`, sequence: events.length + 1 } as GameEvent;
  const projected = replay([...events, complete]);
  if (projected.diagnostics.length) throw new Error(projected.diagnostics.at(-1)!.message);
  const serialized = JSON.parse(JSON.stringify(complete)) as GameEvent;
  await runTransaction(db, async (transaction) => {
    const roomReference = doc(db, 'games', roomId);
    const room = await transaction.get(roomReference);
    if (!room.exists() || room.data().revision !== events.length)
      throw new Error('Room changed while this action was being accepted. Retry it.');
    const documentId = `${String(complete.sequence).padStart(8, '0')}-${complete.actor}`;
    transaction.set(doc(db, 'games', roomId, 'events', documentId), serialized);
    transaction.update(roomReference, { revision: complete.sequence, updatedAt: Date.now() });
  });
  window.dispatchEvent(new CustomEvent(channel(roomId)));
  return complete;
}

export function subscribeToRoom(roomId: string, listener: (events: GameEvent[]) => void) {
  if (!useFirestore) {
    const update = () => listener(readLocal(roomId));
    const storage = (event: StorageEvent) => {
      if (event.key === key(roomId)) update();
    };
    window.addEventListener('storage', storage);
    window.addEventListener(channel(roomId), update);
    update();
    return () => {
      window.removeEventListener('storage', storage);
      window.removeEventListener(channel(roomId), update);
    };
  }
  let stopped = false;
  let unsubscribe = () => {};
  let poll: ReturnType<typeof setInterval>;
  let reading = false;
  let pending = false;
  const update = async () => {
    if (stopped) return;
    if (reading) {
      pending = true;
      return;
    }
    reading = true;
    try {
      const events = await readRemote(roomId);
      if (!stopped) listener(events);
    } catch {
      // A later poll retries transient transport and permission races.
    } finally {
      reading = false;
      if (pending) {
        pending = false;
        void update();
      }
    }
  };
  const changed = () => void update();
  window.addEventListener(channel(roomId), changed);
  void update();
  poll = setInterval(() => void update(), 1_000);
  void remoteClient().then(({ db }) => {
    if (stopped) return;
    unsubscribe = onSnapshot(
      query(collection(db, 'games', roomId, 'events'), orderBy('sequence')),
      (snapshot) => listener(snapshot.docs.map((entry) => entry.data() as GameEvent)),
      () => {
        // The Lite polling path remains authoritative if Watch is unavailable.
      }
    );
  });
  return () => {
    stopped = true;
    unsubscribe();
    window.removeEventListener(channel(roomId), changed);
    clearInterval(poll);
  };
}

export async function createRoom(roomId = ROOM_ID): Promise<void> {
  if (!browser) return;
  if (!useFirestore) {
    localStorage.removeItem(key(roomId));
    await appendEvent(
      { type: 'game/created', actor: 'table', payload: { gameId: roomId, seed: 0x5857494e, config: GAME_CONFIG } },
      roomId
    );
    return;
  }
  const { auth, db } = await remoteClient();
  await setDoc(doc(db, 'games', roomId), {
    revision: 0,
    tableUid: auth.currentUser!.uid,
    rebelUid: null,
    imperialUid: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  await appendEvent(
    { type: 'game/created', actor: 'table', payload: { gameId: roomId, seed: 0x5857494e, config: GAME_CONFIG } },
    roomId
  );
}

export async function claimSeat(roomId: string, seat: Seat) {
  if (useFirestore) {
    const { auth, db } = await remoteClient();
    const roomReference = doc(db, 'games', roomId);
    try {
      await updateDoc(roomReference, {
        [`${seat}Uid`]: auth.currentUser!.uid,
        updatedAt: Date.now()
      });
    } catch (claimError) {
      try {
        const room = await getDoc(roomReference);
        if (!room.exists()) throw new Error('This tabletop room does not exist.');
        if (room.data()[`${seat}Uid`] !== auth.currentUser!.uid) throw new Error('That seat has already been claimed.');
      } catch (readError) {
        if (readError instanceof Error && readError.message.includes('already been claimed')) throw readError;
        throw new Error('That seat has already been claimed or the tabletop room is unavailable.', {
          cause: claimError
        });
      }
    }
  } else if (!readLocal(roomId).some((event) => event.type === 'game/created')) {
    throw new Error(
      'This deployment has no shared Firebase room. Ask the table to reload after Firebase is configured.'
    );
  }
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await appendEvent({ type: 'player/joined', actor: seat, payload: { seat } }, roomId);
      return;
    } catch (error) {
      const current = replay(await readEvents(roomId)).state;
      if (current.seats[seat].joined) return;
      if (attempt) throw error;
    }
  }
}

export async function canAccessRoom(roomId: string) {
  if (!useFirestore) return readLocal(roomId).length > 0;
  try {
    const { db } = await remoteClient();
    return (await getDoc(doc(db, 'games', roomId))).exists();
  } catch {
    return false;
  }
}
