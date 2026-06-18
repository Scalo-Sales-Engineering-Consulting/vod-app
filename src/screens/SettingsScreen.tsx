import React, { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';
import { useProfile } from '../context/ProfileContext';

type RowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  toggle?: boolean;
  on?: boolean;
  onToggle?: (v: boolean) => void;
};

function SettingRow({ icon, label, value, toggle, on, onToggle }: RowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={18} color={colors.text} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      {toggle ? (
        <Switch
          value={on}
          onValueChange={onToggle}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor={colors.text}
        />
      ) : (
        <View style={styles.rowRight}>
          {value && <Text style={styles.rowValue}>{value}</Text>}
          <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
        </View>
      )}
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [downloadWifi, setDownloadWifi] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [notifications, setNotifications] = useState(false);
  const { profiles, activeId, setActive, createProfile, removeProfile } = useProfile();

  const onAddProfile = () => {
    Alert.prompt?.('New profile', 'Profile name', (name) => {
      if (name?.trim()) createProfile(name.trim()).catch((e) => Alert.alert('Error', String(e)));
    });
  };

  const onLongPressProfile = (id: string, name: string) => {
    if (profiles.length <= 1) return;
    Alert.alert('Delete profile', `Delete “${name}”? Its list and history will be gone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeProfile(id).catch((e) => Alert.alert('Error', String(e))) },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: spacing.xxl }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.header}>Settings</Text>

      <View style={styles.profile}>
        <Image source={{ uri: 'https://i.pravatar.cc/200?img=12' }} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>Dariusz Szyburski</Text>
          <Text style={styles.email}>dariusz.szyburski@scalosoft.com</Text>
          <View style={styles.planPill}>
            <Ionicons name="diamond" size={11} color={colors.onPrimary} />
            <Text style={styles.planText}>Premium · 4K Ultra HD</Text>
          </View>
        </View>
        <TouchableOpacity hitSlop={8}>
          <Ionicons name="create-outline" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={styles.section}>Profile</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.profilesRow}
      >
        {profiles.map((p) => {
          const activeP = p.id === activeId;
          return (
            <TouchableOpacity
              key={p.id}
              activeOpacity={0.85}
              onPress={() => setActive(p.id)}
              onLongPress={() => onLongPressProfile(p.id, p.name)}
              style={styles.profileItem}
            >
              <View
                style={[
                  styles.profileAvatar,
                  { backgroundColor: p.avatar || colors.primary, borderColor: activeP ? colors.text : 'transparent' },
                ]}
              >
                <Text style={styles.profileInitial}>{p.name.charAt(0).toUpperCase()}</Text>
                {p.is_kids && <Text style={styles.kidsTag}>KIDS</Text>}
              </View>
              <Text style={[styles.profileName, activeP && { color: colors.text }]} numberOfLines={1}>
                {p.name}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity activeOpacity={0.85} onPress={onAddProfile} style={styles.profileItem}>
          <View style={[styles.profileAvatar, styles.addAvatar]}>
            <Ionicons name="add" size={28} color={colors.textMuted} />
          </View>
          <Text style={styles.profileName}>Add</Text>
        </TouchableOpacity>
      </ScrollView>

      <Text style={styles.section}>Playback</Text>
      <View style={styles.card}>
        <SettingRow icon="play-circle" label="Autoplay next episode" toggle on={autoplay} onToggle={setAutoplay} />
        <View style={styles.divider} />
        <SettingRow icon="wifi" label="Download over Wi-Fi only" toggle on={downloadWifi} onToggle={setDownloadWifi} />
        <View style={styles.divider} />
        <SettingRow icon="film" label="Video quality" value="High" />
      </View>

      <Text style={styles.section}>Account</Text>
      <View style={styles.card}>
        <SettingRow icon="person-circle" label="Manage profile" />
        <View style={styles.divider} />
        <SettingRow icon="card" label="Subscription & billing" value="Premium" />
        <View style={styles.divider} />
        <SettingRow icon="notifications" label="Push notifications" toggle on={notifications} onToggle={setNotifications} />
        <View style={styles.divider} />
        <SettingRow icon="language" label="Language" value="English" />
      </View>

      <Text style={styles.section}>Support</Text>
      <View style={styles.card}>
        <SettingRow icon="help-circle" label="Help center" />
        <View style={styles.divider} />
        <SettingRow icon="shield-checkmark" label="Privacy & security" />
      </View>

      <TouchableOpacity style={styles.signOut} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={18} color={colors.primary} />
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
      <Text style={styles.version}>StreamX · v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { color: colors.text, fontSize: 28, fontWeight: '800', paddingHorizontal: spacing.lg },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  avatar: { width: 64, height: 64, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt },
  name: { color: colors.text, fontSize: 18, fontWeight: '700' },
  email: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  planPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  planText: { color: colors.onPrimary, fontSize: 11, fontWeight: '800' },
  section: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: { backgroundColor: colors.surface, marginHorizontal: spacing.lg, borderRadius: radius.lg, overflow: 'hidden' },
  profilesRow: { paddingHorizontal: spacing.lg, gap: spacing.md },
  profileItem: { alignItems: 'center', width: 72 },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  addAvatar: { backgroundColor: colors.surface, borderColor: colors.border, borderStyle: 'dashed' },
  profileInitial: { color: colors.onPrimary, fontSize: 24, fontWeight: '900' },
  kidsTag: { position: 'absolute', bottom: 3, color: colors.onPrimary, fontSize: 8, fontWeight: '900' },
  profileName: { color: colors.textMuted, fontSize: 12, fontWeight: '600', marginTop: 5 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { color: colors.text, fontSize: 15, fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rowValue: { color: colors.textMuted, fontSize: 14 },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 64 },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  signOutText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  version: { color: colors.textFaint, fontSize: 12, textAlign: 'center', marginTop: spacing.lg },
});
