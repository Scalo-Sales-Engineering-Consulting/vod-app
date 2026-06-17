import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../theme';
import { useCatalog } from '../context/CatalogContext';
import MovieCard from '../components/MovieCard';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const COLUMN_GAP = spacing.md;
const H_PADDING = spacing.lg;
const NUM_COLUMNS = 3;

export default function CatalogScreen({ navigation }: { navigation: Nav }) {
  const insets = useSafeAreaInsets();
  const { movies, genres: GENRES, refresh } = useCatalog();
  const [genre, setGenre] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

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

  const filtered = useMemo(
    () => (genre === 'All' ? movies : movies.filter((m) => m.genres.includes(genre))),
    [genre, movies],
  );

  // Compute card width so 3 columns fit with even gaps.
  const [containerWidth, setContainerWidth] = useState(0);
  const cardWidth =
    containerWidth > 0
      ? (containerWidth - H_PADDING * 2 - COLUMN_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS
      : 0;

  return (
    <View
      style={[styles.container, { paddingTop: insets.top + spacing.sm }]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <Text style={styles.header}>Catalog</Text>

      <View style={styles.chipsWrap}>
        <FlatList
          data={GENRES}
          horizontal
          keyExtractor={(g) => g}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: H_PADDING, gap: spacing.sm }}
          renderItem={({ item }) => {
            const active = item === genre;
            return (
              <TouchableOpacity
                onPress={() => setGenre(item)}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {cardWidth > 0 && (
        <FlatList
          data={filtered}
          key={NUM_COLUMNS}
          numColumns={NUM_COLUMNS}
          keyExtractor={(m) => m.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          columnWrapperStyle={{ gap: COLUMN_GAP }}
          contentContainerStyle={{
            paddingHorizontal: H_PADDING,
            paddingBottom: spacing.xxl,
            gap: spacing.lg,
          }}
          renderItem={({ item }) => (
            <MovieCard
              movie={item}
              width={cardWidth}
              showMeta
              onPress={() => navigation.navigate('Detail', { movieId: item.id })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    paddingHorizontal: H_PADDING,
    marginBottom: spacing.lg,
  },
  chipsWrap: { marginBottom: spacing.lg },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: colors.onPrimary, fontWeight: '700' },
});
