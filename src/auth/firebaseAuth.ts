import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/app';
import type { AuthDeps } from './authStatus';

export const firebaseAuthDeps: AuthDeps = {
  onUserChanged: (onUser) =>
    onAuthStateChanged(auth, (user) =>
      onUser(user ? { uid: user.uid, email: user.email } : null)
    ),
  watchApproval: (uid, onApproved, onError) =>
    onSnapshot(doc(db, 'approvedUsers', uid), (snap) => onApproved(snap.exists()), onError),
};

export async function signInWithEmail(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export function signOutUser(): Promise<void> {
  return signOut(auth);
}
