import { describe, it, expect } from 'vitest';
import { readFirebaseConfig } from './config';

const validEnv = {
  VITE_FIREBASE_API_KEY: 'key',
  VITE_FIREBASE_AUTH_DOMAIN: 'kings.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'kings',
  VITE_FIREBASE_APP_ID: '1:123:web:abc',
};

describe('readFirebaseConfig', () => {
  it('maps env vars to Firebase options', () => {
    const config = readFirebaseConfig(validEnv);
    expect(config.options).toEqual({
      apiKey: 'key',
      authDomain: 'kings.firebaseapp.com',
      projectId: 'kings',
      appId: '1:123:web:abc',
    });
  });

  it('defaults to not using emulators', () => {
    expect(readFirebaseConfig(validEnv).useEmulators).toBe(false);
  });

  it('names every missing variable in the error', () => {
    expect(() =>
      readFirebaseConfig({ VITE_FIREBASE_API_KEY: 'key', VITE_FIREBASE_AUTH_DOMAIN: 'x' })
    ).toThrow('Missing Firebase config: VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID');
  });

  it('treats empty strings as missing', () => {
    expect(() => readFirebaseConfig({ ...validEnv, VITE_FIREBASE_API_KEY: '' })).toThrow(
      'VITE_FIREBASE_API_KEY'
    );
  });

  it('enables emulators in development when the flag is true', () => {
    const config = readFirebaseConfig({ ...validEnv, VITE_FIREBASE_USE_EMULATORS: 'true' });
    expect(config.useEmulators).toBe(true);
  });

  it('refuses to use emulators in a production build', () => {
    expect(() =>
      readFirebaseConfig({ ...validEnv, VITE_FIREBASE_USE_EMULATORS: 'true', PROD: true })
    ).toThrow('must not be set in a production build');
  });
});
