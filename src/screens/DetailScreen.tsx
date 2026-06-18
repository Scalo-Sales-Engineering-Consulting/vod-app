import React from 'react';
import {
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
import { colors, radius, spacing, withAlpha } from '../theme';
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

  if (!movie) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: colors.text }}>Title not found.</Text>
      </View>
    );
  }

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
      <View style={[styles.hero, { paddingTop: insets.top }]}>
        {/* Dark background above the poster + a light gradient fading the image
            top into it (status-bar / Dynamic Island area). */}
        <View style={styles.heroImage}>
          <Image source={movie.backdrop} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition={{ top: focusPos }} />
          <LinearGradient
            colors={[withAlpha(colors.background, 0.5), withAlpha(colors.background, 0.25), 'transparent']}
            locations={[0, 0.5, 1]}
            style={styles.heroTopFade}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['transparent', withAlpha(colors.background, 0.15), withAlpha(colors.background, 0.45), colors.background]}
            locations={[0, 0.62, 0.86, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>
        <TouchableOpacity
          style={[styles.back, { top: insets.top + spacing.sm }]}
          onPress={() => navigation.goBack()}
          hitSlop={10}
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
        >
          <Ionicons name="play" size={20} color="#000" />
          <Text style={styles.playText}>Play</Text>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.action} onPress={() => toggleFavorite(movie.id)}>
            <Ionicons
              name={fav ? 'heart' : 'heart-outline'}
              size={24}
              color={fav ? colors.primary : colors.text}
            />
            <Text style={styles.actionText}>{fav ? 'Saved' : 'My List'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action}>
            <Ionicons name="download-outline" size={24} color={colors.text} />
            <Text style={styles.actionText}>Download</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action}>
            <Ionicons name="share-social-outline" size={24} color={colors.text} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.description}>{movie.description}</Text>

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
  hero: { height: 620, backgroundColor: colors.background },
  heroImage: { flex: 1 },
  heroTopFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 90 },
  back: {
    position: 'absolute',
    left: spacing.lg,
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: spacing.lg, marginTop: -40 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { color: colors.text, fontSize: 14, fontWeight: '700' },
  metaText: { color: colors.textMuted, fontSize: 14 },
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
    backgroundColor: colors.text,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    marginTop: spacing.lg,
  },
  playText: { color: '#000', fontSize: 16, fontWeight: '800' },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.lg },
  action: { alignItems: 'center', gap: 4 },
  actionText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  description: { color: colors.text, fontSize: 14, lineHeight: 21, marginTop: spacing.xl, opacity: 0.9 },
  similar: { marginTop: spacing.xl },
  similarTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: spacing.md },
});
