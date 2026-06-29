import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, spacing, typography } from '../theme';
import { useCatalog } from '../context/CatalogContext';
import HeroCarousel, { type HeroItem } from '../components/HeroCarousel';
import type { SeriesSummary } from '../lib/api';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const COLS = 3;
const PAD = spacing.lg;
const GAP = spacing.md;

export default function SeriesScreen({ navigation }: { navigation: Nav }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { series, source, refresh } = useCatalog();
  const [refreshing, setRefreshing] = useState(false);

  const open = (id: string) => navigation.navigate('SeriesDetail', { seriesId: id });
  const heroItems = useMemo<HeroItem[]>(
    () => series.slice(0, 10).map((s: SeriesSummary) => ({
      id: s.id, title: s.title, image: s.poster, meta: `${s.maturity} · ${s.year || '—'} · Series`, badge: 'Series',
    })),
    [series],
  );

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  const onRefresh = useCallback(async () => { setRefreshing(true); await refresh(); setRefreshing(false); }, [refresh]);

  if (source === 'loading') {
    return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  const cardW = (width - PAD * 2 - GAP * (COLS - 1)) / COLS;

  return (
    <FlatList
      style={styles.container}
      data={series}
      key={COLS}
      numColumns={COLS}
      keyExtractor={(s) => s.id}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      ListHeaderComponent={
        <View>
          <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
            <Text style={styles.pageTitle}>Series</Text>
          </View>
          <HeroCarousel items={heroItems} onPress={open} />
          <Text style={styles.allTitle}>All Series</Text>
        </View>
      }
      columnWrapperStyle={{ gap: GAP, paddingHorizontal: PAD }}
      ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      ListEmptyComponent={<Text style={styles.empty}>No series yet.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity activeOpacity={0.85} style={{ width: cardW }} onPress={() => open(item.id)}
          accessibilityRole="button" accessibilityLabel={`Open ${item.title}`}>
          <Image source={item.poster} style={{ width: cardW, height: cardW * 1.5, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt }} contentFit="cover" />
          <Text numberOfLines={1} style={styles.name}>{item.title}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  pageTitle: { color: colors.text, ...typography.display },
  allTitle: { color: colors.text, ...typography.title, paddingHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.md },
  name: { color: colors.textMuted, ...typography.caption, fontWeight: '600', marginTop: 5 },
  empty: { color: colors.textMuted, ...typography.body, textAlign: 'center', marginTop: spacing.xxl },
});
