import type { FirebaseOptions } from 'firebase/app';

export interface FirebaseEnv {
  VITE_FIREBASE_API_KEY?: string;
  VITE_FIREBASE_AUTH_DOMAIN?: string;
  VITE_FIREBASE_PROJECT_ID?: string;
  VITE_FIREBASE_APP_ID?: string;
  VITE_FIREBASE_USE_EMULATORS?: string;
  PROD?: boolean;
}

export interface FirebaseConfig {
  options: FirebaseOptions;
  useEmulators: boolean;
}

const REQUIRED_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

/**
 * Build the Firebase web config from Vite env vars. Throws on missing values
 * so a misconfigured build fails loudly instead of talking to no project.
 */
export function readFirebaseConfig(env: FirebaseEnv): FirebaseConfig {
  const missing = REQUIRED_KEYS.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing Firebase config: ${missing.join(', ')}`);
  }

  const useEmulators = env.VITE_FIREBASE_USE_EMULATORS === 'true';
  if (useEmulators && env.PROD) {
    throw new Error('VITE_FIREBASE_USE_EMULATORS must not be set in a production build');
  }

  return {
    options: {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      appId: env.VITE_FIREBASE_APP_ID,
    },
    useEmulators,
  };
}

export interface FirestoreTransportSettings {
  experimentalForceLongPolling: boolean;
  useFetchStreams: boolean;
}

/**
 * Firestore network transport options. Safari 26 applies advanced tracking
 * and fingerprinting protection to all browsing, which broke the streaming
 * WebChannel Listen channel on iPad until the user chose "Reload with Reduced
 * Protections". Forcing long polling over plain XHR requests avoids the
 * streaming path. useFetchStreams is a private SDK setting (not on the public
 * FirestoreSettings type) whose browser default is true, so it is turned off
 * explicitly.
 */
export function firestoreTransportSettings(): FirestoreTransportSettings {
  return { experimentalForceLongPolling: true, useFetchStreams: false };
}
