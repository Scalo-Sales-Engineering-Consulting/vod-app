import { playbackNetReducer, initialNetState, type PlaybackNetState, type NetEvent } from '../network';

const run = (events: NetEvent[], start: PlaybackNetState = initialNetState) =>
  events.reduce(playbackNetReducer, start);

describe('playback when internet connection is lost', () => {
  it('pauses and shows offline notice when connection drops mid-playback', () => {
    const s = run([{ type: 'PLAY' }, { type: 'CONNECTION_LOST' }]);
    expect(s.playing).toBe(false);
    expect(s.offlineNotice).toBe(true);
    expect(s.resumeOnReconnect).toBe(true); // remember to resume
  });

  it('auto-resumes after the connection is restored', () => {
    const s = run([{ type: 'PLAY' }, { type: 'CONNECTION_LOST' }, { type: 'CONNECTION_RESTORED' }]);
    expect(s.online).toBe(true);
    expect(s.offlineNotice).toBe(false);
    expect(s.playing).toBe(true); // back where it was
    expect(s.resumeOnReconnect).toBe(false);
  });

  it('does NOT auto-resume if it was paused when connection dropped', () => {
    const s = run([{ type: 'CONNECTION_LOST' }, { type: 'CONNECTION_RESTORED' }]);
    expect(s.playing).toBe(false);
    expect(s.offlineNotice).toBe(false);
  });

  it('blocks PLAY while offline and surfaces the notice', () => {
    const s = run([{ type: 'CONNECTION_LOST' }, { type: 'PLAY' }]);
    expect(s.playing).toBe(false);
    expect(s.offlineNotice).toBe(true);
  });

  it('manual pause while offline cancels the pending auto-resume', () => {
    const s = run([{ type: 'PLAY' }, { type: 'CONNECTION_LOST' }, { type: 'PAUSE' }, { type: 'CONNECTION_RESTORED' }]);
    expect(s.playing).toBe(false); // user chose pause → stay paused
    expect(s.resumeOnReconnect).toBe(false);
  });

  it('survives flapping connection (lost → restored → lost)', () => {
    const s = run([
      { type: 'PLAY' },
      { type: 'CONNECTION_LOST' },
      { type: 'CONNECTION_RESTORED' },
      { type: 'CONNECTION_LOST' },
    ]);
    expect(s.online).toBe(false);
    expect(s.playing).toBe(false);
    expect(s.offlineNotice).toBe(true);
    expect(s.resumeOnReconnect).toBe(true);
  });
});
