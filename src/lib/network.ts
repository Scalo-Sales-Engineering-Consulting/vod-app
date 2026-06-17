// Pure playback-under-connectivity state machine. No RN/native imports → unit-testable.
// Drives: pause on connection loss, show offline notice, auto-resume on reconnect
// (only if it was playing when the connection dropped).

export interface PlaybackNetState {
  online: boolean;
  playing: boolean;
  /** Show the "No internet connection" notice. */
  offlineNotice: boolean;
  /** Remember to auto-resume once the connection comes back. */
  resumeOnReconnect: boolean;
}

export type NetEvent =
  | { type: 'CONNECTION_LOST' }
  | { type: 'CONNECTION_RESTORED' }
  | { type: 'PLAY' }
  | { type: 'PAUSE' };

export const initialNetState: PlaybackNetState = {
  online: true,
  playing: false,
  offlineNotice: false,
  resumeOnReconnect: false,
};

export function playbackNetReducer(state: PlaybackNetState, event: NetEvent): PlaybackNetState {
  switch (event.type) {
    case 'CONNECTION_LOST':
      return {
        ...state,
        online: false,
        offlineNotice: true,
        // If we were playing, pause now and mark for auto-resume.
        resumeOnReconnect: state.resumeOnReconnect || state.playing,
        playing: false,
      };
    case 'CONNECTION_RESTORED':
      return {
        ...state,
        online: true,
        offlineNotice: false,
        playing: state.resumeOnReconnect ? true : state.playing,
        resumeOnReconnect: false,
      };
    case 'PLAY':
      // Can't start playback while offline — surface the notice instead.
      return state.online
        ? { ...state, playing: true }
        : { ...state, offlineNotice: true };
    case 'PAUSE':
      // Manual pause clears any pending auto-resume.
      return { ...state, playing: false, resumeOnReconnect: false };
    default:
      return state;
  }
}
