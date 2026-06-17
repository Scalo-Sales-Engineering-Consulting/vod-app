import type { PlaybackProgress } from './resume';
import { isFinished } from './resume';

// Minimal async key/value contract — satisfied by AsyncStorage in the app and by
// an in-memory map in tests. Injecting it keeps this module free of native deps.
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const keyFor = (movieId: string) => `streamx:playback:${movieId}`;

export interface PlaybackStore {
  save(progress: PlaybackProgress): Promise<void>;
  load(movieId: string): Promise<PlaybackProgress | null>;
  clear(movieId: string): Promise<void>;
}

/**
 * Persistent per-title playback position. Because it is backed by durable
 * storage, the saved position survives the app being killed and is available
 * again on the next launch.
 */
export function createPlaybackStore(storage: KeyValueStore): PlaybackStore {
  return {
    async save(progress) {
      // Don't persist a "finished" position — clear it so the title starts over.
      if (isFinished(progress.position, progress.duration)) {
        await storage.removeItem(keyFor(progress.movieId));
        return;
      }
      await storage.setItem(keyFor(progress.movieId), JSON.stringify(progress));
    },
    async load(movieId) {
      const raw = await storage.getItem(keyFor(movieId));
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw) as PlaybackProgress;
        if (typeof parsed?.position !== 'number') return null;
        return parsed;
      } catch {
        return null;
      }
    },
    async clear(movieId) {
      await storage.removeItem(keyFor(movieId));
    },
  };
}
