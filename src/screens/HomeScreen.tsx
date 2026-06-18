import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
import { colors, radius, spacing } from '../theme';
import { useCatalog } from '../context/CatalogContext';
import MovieRow from '../components/MovieRow';
import MovieCard from '../components/MovieCard';
import type { Movie } from '../data/movies';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Tab = 'movies' | 'series';
const SEARCH_COLS = 3;
const GRID_COLS = 3;
const PAD = spacing.lg;
const GAP = spacing.md;

export default function HomeScreen({ navigation }: { navigation: Nav }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const {
    rows, movies, continueWatching, top10, becauseYouWatched, categories, series, source, refresh,
  } = useCatalog();

  const [tab, setTab] = useState<Tab>('movies');
  const [refreshing, setRefreshing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [heroIndex, setHeroIndex] = useState(0);
  const heroRef = useRef<ScrollView>(null);

  const openDetail = (movieId: string) => navigation.navigate('Detail', { movieId });

  // Hero = up to 10 recommended (Top 10, fallback to catalog).
  const heroItems = useMemo<Movie[]>(
    () => (top10.length ? top10 : movies).slice(0, 10),
    [top10, movies],
  );

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Auto-advance the hero carousel.
  useEffect(() => {
    if (tab !== 'movies' || heroItems.length < 2 || searchOpen) return;
    const id = setInterval(() => {
      setHeroIndex((i) => {
        const next = (i + 1) % heroItems.length;
        heroRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 5000);
    return () => clearInterval(id);
  }, [tab, heroItems.length, searchOpen, width]);

  const onHeroScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setHeroIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return movies.filter(
      (m) => m.title.toLowerCase().includes(q) || m.genres.some((g) => g.toLowerCase().includes(q)),
    );
  }, [query, movies]);
  const closeSearch = () => { setSearchOpen(false); setQuery(''); };

  if (source === 'loading') {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ---- top bar: brand + search + Filmy/Seriale pills ----
  const TopBar = (
    <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.brandRow}>
        <Text style={styles.brand}>STREAM<Text style={{ color: colors.primary }}>X</Text></Text>
        <TouchableOpacity hitSlop={10} onPress={() => setSearchOpen(true)}>
          <Ionicons name="search" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.pills}>
        {(['movies', 'series'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.pill, tab === t && styles.pillActive]}
            activeOpacity={0.85}
          >
            <Text style={[styles.pillText, tab === t && styles.pillTextActive]}>
              {t === 'movies' ? 'Filmy' : 'Seriale'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const heroH = Math.min(540, width * 1.35);

  return (
    <View style={styles.container}>
      {tab === 'movies' ? (
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingTop: 0, paddingBottom: spacing.xxl }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {/* HERO CAROUSEL */}
          {heroItems.length > 0 && (
            <View style={{ height: heroH }}>
              <ScrollView
                ref={heroRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onHeroScroll}
              >
                {heroItems.map((m) => (
                  <View key={m.id} style={{ width, height: heroH }}>
                    <Image source={m.backdrop} style={StyleSheet.absoluteFill} contentFit="cover" />
                    <LinearGradient
                      colors={['rgba(11,11,15,0.15)', 'rgba(11,11,15,0.5)', colors.background]}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.heroContent}>
                      <Text style={styles.heroTitle} numberOfLines={2}>{m.title}</Text>
                      <View style={styles.heroTags}>
                        {m.genres.slice(0, 3).map((g) => (
                          <Text key={g} style={styles.heroTag}>{g}</Text>
                        ))}
                      </View>
                      <View style={styles.heroBtns}>
                        <TouchableOpacity style={styles.playBtn} activeOpacity={0.85}
                          onPress={() => navigation.navigate('Player', { movieId: m.id })}>
                          <Ionicons name="play" size={18} color="#000" />
                          <Text style={styles.playText}>Odtwórz</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.infoBtn} activeOpacity={0.85} onPress={() => openDetail(m.id)}>
                          <Ionicons name="information-circle-outline" size={18} color={colors.text} />
                          <Text style={styles.infoText}>Info</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
              {/* pagination dots */}
              <View style={styles.dots}>
                {heroItems.map((_, i) => (
                  <View key={i} style={[styles.dot, i === heroIndex && styles.dotActive]} />
                ))}
              </View>
            </View>
          )}

          <View style={styles.rows}>
            {continueWatching.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Kontynuuj oglądanie</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
                  {continueWatching.map((c) => (
                    <TouchableOpacity key={c.movie.id} activeOpacity={0.85} style={styles.cwCard}
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

            {/* Curated categories */}
            {categories.map((row) => (
              <MovieRow key={'cat:' + row.title} title={row.title} movies={row.movies} onPressMovie={openDetail} />
            ))}

            {becauseYouWatched && (
              <MovieRow title={becauseYouWatched.title} movies={becauseYouWatched.movies} onPressMovie={openDetail} />
            )}

            {top10.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Top 10 w Polsce dzisiaj</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topScroll}>
                  {top10.map((m, i) => (
                    <TouchableOpacity key={m.id} activeOpacity={0.85} style={styles.topItem} onPress={() => openDetail(m.id)}>
                      <Text style={styles.topRank}>{i + 1}</Text>
                      <Image source={m.poster} style={styles.topPoster} contentFit="cover" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {rows.map((row) => (
              <MovieRow key={row.title} title={row.title} movies={row.movies} onPressMovie={openDetail} />
            ))}
          </View>
        </ScrollView>
      ) : (
        // ---- SERIES grid ----
        <FlatList
          data={series}
          key={GRID_COLS}
          numColumns={GRID_COLS}
          keyExtractor={(s) => s.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{ paddingTop: insets.top + 96, paddingHorizontal: PAD, paddingBottom: spacing.xxl, gap: spacing.lg }}
          columnWrapperStyle={{ gap: GAP }}
          ListEmptyComponent={<Text style={styles.empty}>Brak seriali.</Text>}
          renderItem={({ item }) => {
            const w = (width - PAD * 2 - GAP * (GRID_COLS - 1)) / GRID_COLS;
            return (
              <TouchableOpacity activeOpacity={0.85} style={{ width: w }} onPress={() => navigation.navigate('SeriesDetail', { seriesId: item.id })}>
                <Image source={item.poster} style={{ width: w, height: w * 1.5, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt }} contentFit="cover" />
                <Text numberOfLines={1} style={styles.gridName}>{item.title}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {TopBar}

      {searchOpen && (
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill}>
          <LinearGradient colors={['rgba(11,11,15,0.55)', 'rgba(11,11,15,0.35)', 'rgba(11,11,15,0.85)']} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <View style={{ flex: 1, paddingTop: insets.top + spacing.sm }}>
            <View style={styles.searchBar}>
              <TouchableOpacity hitSlop={10} onPress={closeSearch}>
                <Ionicons name="chevron-back" size={26} color={colors.text} />
              </TouchableOpacity>
              <BlurView intensity={40} tint="light" style={styles.searchInputWrap}>
                <Ionicons name="search" size={18} color={colors.text} />
                <TextInput style={styles.searchInput} placeholder="Szukaj filmów…" placeholderTextColor={colors.textMuted}
                  value={query} onChangeText={setQuery} autoFocus returnKeyType="search" clearButtonMode="while-editing" />
              </BlurView>
            </View>
            {query.trim().length === 0 ? (
              <View style={styles.searchHint}><Ionicons name="search" size={44} color={colors.text} /><Text style={styles.searchHintText}>Wpisz tytuł lub gatunek</Text></View>
            ) : results.length === 0 ? (
              <View style={styles.searchHint}><Ionicons name="sad-outline" size={44} color={colors.text} /><Text style={styles.searchHintText}>Brak wyników dla „{query.trim()}"</Text></View>
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
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: 1, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 4 },
  pills: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  pill: { paddingHorizontal: spacing.lg, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.overlay },
  pillActive: { backgroundColor: colors.primary },
  pillText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  pillTextActive: { color: colors.onPrimary },
  heroContent: { position: 'absolute', bottom: spacing.xl, left: 0, right: 0, paddingHorizontal: spacing.lg, alignItems: 'center' },
  heroTitle: { color: colors.text, fontSize: 30, fontWeight: '900', textAlign: 'center' },
  heroTags: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  heroTag: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  heroBtns: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  playBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.text, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: radius.sm },
  playText: { color: '#000', fontSize: 15, fontWeight: '800' },
  infoBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surfaceAlt, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: radius.sm },
  infoText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  dots: { position: 'absolute', bottom: spacing.sm, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textFaint },
  dotActive: { backgroundColor: colors.primary, width: 18 },
  rows: { marginTop: spacing.xl },
  section: { marginBottom: spacing.xl },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700', paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  hScroll: { paddingHorizontal: spacing.lg, gap: spacing.md },
  cwCard: { width: 150 },
  cwPoster: { width: 150, height: 90, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  cwPlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 90, alignItems: 'center', justifyContent: 'center' },
  cwBar: { height: 3, backgroundColor: colors.border, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  cwFill: { height: 3, backgroundColor: colors.primary },
  cwName: { color: colors.textMuted, fontSize: 12, fontWeight: '600', marginTop: 5 },
  topScroll: { paddingHorizontal: spacing.lg, gap: spacing.lg, alignItems: 'flex-end' },
  topItem: { flexDirection: 'row', alignItems: 'flex-end' },
  topRank: { color: colors.surfaceAlt, fontSize: 92, fontWeight: '900', lineHeight: 92, marginRight: -18, textShadowColor: colors.border, textShadowRadius: 1 },
  topPoster: { width: 92, height: 138, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  gridName: { color: colors.textMuted, fontSize: 12, fontWeight: '600', marginTop: 5 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  searchInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  searchInput: { flex: 1, color: colors.text, fontSize: 15, padding: 0 },
  searchHint: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  searchHintText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
});
