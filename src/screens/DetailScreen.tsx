import React, { useState } from 'react';
import {
  Alert,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image'; // SVG-capable (backend posters are image/svg+xml)
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { colors, radius, spacing, touchTarget, typography, withAlpha } from '../theme';
import { useCatalog } from '../context/CatalogContext';
import { useFavorites } from '../context/FavoritesContext';
import MovieCard from '../components/MovieCard';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Detail'>;
type Rt = RouteProp<RootStackParamList, 'Detail'>;

export default function DetailScreen({ navigation, route }: { navigation: Nav; route: Rt }) {
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { getMovie, movies } = useCatalog();
  const movie = getMovie(route.params.movieId);
  const [expanded, setExpanded] = useState(false);

  if (!movie) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: colors.text }}>Title not found.</Text>
      </View>
    );
  }

  const onShare = () => {
    Share.share({
      message: `Watch "${movie.title}" (${movie.year}) on StreamX`,
      title: movie.title,
    }).catch(() => {});
  };
  const onDownload = () =>
    Alert.alert('Downloads', 'Offline downloads are coming soon to StreamX.');

  // Face-aware vertical crop: position the cover image on the poster's focal Y
  // so faces aren't cut off the top or bottom.
  const focusPos = `${Math.round((movie.posterFocusY ?? 0.3) * 100)}%`;
  const fav = isFavorite(movie.id);
  const similar = movies
    .filter((m) => m.id !== movie.id && m.genres.some((g) => movie.genres.includes(g)))
    .slice(0, 6);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        {/* Full-bleed poster (runs under the status bar / Dynamic Island). A dark
            top gradient fades smoothly over the island area into the poster — no
            solid bar, no hard edge. */}
        <Image source={movie.backdrop} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition={{ top: focusPos }} />
        <LinearGradient
          colors={[withAlpha(colors.background, 0.85), withAlpha(colors.background, 0.4), 'transparent']}
          locations={[0, 0.5, 1]}
          style={[styles.heroTopFade, { height: insets.top + 80 }]}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['transparent', withAlpha(colors.background, 0.35), withAlpha(colors.background, 0.9), colors.background]}
          locations={[0, 0.48, 0.78, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <TouchableOpacity
          style={[styles.back, { top: insets.top + spacing.sm }]}
          onPress={() => navigation.goBack()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{movie.title}</Text>
        <View style={styles.metaRow}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={colors.rating} />
            <Text style={styles.rating}>{movie.rating.toFixed(1)}</Text>
          </View>
          <Text style={styles.metaText}>{movie.year}</Text>
          <Text style={styles.metaText}>{movie.duration}</Text>
          <View style={styles.maturity}>
            <Text style={styles.maturityText}>{movie.maturity}</Text>
          </View>
        </View>

        <View style={styles.genres}>
          {movie.genres.map((g) => (
            <View key={g} style={styles.genrePill}>
              <Text style={styles.genrePillText}>{g}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.playBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Player', { movieId: movie.id })}
          accessibilityRole="button"
          accessibilityLabel={`Play ${movie.title}`}
        >
          <Ionicons name="play" size={20} color={colors.onPrimary} />
          <Text style={styles.playText}>Play</Text>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.action}
            onPress={() => toggleFavorite(movie.id)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityState={{ selected: fav }}
            accessibilityLabel={fav ? 'Remove from My List' : 'Add to My List'}
          >
            <Ionicons
              name={fav ? 'heart' : 'heart-outline'}
              size={24}
              color={fav ? colors.primary : colors.text}
            />
            <Text style={styles.actionText}>{fav ? 'Saved' : 'My List'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.action}
            onPress={onDownload}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Download"
          >
            <Ionicons name="download-outline" size={24} color={colors.text} />
            <Text style={styles.actionText}>Download</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.action}
            onPress={onShare}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Share"
          >
            <Ionicons name="share-social-outline" size={24} color={colors.text} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.description} numberOfLines={expanded ? undefined : 4}>
          {movie.description}
        </Text>
        {movie.description.length > 140 && (
          <TouchableOpacity
            onPress={() => setExpanded((e) => !e)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Show less' : 'Show more'}
          >
            <Text style={styles.more}>{expanded ? 'Show less' : 'Show more'}</Text>
          </TouchableOpacity>
        )}

        {similar.length > 0 && (
          <View style={styles.similar}>
            <Text style={styles.similarTitle}>More Like This</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.md }}
            >
              {similar.map((m) => (
                <MovieCard
                  key={m.id}
                  movie={m}
                  width={110}
                  onPress={() => navigation.push('Detail', { movieId: m.id })}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  hero: { height: 540, backgroundColor: colors.background },
  heroTopFade: { position: 'absolute', top: 0, left: 0, right: 0 },
  back: {
    position: 'absolute',
    left: spacing.lg,
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: spacing.lg, marginTop: -64 },
  title: { color: colors.text, ...typography.h2, fontWeight: '900' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { color: colors.text, ...typography.bodyStrong },
  metaText: { color: colors.textMuted, ...typography.body },
  maturity: { borderWidth: 1, borderColor: colors.textFaint, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  maturityText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  genres: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  genrePill: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  genrePillText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    minHeight: touchTarget,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    marginTop: spacing.lg,
  },
  playText: { color: colors.onPrimary, fontSize: 16, fontWeight: '800' },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.lg },
  action: { alignItems: 'center', gap: 4, minWidth: touchTarget, paddingVertical: spacing.xs },
  actionText: { color: colors.textMuted, ...typography.caption, fontWeight: '600' },
  description: { color: colors.text, ...typography.body, marginTop: spacing.md, opacity: 0.9 },
  more: { color: colors.primary, ...typography.label, marginTop: spacing.sm },
  similar: { marginTop: spacing.lg },
  similarTitle: { color: colors.text, ...typography.h3, marginBottom: spacing.md },
});
