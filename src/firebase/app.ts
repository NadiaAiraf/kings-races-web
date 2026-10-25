import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { firestoreTransportSettings, readFirebaseConfig } from './config';

// Firebase initialises when this module is first imported (via eventsRepo or
// firebaseAuth). Tests mock those modules so they never load this one.
const config = readFirebaseConfig(import.meta.env);

export const app = initializeApp(config.options);

// Persistent cache keeps events readable and writes queued while offline
// slope-side; Firestore flushes queued writes when connectivity returns.
// If IndexedDB is missing or refused, the SDK itself falls back to an
// in-memory cache with a warning, so no guard is needed here.
// Transport options come from firestoreTransportSettings (Safari privacy
// protections break the streaming channel).
export const db = initializeFirestore(app, {
  ...firestoreTransportSettings(),
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

export const auth = getAuth(app);

if (config.useEmulators) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}
