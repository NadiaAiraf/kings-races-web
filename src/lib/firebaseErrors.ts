import { FirebaseError } from 'firebase/app';

/**
 * Append the Firebase error code to a message, e.g. "(resource-exhausted)".
 * On the day nobody reads the console on a phone, so the code on screen is
 * what tells an official whether it is a quota, permission or network issue.
 */
export function withErrorCode(message: string, error: unknown): string {
  return error instanceof FirebaseError ? `${message} (${error.code})` : message;
}

export function isPermissionDenied(error: unknown): boolean {
  return error instanceof FirebaseError && error.code === 'permission-denied';
}
