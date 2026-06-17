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
import { Image } from 'expo-image'; // SVG-capable (backend posters are image/svg+xml)
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
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const SEARCH_COLS = 3;
const SEARCH_GAP = spacing.md;
const SEARCH_PAD = spacing.lg;

export default function HomeScreen({ navigation }: { navigation: Nav }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { featured: FEATURED, rows, movies, source, refresh } = useCatalog();
  const [refreshing, setRefreshing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const openDetail = (movieId: string) => navigation.navigate('Detail', { movieId });

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return movies.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.genres.some((g) => g.toLowerCase().includes(q)),
    );
  }, [query, movies]);

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery('');
  };

  // Pick up backend changes (new posters, edits, added/removed films) whenever
  // the Home tab regains focus.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  if (source === 'loading' || !FEATURED) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const cardWidth = (width - SEARCH_PAD * 2 - SEARCH_GAP * (SEARCH_COLS - 1)) / SEARCH_COLS;
  const q = query.trim();

  return (
    <View style={styles.container}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.hero}>
        <Image source={FEATURED.backdrop} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient
          colors={['rgba(11,11,15,0.2)', 'rgba(11,11,15,0.6)', colors.background]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          <Text style={styles.brand}>
            STREAM<Text style={{ color: colors.primary }}>X</Text>
          </Text>
          <TouchableOpacity hitSlop={10} onPress={() => setSearchOpen(true)}>
            <Ionicons name="search" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>{FEATURED.title}</Text>
          <View style={styles.heroTags}>
            {FEATURED.genres.map((g) => (
              <Text key={g} style={styles.heroTag}>
                {g}
              </Text>
            ))}
          </View>
          <View style={styles.heroButtons}>
            <TouchableOpacity
              style={styles.playBtn}
              onPress={() => navigation.navigate('Player', { movieId: FEATURED.id })}
              activeOpacity={0.85}
            >
              <Ionicons name="play" size={18} color="#000" />
              <Text style={styles.playText}>Play</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.infoBtn}
              onPress={() => openDetail(FEATURED.id)}
              activeOpacity={0.85}
            >
              <Ionicons name="information-circle-outline" size={18} color={colors.text} />
              <Text style={styles.infoText}>More Info</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.rows}>
        {rows.map((row) => (
          <MovieRow
            key={row.title}
            title={row.title}
            movies={row.movies}
            onPressMovie={openDetail}
          />
        ))}
      </View>
    </ScrollView>

    {/* Search as a frosted-glass overlay above Home — no hard page cut. */}
    {searchOpen && (
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill}>
        {/* soft gradient so the blur fades into the background instead of a flat slab */}
        <LinearGradient
          colors={['rgba(11,11,15,0.55)', 'rgba(11,11,15,0.35)', 'rgba(11,11,15,0.85)']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={{ flex: 1, paddingTop: insets.top + spacing.sm }}>
          <View style={styles.searchBar}>
            <TouchableOpacity hitSlop={10} onPress={closeSearch}>
              <Ionicons name="chevron-back" size={26} color={colors.text} />
            </TouchableOpacity>
            <BlurView intensity={40} tint="light" style={styles.searchInputWrap}>
              <Ionicons name="search" size={18} color={colors.text} />
              <TextInput
                style={styles.searchInput}
                placeholder="Szukaj filmów…"
                placeholderTextColor={colors.textMuted}
                value={query}
                onChangeText={setQuery}
                autoFocus
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
            </BlurView>
          </View>

          {q.length === 0 ? (
            <View style={styles.searchHint}>
              <Ionicons name="search" size={44} color={colors.text} />
              <Text style={styles.searchHintText}>Wpisz tytuł lub gatunek</Text>
            </View>
          ) : results.length === 0 ? (
            <View style={styles.searchHint}>
              <Ionicons name="sad-outline" size={44} color={colors.text} />
              <Text style={styles.searchHintText}>Brak wyników dla „{q}"</Text>
            </View>
          ) : (
            <FlatList
              data={results}
              key={SEARCH_COLS}
              numColumns={SEARCH_COLS}
              keyExtractor={(m) => m.id}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              columnWrapperStyle={{ gap: SEARCH_GAP }}
              contentContainerStyle={{ padding: SEARCH_PAD, paddingBottom: spacing.xxl, gap: spacing.lg }}
              renderItem={({ item }) => (
                <MovieCard movie={item} width={cardWidth} showMeta onPress={() => openDetail(item.id)} />
              )}
            />
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    overflow: 'hidden', // clip the inner BlurView to the pill radius
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 15, padding: 0 },
  searchHint: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  searchHintText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  hero: { height: 520, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  brand: { color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  heroContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, alignItems: 'center' },
  heroTitle: { color: colors.text, fontSize: 32, fontWeight: '900', textAlign: 'center' },
  heroTags: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap', justifyContent: 'center' },
  heroTag: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  heroButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.text,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.sm,
  },
  playText: { color: '#000', fontSize: 15, fontWeight: '800' },
  infoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.sm,
  },
  infoText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  rows: { marginTop: spacing.xl },
});
