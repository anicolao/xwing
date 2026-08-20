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
  getDocs,
  initializeFirestore,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  writeBatch,
  type Firestore
} from 'firebase/firestore';

const key = (roomId: string) => `xwing:room:${roomId}:events`;
const channel = (roomId: string) => `xwing:room:${roomId}:changed`;
const useFirestore = browser && (env.PUBLIC_FIREBASE_EMULATOR === 'true' || Boolean(env.PUBLIC_FIREBASE_API_KEY));

export const ROOM_ID = 'FLIGHT7';
export const pairingCode: Record<Seat, string> = { rebel: 'RED-5', imperial: 'ONYX-2' };
export interface PairingCredential {
  code: string;
  token: string;
}
export type PairingCredentials = Record<Seat, PairingCredential>;
type EventInput = GameEvent extends infer Event
  ? Event extends GameEvent
    ? Omit<Event, 'id' | 'sequence'>
    : never
  : never;

function readLocal(roomId = ROOM_ID): GameEvent[] {
  if (!browser) return [];
  try {
    return JSON.parse(localStorage.getItem(key(roomId)) ?? '[]') as GameEvent[];
  } catch {
    return [];
  }
}

let remote: Promise<{ auth: Auth; db: Firestore }> | undefined;
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
    if (env.PUBLIC_FIREBASE_EMULATOR === 'true') {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
    }
    if (!auth.currentUser) await signInAnonymously(auth);
    return { auth, db };
  })();
  return remote;
}

function createPairingCredentials(): PairingCredentials {
  const token = (seat: Seat) =>
    env.PUBLIC_FIREBASE_EMULATOR === 'true'
      ? `e2e-${seat}-claim-capability`
      : `${seat}-${crypto.randomUUID()}-${crypto.randomUUID()}`;
  return {
    rebel: { code: pairingCode.rebel, token: token('rebel') },
    imperial: { code: pairingCode.imperial, token: token('imperial') }
  };
}

async function readRemote(roomId: string) {
  const { db } = await remoteClient();
  const snapshot = await getDocs(query(collection(db, 'games', roomId, 'events'), orderBy('sequence')));
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
    transaction.set(doc(db, 'games', roomId, 'events', String(complete.sequence).padStart(8, '0')), serialized);
    transaction.update(roomReference, { revision: complete.sequence, updatedAt: Date.now() });
  });
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
  void remoteClient().then(({ db }) => {
    if (stopped) return;
    unsubscribe = onSnapshot(
      query(collection(db, 'games', roomId, 'events'), orderBy('sequence')),
      (snapshot) => listener(snapshot.docs.map((entry) => entry.data() as GameEvent)),
      () => listener([])
    );
  });
  return () => {
    stopped = true;
    unsubscribe();
  };
}

export async function createRoom(roomId = ROOM_ID): Promise<PairingCredentials> {
  const credentials = createPairingCredentials();
  if (!browser) return credentials;
  if (!useFirestore) {
    localStorage.removeItem(key(roomId));
    await appendEvent(
      { type: 'game/created', actor: 'table', payload: { gameId: roomId, seed: 0x5857494e, config: GAME_CONFIG } },
      roomId
    );
    return credentials;
  }
  const { auth, db } = await remoteClient();
  await setDoc(doc(db, 'games', roomId), {
    revision: 0,
    tableUid: auth.currentUser!.uid,
    rebelUid: null,
    imperialUid: null,
    pairingEpoch: 1,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  const claims = writeBatch(db);
  for (const seat of ['rebel', 'imperial'] as const) {
    claims.set(doc(db, 'games', roomId, 'claims', credentials[seat].token), {
      seat,
      code: credentials[seat].code,
      expiresAt: Date.now() + 10 * 60 * 1_000,
      used: false
    });
  }
  await claims.commit();
  await appendEvent(
    { type: 'game/created', actor: 'table', payload: { gameId: roomId, seed: 0x5857494e, config: GAME_CONFIG } },
    roomId
  );
  return credentials;
}

export async function claimSeat(roomId: string, seat: Seat, code: string, token: string) {
  if (code.toUpperCase() !== pairingCode[seat]) throw new Error('Pairing code does not match this seat.');
  if (useFirestore) {
    const { auth, db } = await remoteClient();
    const claim = doc(db, 'games', roomId, 'claims', token);
    const room = doc(db, 'games', roomId);
    const enrollment = writeBatch(db);
    enrollment.update(room, {
      [`${seat}Uid`]: auth.currentUser!.uid,
      lastClaimToken: token,
      updatedAt: Date.now()
    });
    enrollment.update(claim, { used: true, claimedBy: auth.currentUser!.uid });
    await enrollment.commit();
  }
  await appendEvent({ type: 'player/joined', actor: seat, payload: { seat } }, roomId);
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
