import React, { useEffect, useState } from 'react';
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
import { colors, radius, spacing } from '../theme';
import { fetchSeriesDetail, type SeriesDetail } from '../lib/api';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'SeriesDetail'>;
type Rt = RouteProp<RootStackParamList, 'SeriesDetail'>;

export default function SeriesDetailScreen({ navigation, route }: { navigation: Nav; route: Rt }) {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<SeriesDetail | null>(null);
  const [season, setSeason] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeriesDetail(route.params.seriesId)
      .then((d) => {
        setData(d);
        setSeason(d.seasons[0]?.number ?? 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [route.params.seriesId]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (!data) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: colors.text }}>Series not found.</Text>
      </View>
    );
  }

  const current = data.seasons.find((s) => s.number === season) ?? data.seasons[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Image source={data.poster} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient
          colors={['rgba(11,11,15,0.3)', 'rgba(11,11,15,0.6)', colors.background]}
          style={StyleSheet.absoluteFill}
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

        <View style={styles.episodes}>
          {current?.episodes.map((ep) => (
            <TouchableOpacity
              key={ep.id}
              style={styles.epRow}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Player', { movieId: ep.id, movie: ep })}
            >
              <View style={styles.epThumbWrap}>
                <Image source={ep.poster || ep.backdrop} style={styles.epThumb} contentFit="cover" />
                <View style={styles.epPlay}>
                  <Ionicons name="play-circle" size={28} color="rgba(255,255,255,0.92)" />
                </View>
              </View>
              <View style={styles.epBody}>
                <Text style={styles.epTitle} numberOfLines={1}>
                  {ep.episodeNumber}. {ep.episodeTitle || ep.title}
                </Text>
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
  center: { alignItems: 'center', justifyContent: 'center' },
  hero: { height: 300 },
  back: { position: 'absolute', left: spacing.lg, width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: spacing.lg, marginTop: -30 },
  title: { color: colors.text, fontSize: 26, fontWeight: '900' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  meta: { color: colors.textMuted, fontSize: 14 },
  maturity: { borderWidth: 1, borderColor: colors.textFaint, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  maturityText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  desc: { color: colors.text, fontSize: 14, lineHeight: 21, marginTop: spacing.md, opacity: 0.9 },
  seasons: { gap: spacing.sm, marginTop: spacing.lg },
  seasonChip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  seasonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  seasonText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  seasonTextActive: { color: colors.onPrimary, fontWeight: '700' },
  episodes: { marginTop: spacing.lg, gap: spacing.md },
  epRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  epThumbWrap: { width: 120, height: 68 },
  epThumb: { width: 120, height: 68, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  epPlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  epBody: { flex: 1, gap: 3 },
  epTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  epMeta: { color: colors.textMuted, fontSize: 12 },
});
