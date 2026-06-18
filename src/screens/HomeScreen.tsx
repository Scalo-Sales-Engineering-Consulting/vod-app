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
  const heroRef = useRef<FlatList<Movie>>(null);
  const rawPos = useRef(1); // position within the looped list (1 = first real item)

  // Hero card geometry (Disney+-style card with peeking neighbours).
  const CARD_W = Math.round(width - 56);
  const CARD_H = Math.round(CARD_W * 1.32);
  const SNAP = CARD_W + GAP;
  const SIDE = Math.round((width - CARD_W) / 2);

  const openDetail = (movieId: string) => navigation.navigate('Detail', { movieId });

  const heroItems = useMemo<Movie[]>(() => (top10.length ? top10 : movies).slice(0, 10), [top10, movies]);
  // For infinite looping, clone last item at the front and first at the back:
  // [lastClone, ...items, firstClone]. Start at index 1; jump across the seam
  // (no animation) when a clone is reached.
  const loop = heroItems.length > 1;
  const loopData = useMemo<Movie[]>(
    () => (loop ? [heroItems[heroItems.length - 1], ...heroItems, heroItems[0]] : heroItems),
    [heroItems, loop],
  );

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  useEffect(() => {
    if (tab !== 'movies' || !loop || searchOpen) return;
    const id = setInterval(() => {
      heroRef.current?.scrollToOffset({ offset: (rawPos.current + 1) * SNAP, animated: true });
    }, 5000);
    return () => clearInterval(id);
  }, [tab, loop, searchOpen, SNAP]);

  const onHeroMomentum = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const n = heroItems.length;
    let raw = Math.round(e.nativeEvent.contentOffset.x / SNAP);
    if (loop) {
      if (raw === 0) { raw = n; heroRef.current?.scrollToOffset({ offset: raw * SNAP, animated: false }); }
      else if (raw === n + 1) { raw = 1; heroRef.current?.scrollToOffset({ offset: raw * SNAP, animated: false }); }
      rawPos.current = raw;
      setHeroIndex(((raw - 1) % n + n) % n);
    } else {
      setHeroIndex(raw);
    }
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return movies.filter(
      (m) => m.title.toLowerCase().includes(q) || m.genres.some((g) => g.toLowerCase().includes(q)),
    );
  }, [query, movies]);
  const closeSearch = () => { setSearchOpen(false); setQuery(''); };

  // Header: "Dla Ciebie" title + search + Filmy/Seriale pills.
  const Header = (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>Dla Ciebie</Text>
        <TouchableOpacity hitSlop={10} onPress={() => setSearchOpen(true)}>
          <Ionicons name="search" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.pills}>
        {(['movies', 'series'] as Tab[]).map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} activeOpacity={0.85}
            style={[styles.pill, tab === t && styles.pillActive]}>
            <Text style={[styles.pillText, tab === t && styles.pillTextActive]}>
              {t === 'movies' ? 'Filmy' : 'Seriale'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (source === 'loading') {
    return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  const HeroCard = ({ item }: { item: Movie }) => (
    <TouchableOpacity activeOpacity={0.9} style={{ width: CARD_W, marginRight: GAP }} onPress={() => openDetail(item.id)}>
      <View style={[styles.card, { height: CARD_H }]}>
        <Image source={item.backdrop} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(11,11,15,0.1)', 'rgba(11,11,15,0.92)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.cardInfo}>
          <View style={styles.newBadge}><Text style={styles.newBadgeText}>Nowość</Text></View>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.cardMeta}>
            {item.maturity} · {item.year || '—'} · {item.genres[0] ?? 'Film'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const MoviesBody = (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {Header}

      {heroItems.length > 0 && (
        <View>
          <FlatList
            ref={heroRef}
            data={loopData}
            keyExtractor={(_, i) => String(i)}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={SNAP}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: SIDE }}
            contentOffset={{ x: loop ? SNAP : 0, y: 0 }}
            onMomentumScrollEnd={onHeroMomentum}
            renderItem={HeroCard}
          />
          <View style={styles.dots}>
            {heroItems.map((_, i) => <View key={i} style={[styles.dot, i === heroIndex && styles.dotActive]} />)}
          </View>
        </View>
      )}

      <View>
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
  );

  const SeriesBody = (
    <FlatList
      data={series}
      key={GRID_COLS}
      numColumns={GRID_COLS}
      keyExtractor={(s) => s.id}
      ListHeaderComponent={Header}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      columnWrapperStyle={{ gap: GAP, paddingHorizontal: PAD }}
      ListEmptyComponent={<Text style={styles.empty}>Brak seriali.</Text>}
      ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
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
  );

  return (
    <View style={styles.container}>
      {tab === 'movies' ? MoviesBody : SeriesBody}

      {searchOpen && (
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill}>
          <LinearGradient colors={['rgba(11,11,15,0.55)', 'rgba(11,11,15,0.35)', 'rgba(11,11,15,0.85)']} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <View style={{ flex: 1, paddingTop: insets.top + spacing.sm }}>
            <View style={styles.searchBar}>
              <TouchableOpacity hitSlop={10} onPress={closeSearch}><Ionicons name="chevron-back" size={26} color={colors.text} /></TouchableOpacity>
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
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { color: colors.text, fontSize: 30, fontWeight: '900' },
  pills: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  pill: { paddingHorizontal: spacing.lg, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt },
  pillActive: { backgroundColor: colors.primary },
  pillText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  pillTextActive: { color: colors.onPrimary },
  card: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  cardInfo: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  newBadge: { backgroundColor: colors.text, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm, marginBottom: spacing.md },
  newBadgeText: { color: '#000', fontSize: 11, fontWeight: '800' },
  cardTitle: { color: colors.text, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  cardMeta: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginTop: spacing.sm },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.md },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textFaint },
  dotActive: { backgroundColor: colors.primary, width: 18 },
  section: { marginTop: spacing.xl },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800', paddingHorizontal: spacing.lg, marginBottom: spacing.md },
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
