// Pure, framework-free playback-resume logic.
// No React Native / native imports here on purpose, so it is trivially unit-testable.

export interface PlaybackProgress {
  movieId: string;
  /** Last known playback position, in seconds. */
  position: number;
  /** Total duration in seconds (0 when unknown). */
  duration: number;
  /** When this was recorded (epoch ms). */
  updatedAt: number;
}

/** Ignore tiny amounts of watching — starting over feels better than a 2s resume. */
export const RESUME_MIN_SECONDS = 5;
/** If the viewer was within the last 5% of the video, treat it as finished and start over. */
export const RESUME_END_THRESHOLD = 0.95;

/**
 * Given the persisted progress (or null), decide the position playback should
 * start at. This is the heart of "after the app is killed, resume where I was".
 */
export function resumePosition(saved: PlaybackProgress | null | undefined): number {
  if (!saved) return 0;
  const { position, duration } = saved;
  if (!Number.isFinite(position) || position < RESUME_MIN_SECONDS) return 0;
  if (duration > 0 && position >= duration * RESUME_END_THRESHOLD) return 0;
  return position;
}

/** Whether we have a meaningful position to resume from. */
export function shouldResume(saved: PlaybackProgress | null | undefined): boolean {
  return resumePosition(saved) > 0;
}

/** Should a near-finished video's saved progress be cleared? */
export function isFinished(position: number, duration: number): boolean {
  return duration > 0 && position >= duration * RESUME_END_THRESHOLD;
}
