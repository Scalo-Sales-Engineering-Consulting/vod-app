import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, spacing, typography } from '../theme';
import { useCatalog } from '../context/CatalogContext';
import HeroCarousel, { type HeroItem } from '../components/HeroCarousel';
import MovieRow from '../components/MovieRow';
import MovieCard from '../components/MovieCard';
import type { Movie } from '../data/movies';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const SEARCH_COLS = 3;
const PAD = spacing.lg;
const GAP = spacing.md;

export const toHero = (m: Movie): HeroItem => ({
  id: m.id,
  title: m.title,
  image: m.backdrop || m.poster,
  meta: `${m.maturity} · ${m.year || '—'} · ${m.genres[0] ?? 'Movie'}`,
  badge: 'New',
});

export default function HomeScreen({ navigation }: { navigation: Nav }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { movies, continueWatching, top10, becauseYouWatched, categories, source, refresh } = useCatalog();

  const [refreshing, setRefreshing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const openDetail = (id: string) => navigation.navigate('Detail', { movieId: id });
  const heroItems = useMemo(() => (top10.length ? top10 : movies).slice(0, 10).map(toHero), [top10, movies]);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  const onRefresh = useCallback(async () => { setRefreshing(true); await refresh(); setRefreshing(false); }, [refresh]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return movies.filter((m) => m.title.toLowerCase().includes(q) || m.genres.some((g) => g.toLowerCase().includes(q)));
  }, [query, movies]);
  const closeSearch = () => { setSearchOpen(false); setQuery(''); };

  if (source === 'loading') {
    return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Text style={styles.pageTitle}>For You</Text>
          <TouchableOpacity hitSlop={12} onPress={() => setSearchOpen(true)} accessibilityRole="button" accessibilityLabel="Search">
            <Ionicons name="search" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <HeroCarousel items={heroItems} onPress={openDetail} paused={searchOpen} />

        <View style={{ marginTop: spacing.lg }}>
          {continueWatching.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Continue Watching</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
                {continueWatching.map((c) => (
                  <TouchableOpacity key={c.movie.id} activeOpacity={0.85} style={styles.cwCard}
                    accessibilityRole="button" accessibilityLabel={`Resume ${c.movie.title}`}
                    onPress={() => navigation.navigate('Player', { movieId: c.movie.id, resume: c.positionSeconds })}>
                    <Image source={c.movie.poster} style={styles.cwPoster} contentFit="cover" />
                    <View style={styles.cwPlay}><Ionicons name="play-circle" size={34} color="rgba(255,255,255,0.92)" /></View>
                    <View style={styles.cwBar}><View style={[styles.cwFill, { width: `${Math.round(c.percent * 100)}%` }]} /></View>
                    <Text numberOfLines={1} style={styles.cwName}>{c.movie.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {categories.map((row) => (
            <MovieRow key={'cat:' + row.title} title={row.title} movies={row.movies} onPressMovie={openDetail} />
          ))}

          {becauseYouWatched && (
            <MovieRow title={becauseYouWatched.title} movies={becauseYouWatched.movies} onPressMovie={openDetail} />
          )}

          {top10.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top 10 Today</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topScroll}>
                {top10.map((m, i) => (
                  <TouchableOpacity key={m.id} activeOpacity={0.85} style={styles.topItem} onPress={() => openDetail(m.id)}
                    accessibilityRole="button" accessibilityLabel={`Number ${i + 1}, ${m.title}`}>
                    <Text style={styles.topRank}>{i + 1}</Text>
                    <Image source={m.poster} style={styles.topPoster} contentFit="cover" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {searchOpen && (
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill}>
          <LinearGradient colors={['rgba(11,11,15,0.55)', 'rgba(11,11,15,0.35)', 'rgba(11,11,15,0.85)']} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <View style={{ flex: 1, paddingTop: insets.top + spacing.sm }}>
            <View style={styles.searchBar}>
              <TouchableOpacity hitSlop={10} onPress={closeSearch} accessibilityRole="button" accessibilityLabel="Close search"><Ionicons name="chevron-back" size={26} color={colors.text} /></TouchableOpacity>
              <BlurView intensity={40} tint="light" style={styles.searchInputWrap}>
                <Ionicons name="search" size={18} color={colors.text} />
                <TextInput style={styles.searchInput} placeholder="Search movies…" placeholderTextColor={colors.textMuted}
                  value={query} onChangeText={setQuery} autoFocus returnKeyType="search" clearButtonMode="while-editing" />
              </BlurView>
            </View>
            {query.trim().length === 0 ? (
              <View style={styles.searchHint}><Ionicons name="search" size={44} color={colors.text} /><Text style={styles.searchHintText}>Type a title or genre</Text></View>
            ) : results.length === 0 ? (
              <View style={styles.searchHint}><Ionicons name="sad-outline" size={44} color={colors.text} /><Text style={styles.searchHintText}>No results for “{query.trim()}”</Text></View>
            ) : (
              <FlatList data={results} key={SEARCH_COLS} numColumns={SEARCH_COLS} keyExtractor={(m) => m.id}
                keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} columnWrapperStyle={{ gap: GAP }}
                contentContainerStyle={{ padding: PAD, paddingBottom: spacing.xxl, gap: spacing.lg }}
                renderItem={({ item }) => {
                  const w = (width - PAD * 2 - GAP * (SEARCH_COLS - 1)) / SEARCH_COLS;
                  return <MovieCard movie={item} width={w} showMeta onPress={() => openDetail(item.id)} />;
                }} />
            )}
          </View>
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  pageTitle: { color: colors.text, ...typography.display },
  section: { marginTop: spacing.xl },
  sectionTitle: { color: colors.text, ...typography.title, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  hScroll: { paddingHorizontal: spacing.lg, gap: spacing.md },
  cwCard: { width: 150 },
  cwPoster: { width: 150, height: 90, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  cwPlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 90, alignItems: 'center', justifyContent: 'center' },
  cwBar: { height: 3, backgroundColor: colors.border, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  cwFill: { height: 3, backgroundColor: colors.primary },
  cwName: { color: colors.textMuted, ...typography.caption, fontWeight: '600', marginTop: 5 },
  topScroll: { paddingHorizontal: spacing.lg, gap: spacing.lg, alignItems: 'flex-end' },
  topItem: { flexDirection: 'row', alignItems: 'flex-end' },
  topRank: { color: colors.surfaceAlt, fontSize: 92, fontWeight: '900', lineHeight: 92, marginRight: -18, textShadowColor: colors.border, textShadowRadius: 1 },
  topPoster: { width: 92, height: 138, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  searchInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  searchInput: { flex: 1, color: colors.text, fontSize: 15, padding: 0 },
  searchHint: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  searchHintText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
});
