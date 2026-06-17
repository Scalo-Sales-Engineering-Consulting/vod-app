import React from 'react';
import {
  ActivityIndicator,
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
import { colors, radius, spacing } from '../theme';
import { useCatalog } from '../context/CatalogContext';
import MovieRow from '../components/MovieRow';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen({ navigation }: { navigation: Nav }) {
  const insets = useSafeAreaInsets();
  const { featured: FEATURED, rows, source } = useCatalog();
  const openDetail = (movieId: string) => navigation.navigate('Detail', { movieId });

  if (source === 'loading' || !FEATURED) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      showsVerticalScrollIndicator={false}
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
          <Ionicons name="search" size={22} color={colors.text} />
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
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
