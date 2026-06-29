import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image'; // expo-image renders SVG posters (backend serves image/svg+xml)
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import type { Movie } from '../data/movies';

type Props = {
  movie: Movie;
  width: number;
  onPress: () => void;
  showMeta?: boolean;
};

export default function MovieCard({ movie, width, onPress, showMeta }: Props) {
  const height = width * 1.5;
  // Scale the overlaid title to the card size so small carousel cards stay legible.
  const titleSize = Math.max(11, Math.min(15, Math.round(width / 8)));
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{ width }}
      accessibilityRole="button"
      accessibilityLabel={movie.title}
    >
      <View style={[styles.posterWrap, { width, height }]}>
        <Image source={movie.poster} style={styles.poster} contentFit="cover" transition={150} />
        {/* light bottom gradient for title legibility */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.82)']}
          locations={[0, 0.45, 1]}
          style={styles.scrim}
        />
        <View style={styles.ratingPill}>
          <Ionicons name="star" size={10} color={colors.rating} />
          <Text style={styles.ratingText}>{movie.rating.toFixed(1)}</Text>
        </View>
        <Text numberOfLines={2} style={[styles.overlayTitle, { fontSize: titleSize }]}>
          {movie.title}
        </Text>
      </View>
      {showMeta && (
        <View style={styles.meta}>
          <Text style={styles.sub}>
            {movie.year} · {movie.genres[0]}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  posterWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'flex-end',
  },
  poster: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' },
  ratingPill: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.overlay,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  ratingText: { color: colors.text, fontSize: 10, fontWeight: '700' },
  overlayTitle: {
    color: colors.text,
    fontWeight: '800',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  meta: { marginTop: spacing.sm },
  sub: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
});
