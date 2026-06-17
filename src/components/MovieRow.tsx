import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';
import type { Movie } from '../data/movies';
import MovieCard from './MovieCard';

type Props = {
  title: string;
  movies: Movie[];
  onPressMovie: (id: string) => void;
};

export default function MovieRow({ title, movies, onPressMovie }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <FlatList
        data={movies}
        keyExtractor={(m, i) => `${m.id}-${i}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <MovieCard movie={item} width={120} onPress={() => onPressMovie(item.id)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.xl },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  list: { paddingHorizontal: spacing.lg, gap: spacing.md },
});
