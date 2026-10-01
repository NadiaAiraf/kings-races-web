/**
 * Whether this browser can persist data in IndexedDB. Firestore's persistent
 * cache silently falls back to memory without it (e.g. some private modes),
 * which loses unsynced results if the page reloads.
 */
export function canStoreOffline(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(false);
      const request = indexedDB.open('kings-races-storage-check');
      request.onsuccess = () => {
        request.result.close();
        resolve(true);
      };
      request.onerror = () => resolve(false);
      // Blocked means another tab holds the database open, so it works.
      request.onblocked = () => resolve(true);
    } catch {
      resolve(false);
    }
  });
}
