import { describe, it, expect } from 'vitest';
import { FirebaseError } from 'firebase/app';
import { isPermissionDenied, withErrorCode } from './firebaseErrors';

describe('withErrorCode', () => {
  it('appends the Firebase error code', () => {
    const error = new FirebaseError('resource-exhausted', 'Quota exceeded.');
    expect(withErrorCode('Live updates stopped.', error)).toBe(
      'Live updates stopped. (resource-exhausted)'
    );
  });

  it('leaves the message alone for other errors', () => {
    expect(withErrorCode('Live updates stopped.', new Error('x'))).toBe('Live updates stopped.');
  });
});

describe('isPermissionDenied', () => {
  it('recognises permission-denied', () => {
    expect(isPermissionDenied(new FirebaseError('permission-denied', 'no'))).toBe(true);
  });

  it('is false for other codes', () => {
    expect(isPermissionDenied(new FirebaseError('unavailable', 'offline'))).toBe(false);
  });
});
