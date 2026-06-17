import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image'; // renders SVG posters from backend
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../theme';
import { useCatalog } from '../context/CatalogContext';
import { useFavorites } from '../context/FavoritesContext';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function FavoritesScreen({ navigation }: { navigation: Nav }) {
  const insets = useSafeAreaInsets();
  const { favorites, toggleFavorite } = useFavorites();
  const { getMovie } = useCatalog();
  const movies = favorites.map((id) => getMovie(id)!).filter(Boolean);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <Text style={styles.header}>My Favorites</Text>
      <Text style={styles.sub}>
        {movies.length} {movies.length === 1 ? 'title' : 'titles'} saved
      </Text>

      {movies.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={56} color={colors.textFaint} />
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptyText}>
            Tap the heart on any title to keep it here for later.
          </Text>
        </View>
      ) : (
        <FlatList
          data={movies}
          keyExtractor={(m) => m.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Detail', { movieId: item.id })}
            >
              <Image source={item.poster} style={styles.thumb} contentFit="cover" />
              <View style={styles.rowBody}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.meta}>
                  {item.year} · {item.duration}
                </Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color={colors.rating} />
                  <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
                  <Text style={styles.genre}>{item.genres.join(' · ')}</Text>
                </View>
              </View>
              <TouchableOpacity
                hitSlop={10}
                onPress={() => toggleFavorite(item.id)}
                style={styles.heartBtn}
              >
                <Ionicons name="heart" size={22} color={colors.primary} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { color: colors.text, fontSize: 28, fontWeight: '800', paddingHorizontal: spacing.lg },
  sub: { color: colors.textMuted, fontSize: 13, paddingHorizontal: spacing.lg, marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: spacing.sm },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', maxWidth: 260 },
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    gap: spacing.md,
  },
  thumb: { width: 64, height: 96, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  rowBody: { flex: 1, gap: 4 },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  rating: { color: colors.text, fontSize: 12, fontWeight: '700', marginRight: spacing.sm },
  genre: { color: colors.textFaint, fontSize: 11 },
  heartBtn: { padding: spacing.sm },
});
