import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import type { GameEvent } from '$lib/game/model';
import { GAME_CONFIG, replay } from '$lib/game/reducer';
import type { Seat } from '$lib/manifests/teaching-duel';
import { FirebaseError, getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  type Firestore
} from 'firebase/firestore';

export const ROOM_ID = 'FLIGHT7';
const tableRoomKey = 'xwing:table-room';
const useEmulator = env.PUBLIC_FIREBASE_EMULATOR === 'true';
type EventInput = GameEvent extends infer Event
  ? Event extends GameEvent
    ? Omit<Event, 'id' | 'sequence'>
    : never
  : never;

function requiredFirebaseOptions(): FirebaseOptions {
  if (useEmulator)
    return {
      apiKey: 'demo-xwing-key',
      authDomain: 'demo-xwing.firebaseapp.com',
      projectId: 'demo-xwing'
    };
  const options = {
    apiKey: env.PUBLIC_FIREBASE_API_KEY,
    authDomain: env.PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.PUBLIC_FIREBASE_PROJECT_ID
  };
  const missing = Object.entries(options)
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length)
    throw new Error(
      `Firebase configuration is required. Missing ${missing.join(', ')}; use production configuration or PUBLIC_FIREBASE_EMULATOR=true.`
    );
  return options as FirebaseOptions;
}

const firebaseOptions = browser ? requiredFirebaseOptions() : undefined;

export function tableRoomId(): string {
  if (!browser) return ROOM_ID;
  const existing = sessionStorage.getItem(tableRoomKey);
  if (existing) return existing;
  const roomId = useEmulator ? ROOM_ID : `FLIGHT-${crypto.randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}`;
  sessionStorage.setItem(tableRoomKey, roomId);
  return roomId;
}

let remote: Promise<{ auth: Auth; db: Firestore }> | undefined;
function remoteClient() {
  remote ??= (async () => {
    const app = getApps().length ? getApp() : initializeApp(firebaseOptions!);
    const auth = getAuth(app);
    const db = getFirestore(app);
    if (useEmulator) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
    }
    if (!auth.currentUser) await signInAnonymously(auth);
    return { auth, db };
  })();
  return remote;
}

async function readRemote(roomId: string) {
  const { db } = await remoteClient();
  const snapshot = await getDocs(query(collection(db, 'games', roomId, 'events'), orderBy('sequence')));
  return snapshot.docs.map((entry) => entry.data() as GameEvent);
}

export async function readEvents(roomId = ROOM_ID): Promise<GameEvent[]> {
  return readRemote(roomId);
}

export async function appendEvent(event: EventInput, roomId = ROOM_ID): Promise<GameEvent> {
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
  return complete;
}

export function subscribeToRoom(
  roomId: string,
  listener: (events: GameEvent[]) => void,
  onError: (error: Error) => void
) {
  let stopped = false;
  let unsubscribe = () => {};
  void remoteClient().then(({ db }) => {
    if (stopped) return;
    unsubscribe = onSnapshot(
      query(collection(db, 'games', roomId, 'events'), orderBy('sequence')),
      (snapshot) => listener(snapshot.docs.map((entry) => entry.data() as GameEvent)),
      onError
    );
  }, onError);
  return () => {
    stopped = true;
    unsubscribe();
  };
}

export async function createRoom(roomId = ROOM_ID): Promise<void> {
  if (!browser) return;
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
      if (readError instanceof FirebaseError && readError.code === 'permission-denied')
        throw new Error('That seat has already been claimed.', { cause: claimError });
      throw readError;
    }
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
  try {
    const { db } = await remoteClient();
    return (await getDoc(doc(db, 'games', roomId))).exists();
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'permission-denied') return false;
    throw error;
  }
}
