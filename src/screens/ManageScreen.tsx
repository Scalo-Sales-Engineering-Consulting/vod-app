import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../theme';
import { fetchMyVideos, deleteVideo, posterAbs, type VideoWithStream } from '../lib/api';
import { useCatalog } from '../context/CatalogContext';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_COLOR: Record<VideoWithStream['status'], string> = {
  ready: colors.primary,
  processing: colors.rating,
  uploaded: colors.textMuted,
  failed: '#FF6B6B',
};

export default function ManageScreen({ navigation }: { navigation: Nav }) {
  const insets = useSafeAreaInsets();
  const { reload: reloadCatalog } = useCatalog();
  const [videos, setVideos] = useState<VideoWithStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const v = await fetchMyVideos();
      setVideos(v);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch every time the tab gains focus (e.g. after add/edit).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const confirmDelete = (v: VideoWithStream) => {
    Alert.alert('Delete film', `Remove "${v.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVideo(v.id);
            setVideos((cur) => cur.filter((x) => x.id !== v.id));
            reloadCatalog();
          } catch (e) {
            Alert.alert('Delete failed', e instanceof Error ? e.message : String(e));
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Manage</Text>
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('VideoForm', {})}
        >
          <Ionicons name="add" size={20} color={colors.onPrimary} />
          <Text style={styles.addText}>Add film</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textFaint} />
          <Text style={styles.errText}>Can't reach backend.</Text>
          <Text style={styles.errSub}>{error}</Text>
          <TouchableOpacity style={styles.retry} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(v) => v.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="film-outline" size={48} color={colors.textFaint} />
              <Text style={styles.errText}>No films yet</Text>
              <Text style={styles.errSub}>Tap "Add film" to upload one.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('VideoForm', { videoId: item.id })}
            >
              <Image source={posterAbs(item)} style={styles.thumb} contentFit="cover" />
              <View style={styles.body}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {item.release_year ?? '—'} · {item.genres.map((g) => g.name).join(', ') || 'no genres'}
                </Text>
                <View style={styles.statusRow}>
                  <View style={[styles.dot, { backgroundColor: STATUS_COLOR[item.status] }]} />
                  <Text style={[styles.status, { color: STATUS_COLOR[item.status] }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  hitSlop={10}
                  style={styles.iconBtn}
                  onPress={() => navigation.navigate('VideoForm', { videoId: item.id })}
                >
                  <Ionicons name="create-outline" size={22} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity hitSlop={10} style={styles.iconBtn} onPress={() => confirmDelete(item)}>
                  <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  header: { color: colors.text, fontSize: 28, fontWeight: '800' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  addText: { color: colors.onPrimary, fontWeight: '800', fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  errText: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: spacing.sm },
  errSub: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  retry: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
  },
  retryText: { color: colors.text, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    gap: spacing.md,
  },
  thumb: { width: 56, height: 84, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  body: { flex: 1, gap: 4 },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  status: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  actions: { flexDirection: 'row', gap: spacing.xs },
  iconBtn: { padding: spacing.sm },
});
