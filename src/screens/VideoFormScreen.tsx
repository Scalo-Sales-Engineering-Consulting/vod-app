import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { colors, radius, spacing } from '../theme';
import {
  createVideo,
  updateVideo,
  uploadPoster,
  fetchVideo,
  posterAbs,
  type VideoMeta,
} from '../lib/api';
import { useCatalog } from '../context/CatalogContext';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'VideoForm'>;
type Rt = RouteProp<RootStackParamList, 'VideoForm'>;
type FilePick = { uri: string; name: string; type: string };

export default function VideoFormScreen({ navigation, route }: { navigation: Nav; route: Rt }) {
  const insets = useSafeAreaInsets();
  const { reload } = useCatalog();
  const editId = route.params?.videoId;
  const isEdit = !!editId;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [year, setYear] = useState('');
  const [director, setDirector] = useState('');
  const [cast, setCast] = useState('');
  const [maturity, setMaturity] = useState('');
  const [language, setLanguage] = useState('');
  const [genres, setGenres] = useState(''); // CSV

  const [video, setVideo] = useState<FilePick | null>(null);
  const [poster, setPoster] = useState<FilePick | null>(null);
  const [currentPoster, setCurrentPoster] = useState<string | undefined>();

  // Prefill in edit mode.
  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const v = await fetchVideo(editId);
        setTitle(v.title);
        setDescription(v.description ?? '');
        setYear(v.release_year != null ? String(v.release_year) : '');
        setDirector(v.director ?? '');
        setCast(v.cast ?? '');
        setMaturity(v.maturity_rating ?? '');
        setLanguage(v.language ?? '');
        setGenres(v.genres.map((g) => g.name).join(', '));
        setCurrentPoster(posterAbs(v));
      } catch (e) {
        Alert.alert('Load failed', e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [editId]);

  const pickVideo = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'video/*', copyToCacheDirectory: true });
    if (res.canceled) return;
    const a = res.assets[0];
    setVideo({ uri: a.uri, name: a.name ?? 'video.mp4', type: a.mimeType ?? 'video/mp4' });
  };

  const pickPoster = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to pick a poster.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (res.canceled) return;
    const a = res.assets[0];
    const name = a.fileName ?? a.uri.split('/').pop() ?? 'poster.jpg';
    setPoster({ uri: a.uri, name, type: a.mimeType ?? 'image/jpeg' });
  };

  const meta = (): VideoMeta => ({
    title: title.trim(),
    description: description.trim() || undefined,
    release_year: year.trim() ? Number(year.trim()) : null,
    director: director.trim() || undefined,
    cast: cast.trim() || undefined,
    maturity_rating: maturity.trim() || undefined,
    language: language.trim() || undefined,
    genres: genres.trim() ? genres.split(',').map((g) => g.trim()).filter(Boolean) : undefined,
  });

  const onSave = async () => {
    if (!title.trim()) {
      Alert.alert('Title required');
      return;
    }
    if (!isEdit && !video) {
      Alert.alert('Video required', 'Pick a video file to upload.');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await updateVideo(editId!, meta());
        if (poster) await uploadPoster(editId!, poster);
      } else {
        await createVideo(video!, { ...meta(), title: title.trim() }, poster ?? undefined);
      }
      reload();
      navigation.goBack();
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const posterPreview = poster?.uri ?? currentPoster;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity hitSlop={10} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{isEdit ? 'Edit film' : 'Add film'}</Text>
        <TouchableOpacity hitSlop={10} onPress={onSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.save}>{isEdit ? 'Save' : 'Create'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.md }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Poster */}
        <TouchableOpacity style={styles.posterPick} activeOpacity={0.85} onPress={pickPoster}>
          {posterPreview ? (
            <Image source={posterPreview} style={styles.posterImg} contentFit="cover" />
          ) : (
            <View style={[styles.posterImg, styles.posterPlaceholder]}>
              <Ionicons name="image-outline" size={32} color={colors.textFaint} />
              <Text style={styles.posterHint}>Add poster</Text>
            </View>
          )}
          <View style={styles.posterEdit}>
            <Ionicons name="camera" size={16} color={colors.onPrimary} />
          </View>
        </TouchableOpacity>

        {/* Video (add only) */}
        {!isEdit && (
          <TouchableOpacity style={styles.videoPick} activeOpacity={0.85} onPress={pickVideo}>
            <Ionicons name={video ? 'checkmark-circle' : 'cloud-upload-outline'} size={22} color={video ? colors.primary : colors.text} />
            <Text style={styles.videoPickText} numberOfLines={1}>
              {video ? video.name : 'Pick video file *'}
            </Text>
          </TouchableOpacity>
        )}

        <Field label="Title *" value={title} onChangeText={setTitle} placeholder="Film title" />
        <Field label="Description" value={description} onChangeText={setDescription} placeholder="Synopsis" multiline />
        <Field label="Release year" value={year} onChangeText={setYear} placeholder="2024" keyboardType="number-pad" />
        <Field label="Genres (comma-separated)" value={genres} onChangeText={setGenres} placeholder="Akcja, Sci-Fi" />
        <Field label="Director" value={director} onChangeText={setDirector} placeholder="Director name" />
        <Field label="Cast" value={cast} onChangeText={setCast} placeholder="Actor, Actor" />
        <Field label="Maturity rating" value={maturity} onChangeText={setMaturity} placeholder="13+" />
        <Field label="Language" value={language} onChangeText={setLanguage} placeholder="EN" />

        {isEdit && (
          <Text style={styles.note}>
            The video file can't be replaced — delete and re-add to change it.
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  multiline,
  ...props
}: { label: string; multiline?: boolean } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        placeholderTextColor={colors.textFaint}
        multiline={multiline}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  save: { color: colors.primary, fontSize: 16, fontWeight: '800' },
  posterPick: { alignSelf: 'center', marginBottom: spacing.sm },
  posterImg: { width: 130, height: 195, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  posterPlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  posterHint: { color: colors.textFaint, fontSize: 12, fontWeight: '600' },
  posterEdit: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  videoPick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  videoPickText: { color: colors.text, fontSize: 14, fontWeight: '600', flex: 1 },
  label: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 15,
  },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  note: { color: colors.textFaint, fontSize: 12, fontStyle: 'italic', marginTop: spacing.sm },
});
