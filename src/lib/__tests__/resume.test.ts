import { createPlaybackStore, type KeyValueStore } from '../playbackStore';
import { resumePosition, shouldResume, RESUME_MIN_SECONDS } from '../resume';

/**
 * Durable fake storage. The backing Map lives OUTSIDE the store instance, so
 * dropping the store (createPlaybackStore again) models the app process being
 * killed while the persisted data survives — exactly like AsyncStorage on disk.
 */
function makeDurableStorage() {
  const disk = new Map<string, string>();
  const storage: KeyValueStore = {
    getItem: (k) => Promise.resolve(disk.has(k) ? disk.get(k)! : null),
    setItem: (k, v) => {
      disk.set(k, v);
      return Promise.resolve();
    },
    removeItem: (k) => {
      disk.delete(k);
      return Promise.resolve();
    },
  };
  return { storage, disk };
}

describe('resume video at the same time after the app is killed', () => {
  it('starts the video at the saved position after a kill + relaunch', async () => {
    const { storage } = makeDurableStorage();

    // --- Session 1: user is watching; player reports currentTime = 125s of 888s ---
    const session1 = createPlaybackStore(storage);
    await session1.save({ movieId: 'sintel', position: 125, duration: 888, updatedAt: 1000 });

    // --- App is KILLED: the runtime (and session1 store) is gone. ---
    // --- Session 2: fresh launch reads from the same durable storage. ---
    const session2 = createPlaybackStore(storage);
    const saved = await session2.load('sintel');

    expect(saved).not.toBeNull();
    expect(saved!.position).toBe(125);
    // The player should seek here on mount → resumes at the same time.
    expect(resumePosition(saved)).toBe(125);
    expect(shouldResume(saved)).toBe(true);
  });

  it('keeps a separate position per title', async () => {
    const { storage } = makeDurableStorage();
    const store = createPlaybackStore(storage);
    await store.save({ movieId: 'sintel', position: 125, duration: 888, updatedAt: 1 });
    await store.save({ movieId: 'big-buck-bunny', position: 42, duration: 600, updatedAt: 2 });

    expect(resumePosition(await store.load('sintel'))).toBe(125);
    expect(resumePosition(await store.load('big-buck-bunny'))).toBe(42);
  });

  it('starts from 0 when nothing was saved', async () => {
    const { storage } = makeDurableStorage();
    const store = createPlaybackStore(storage);
    expect(await store.load('unknown')).toBeNull();
    expect(resumePosition(await store.load('unknown'))).toBe(0);
    expect(shouldResume(await store.load('unknown'))).toBe(false);
  });

  it('does not resume a barely-watched title (< min seconds)', async () => {
    const { storage } = makeDurableStorage();
    const store = createPlaybackStore(storage);
    await store.save({ movieId: 'sintel', position: RESUME_MIN_SECONDS - 1, duration: 888, updatedAt: 1 });
    expect(resumePosition(await store.load('sintel'))).toBe(0);
  });

  it('clears progress and starts over once the video is (near) finished', async () => {
    const { storage, disk } = makeDurableStorage();
    const store = createPlaybackStore(storage);
    // Watched to 99% — saving this is treated as "finished".
    await store.save({ movieId: 'sintel', position: 880, duration: 888, updatedAt: 1 });
    expect(disk.size).toBe(0); // nothing persisted
    expect(resumePosition(await store.load('sintel'))).toBe(0);
  });

  it('overwrites the saved position as playback advances', async () => {
    const { storage } = makeDurableStorage();
    const store = createPlaybackStore(storage);
    await store.save({ movieId: 'sintel', position: 30, duration: 888, updatedAt: 1 });
    await store.save({ movieId: 'sintel', position: 210, duration: 888, updatedAt: 2 });
    expect(resumePosition(await store.load('sintel'))).toBe(210);
  });
});
