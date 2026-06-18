import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { colors, radius, spacing, withAlpha } from '../theme';
import { fetchSeriesDetail, type SeriesDetail } from '../lib/api';
import type { Movie } from '../data/movies';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'SeriesDetail'>;
type Rt = RouteProp<RootStackParamList, 'SeriesDetail'>;
type State = { status: 'loading' | 'ok' | 'error'; data?: SeriesDetail };

export default function SeriesDetailScreen({ navigation, route }: { navigation: Nav; route: Rt }) {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [season, setSeason] = useState(1);

  const load = useCallback(() => {
    let alive = true;
    setState({ status: 'loading' });
    fetchSeriesDetail(route.params.seriesId)
      .then((d) => { if (alive) { setState({ status: 'ok', data: d }); setSeason(d.seasons[0]?.number ?? 1); } })
      .catch(() => { if (alive) setState({ status: 'error' }); });
    return () => { alive = false; };
  }, [route.params.seriesId]);

  useEffect(load, [load]);

  if (state.status === 'loading') {
    return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }
  if (state.status === 'error' || !state.data) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.textFaint} />
        <Text style={styles.errText}>Couldn’t load this series.</Text>
        <TouchableOpacity style={styles.retry} onPress={load}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backLink}>Go back</Text></TouchableOpacity>
      </View>
    );
  }

  const data = state.data;
  const focusPos = `${Math.round((data.posterFocusY ?? 0.3) * 100)}%`;
  const current = data.seasons.find((s) => s.number === season) ?? data.seasons[0];
  const firstEp = current?.episodes[0];

  // Episodes have no own artwork — fall back to the series poster.
  const epImage = (ep: Movie) => ep.poster || data.poster;
  const playEp = (ep: Movie) =>
    navigation.navigate('Player', { movieId: ep.id, movie: { ...ep, backdrop: ep.backdrop || data.poster } });

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        {/* Full-bleed poster under the status bar; dark top gradient fades over
            the island area into the poster — no solid bar, no hard edge. */}
        <Image source={data.poster} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition={{ top: focusPos }} transition={150} />
        <LinearGradient
          colors={[withAlpha(colors.background, 0.85), withAlpha(colors.background, 0.4), 'transparent']}
          locations={[0, 0.5, 1]}
          style={[styles.heroTopFade, { height: insets.top + 80 }]}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['transparent', withAlpha(colors.background, 0.15), withAlpha(colors.background, 0.45), colors.background]}
          locations={[0, 0.62, 0.86, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <TouchableOpacity style={[styles.back, { top: insets.top + spacing.sm }]} onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{data.title}</Text>
        <View style={styles.metaRow}>
          {data.year > 0 && <Text style={styles.meta}>{data.year}</Text>}
          <View style={styles.maturity}><Text style={styles.maturityText}>{data.maturity}</Text></View>
          <Text style={styles.meta}>{data.episodeCount} episodes</Text>
        </View>

        {firstEp && (
          <TouchableOpacity style={styles.playBtn} activeOpacity={0.85} onPress={() => playEp(firstEp)}>
            <Ionicons name="play" size={20} color="#000" />
            <Text style={styles.playText}>Play S{current?.number ?? 1} E{firstEp.episodeNumber ?? 1}</Text>
          </TouchableOpacity>
        )}

        {!!data.description && <Text style={styles.desc}>{data.description}</Text>}

        {data.seasons.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seasons}>
            {data.seasons.map((s) => {
              const active = s.number === season;
              return (
                <TouchableOpacity key={s.number} onPress={() => setSeason(s.number)} style={[styles.seasonChip, active && styles.seasonActive]}>
                  <Text style={[styles.seasonText, active && styles.seasonTextActive]}>Season {s.number}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <Text style={styles.epsHeader}>Episodes</Text>
        <View style={styles.episodes}>
          {current?.episodes.map((ep) => (
            <TouchableOpacity key={ep.id} style={styles.epRow} activeOpacity={0.85} onPress={() => playEp(ep)}>
              <View style={styles.epThumbWrap}>
                <Image source={epImage(ep)} style={styles.epThumb} contentFit="cover" transition={120} />
                <View style={styles.epPlay}><Ionicons name="play-circle" size={28} color="rgba(255,255,255,0.92)" /></View>
              </View>
              <View style={styles.epBody}>
                <Text style={styles.epTitle} numberOfLines={1}>{ep.episodeNumber}. {ep.episodeTitle || ep.title}</Text>
                <Text style={styles.epMeta}>{ep.duration}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  errText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  retry: { marginTop: spacing.sm, backgroundColor: colors.surfaceAlt, paddingVertical: spacing.sm, paddingHorizontal: spacing.xl, borderRadius: radius.pill },
  retryText: { color: colors.text, fontWeight: '700' },
  backLink: { color: colors.textMuted, marginTop: spacing.md },
  hero: { height: 590, backgroundColor: colors.background },
  heroTopFade: { position: 'absolute', top: 0, left: 0, right: 0 },
  back: { position: 'absolute', left: spacing.lg, width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: spacing.lg, marginTop: -30 },
  title: { color: colors.text, fontSize: 26, fontWeight: '900' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  meta: { color: colors.textMuted, fontSize: 14 },
  maturity: { borderWidth: 1, borderColor: colors.textFaint, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  maturityText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  playBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.text, paddingVertical: spacing.md, borderRadius: radius.sm, marginTop: spacing.lg },
  playText: { color: '#000', fontSize: 16, fontWeight: '800' },
  desc: { color: colors.text, fontSize: 14, lineHeight: 21, marginTop: spacing.lg, opacity: 0.9 },
  seasons: { gap: spacing.sm, marginTop: spacing.lg },
  seasonChip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  seasonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  seasonText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  seasonTextActive: { color: colors.onPrimary, fontWeight: '700' },
  epsHeader: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: spacing.xl, marginBottom: spacing.md },
  episodes: { gap: spacing.md },
  epRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  epThumbWrap: { width: 120, height: 68 },
  epThumb: { width: 120, height: 68, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  epPlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  epBody: { flex: 1, gap: 3 },
  epTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  epMeta: { color: colors.textMuted, fontSize: 12 },
});
