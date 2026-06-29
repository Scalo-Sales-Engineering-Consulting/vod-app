import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../theme';
import { useCatalog } from '../context/CatalogContext';
import HeroCarousel from '../components/HeroCarousel';
import MovieRow from '../components/MovieRow';
import { toHero } from './HomeScreen';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function MoviesScreen({ navigation }: { navigation: Nav }) {
  const insets = useSafeAreaInsets();
  const { rows, movies, top10, source, refresh } = useCatalog();
  const [refreshing, setRefreshing] = useState(false);

  const openDetail = (id: string) => navigation.navigate('Detail', { movieId: id });
  const heroItems = useMemo(() => (top10.length ? top10 : movies).slice(0, 10).map(toHero), [top10, movies]);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  const onRefresh = useCallback(async () => { setRefreshing(true); await refresh(); setRefreshing(false); }, [refresh]);

  if (source === 'loading') {
    return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.pageTitle}>Movies</Text>
      </View>
      <HeroCarousel items={heroItems} onPress={openDetail} />
      <View style={{ marginTop: spacing.lg }}>
        {rows.map((row) => (
          <MovieRow key={row.title} title={row.title} movies={row.movies} onPressMovie={openDetail} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  pageTitle: { color: colors.text, ...typography.display },
});
