import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { Image } from 'expo-image'; // SVG-capable poster fallback
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { colors, spacing } from '../theme';
import { useCatalog } from '../context/CatalogContext';
import { putProgress } from '../lib/api';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Player'>;
type Rt = RouteProp<RootStackParamList, 'Player'>;

function durationToSeconds(d: string): number {
  const h = /(\d+)\s*h/.exec(d);
  const m = /(\d+)\s*m/.exec(d);
  const s = /(\d+)\s*s/.exec(d);
  return (h ? +h[1] * 3600 : 0) + (m ? +m[1] * 60 : 0) + (s ? +s[1] : 0);
}

function fmt(sec: number): string {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function PlayerScreen({ navigation, route }: { navigation: Nav; route: Rt }) {
  const { width, height } = useWindowDimensions();
  const { getMovie } = useCatalog();
  // Episodes aren't in the catalog list, so accept a movie passed via params.
  const movie = getMovie(route.params.movieId) ?? route.params.movie;
  const hasTrailer = !!movie?.trailer;

  // Real video player (expo-video). Source may be null for films without a trailer.
  const player = useVideoPlayer(movie?.trailer ?? null, (p) => {
    p.loop = true;
    p.timeUpdateEventInterval = 0.5;
  });

  const [playing, setPlaying] = useState(true);
  const [current, setCurrent] = useState(0);
  const [vidTotal, setVidTotal] = useState(0);
  const [buffering, setBuffering] = useState(true);
  const [controls, setControls] = useState(true);
  const [trackW, setTrackW] = useState(0);

  const total = hasTrailer ? vidTotal : movie ? durationToSeconds(movie.duration) : 0;

  // Autoplay on mount; resume from the saved position if we were handed one.
  useEffect(() => {
    if (hasTrailer) {
      try {
        const resume = route.params.resume;
        if (resume && resume > 1) player.currentTime = resume;
        player.play();
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Report playback position to the backend (Continue Watching), every few
  // seconds and once more on unmount with the latest position.
  useEffect(() => {
    if (!hasTrailer || !movie) return;
    const report = () => {
      try {
        const pos = player.currentTime ?? 0;
        const dur = player.duration || undefined;
        if (pos > 1) putProgress(movie.id, pos, dur).catch(() => {});
      } catch {}
    };
    const id = setInterval(report, 5000);
    return () => {
      clearInterval(id);
      report();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasTrailer, movie?.id]);

  // Clock: poll the real player when there's a trailer; otherwise simulate.
  useEffect(() => {
    if (hasTrailer) {
      const id = setInterval(() => {
        try {
          setCurrent(player.currentTime ?? 0);
          if (player.duration && player.duration !== vidTotal) setVidTotal(player.duration);
          if (player.duration > 0) setBuffering(false);
          setPlaying(player.playing);
        } catch {}
      }, 400);
      return () => clearInterval(id);
    }
    const t = setTimeout(() => setBuffering(false), 1000);
    if (!playing) return () => clearTimeout(t);
    const id = setInterval(() => setCurrent((c) => (c >= total ? total : c + 1)), 1000);
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
  }, [hasTrailer, playing, total, vidTotal, player]);

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bumpControls = () => {
    setControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControls(false), 3500);
  };
  useEffect(() => {
    if (playing && !buffering) bumpControls();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, buffering]);

  if (!movie) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={{ color: colors.text }}>Title not found.</Text>
      </View>
    );
  }

  const progress = total > 0 ? Math.min(1, current / total) : 0;
  const togglePlay = () => {
    if (hasTrailer) {
      try {
        if (player.playing) player.pause();
        else player.play();
      } catch {}
    } else {
      setPlaying((p) => !p);
    }
    bumpControls();
  };
  const skip = (delta: number) => {
    if (hasTrailer) {
      try {
        player.currentTime = Math.min(total || 1e9, Math.max(0, (player.currentTime ?? 0) + delta));
      } catch {}
    } else {
      setCurrent((c) => Math.min(total, Math.max(0, c + delta)));
    }
    bumpControls();
  };
  const seek = (e: GestureResponderEvent) => {
    if (!trackW || !total) return;
    const ratio = Math.min(1, Math.max(0, e.nativeEvent.locationX / trackW));
    const t = ratio * total;
    if (hasTrailer) {
      try {
        player.currentTime = t;
      } catch {}
    }
    setCurrent(t);
    bumpControls();
  };
  const onTrackLayout = (e: LayoutChangeEvent) => setTrackW(e.nativeEvent.layout.width);

  const closePlayer = () => navigation.goBack();

  // The video/poster surface, shared by both layouts.
  const Surface = ({ style }: { style?: any }) =>
    hasTrailer ? (
      <VideoView
        player={player}
        style={[{ flex: 1 }, style]}
        contentFit="cover"
        nativeControls={false}
      />
    ) : (
      <Image source={movie.backdrop} style={[{ flex: 1 }, style]} contentFit="cover" />
    );

  const Scrubber = (
    <>
      <Pressable onPress={seek} style={styles.trackHit}>
        <View style={styles.track} onLayout={onTrackLayout}>
          <View style={[styles.fill, { width: `${progress * 100}%` }]} />
          <View style={[styles.knob, { left: Math.max(0, progress * trackW - 7) }]} />
        </View>
      </Pressable>
      <View style={styles.timeRow}>
        <Text style={styles.time}>{fmt(current)}</Text>
        <Text style={styles.time}>-{fmt(Math.max(0, total - current))}</Text>
      </View>
    </>
  );

  const Transport = (
    <View style={styles.centerRow}>
      <TouchableOpacity hitSlop={12} onPress={() => skip(-10)}>
        <Ionicons name="play-back" size={34} color={colors.text} />
      </TouchableOpacity>
      <TouchableOpacity hitSlop={12} style={styles.playBig} onPress={togglePlay}>
        <Ionicons name={playing ? 'pause' : 'play'} size={40} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity hitSlop={12} onPress={() => skip(10)}>
        <Ionicons name="play-forward" size={34} color={colors.text} />
      </TouchableOpacity>
    </View>
  );

  // Always landscape: render the surface rotated 90° to fill the portrait-locked
  // screen, so the player opens straight into a full-screen horizontal view.
  const lw = height;
  const lh = width;
  const pad = spacing.xl;
  return (
    <View style={styles.fsRoot}>
      <StatusBar hidden />
      <View
        style={[styles.fsBox, { width: lw, height: lh, left: (width - lw) / 2, top: (height - lh) / 2 }]}
      >
        <Pressable style={styles.fsSurface} onPress={() => setControls((c) => !c)}>
          <Surface style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.7)']}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {buffering && (
            <View style={styles.bufferer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
          {controls && !buffering && (
            <>
              <View style={[styles.topBar, { paddingTop: spacing.lg, paddingHorizontal: pad }]}>
                <TouchableOpacity hitSlop={12} onPress={closePlayer}>
                  <Ionicons name="chevron-down" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text numberOfLines={1} style={styles.topTitle}>
                  {movie.title}
                </Text>
                <TouchableOpacity hitSlop={12} onPress={closePlayer}>
                  <Ionicons name="close" size={26} color={colors.text} />
                </TouchableOpacity>
              </View>
              {Transport}
              <View style={[styles.fsBottom, { paddingHorizontal: pad, paddingBottom: spacing.lg }]}>
                {Scrubber}
              </View>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center' },
  fsRoot: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
  fsBox: { position: 'absolute', transform: [{ rotate: '90deg' }], backgroundColor: '#000' },
  fsSurface: { flex: 1, justifyContent: 'center' },
  bufferer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  topTitle: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '700' },
  centerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xxl },
  playBig: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  fsBottom: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  trackHit: { paddingVertical: spacing.sm },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.border, justifyContent: 'center' },
  fill: { height: 4, borderRadius: 2, backgroundColor: colors.primary },
  knob: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: colors.primary },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  time: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
});
