// Thin persistence adapter. The backend is injectable so tests never touch real storage.
import { serialise, deserialise } from './tasks.js';

export const STORAGE_KEY = 'tasklet:v1';

// Accessing `localStorage` can itself throw (e.g. blocked third-party storage), so guard it.
function defaultBackend() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * @param {{ getItem(k: string): string | null, setItem(k: string, v: string): void } | null} [backend]
 */
export function createStore(backend = defaultBackend()) {
  return {
    /** @returns {import('./tasks.js').Task[]} */
    load() {
      if (!backend) return [];
      try {
        return deserialise(backend.getItem(STORAGE_KEY));
      } catch {
        return [];
      }
    },
    /** @returns {boolean} true when the write succeeded */
    save(tasks) {
      if (!backend) return false;
      try {
        backend.setItem(STORAGE_KEY, serialise(tasks));
        return true;
      } catch {
        return false; // quota exceeded or storage disabled
      }
    },
  };
}
