import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, touchTarget, typography } from '../theme';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import {
  cancelSubscription,
  fetchMe,
  fetchPlans,
  subscribe,
  updateAccount,
  type Account,
  type Plan,
} from '../lib/api';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [autoplay, setAutoplay] = useState(true);
  const [downloadWifi, setDownloadWifi] = useState(true);
  const { profiles, activeId, setActive, createProfile, removeProfile } = useProfile();
  const { signOut } = useAuth();

  const [account, setAccount] = useState<Account | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadErr, setLoadErr] = useState(false);

  // Inline edit state for the account fields.
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ full_name: '', username: '', email: '', country: '' });
  const [saving, setSaving] = useState(false);
  const [planPicker, setPlanPicker] = useState(false);
  const [working, setWorking] = useState(false);

  const load = useCallback(() => {
    setLoadErr(false);
    fetchMe().then(setAccount).catch(() => setLoadErr(true));
    fetchPlans().then(setPlans).catch(() => {});
  }, []);

  useEffect(load, [load]);

  const beginEdit = () => {
    if (!account) return;
    setDraft({
      full_name: account.full_name,
      username: account.username ?? '',
      email: account.email,
      country: account.country,
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const patch: any = {};
      if (account) {
        if (draft.full_name !== account.full_name) patch.full_name = draft.full_name.trim();
        if (draft.username !== (account.username ?? '')) patch.username = draft.username.trim();
        if (draft.email !== account.email) patch.email = draft.email.trim();
        if (draft.country !== account.country) patch.country = draft.country.trim();
      }
      const updated = Object.keys(patch).length ? await updateAccount(patch) : account!;
      setAccount(updated);
      setEditing(false);
    } catch (e) {
      Alert.alert('Couldn’t save', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const changePlan = async (planId: string) => {
    setPlanPicker(false);
    setWorking(true);
    try {
      // Stub re-checkout for a plan switch: PayPal sandbox always approves, so the
      // user doesn't have to re-enter card details just to change tier.
      await subscribe({ plan: planId, payment_method: 'paypal' });
      setAccount(await fetchMe());
    } catch (e) {
      Alert.alert('Couldn’t change plan', e instanceof Error ? e.message : String(e));
    } finally {
      setWorking(false);
    }
  };

  const onCancelSub = () => {
    Alert.alert('Cancel subscription', 'You’ll keep access until the period ends.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel subscription',
        style: 'destructive',
        onPress: async () => {
          setWorking(true);
          try {
            await cancelSubscription();
            setAccount(await fetchMe());
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : String(e));
          } finally {
            setWorking(false);
          }
        },
      },
    ]);
  };

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

  const currentPlan = plans.find((p) => p.id === account?.plan);
  const initial = (account?.full_name || account?.username || account?.email || '?').charAt(0).toUpperCase();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: spacing.xxl }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.header}>Settings</Text>

      {/* Account card — real data from /auth/me */}
      {!account && !loadErr && (
        <View style={[styles.card, { padding: spacing.xl, alignItems: 'center', marginHorizontal: spacing.lg }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
      {loadErr && (
        <View style={[styles.card, { padding: spacing.lg, marginHorizontal: spacing.lg }]}>
          <Text style={styles.email}>Couldn’t load your account.</Text>
          <TouchableOpacity onPress={load}><Text style={[styles.editLink, { marginTop: spacing.sm }]}>Retry</Text></TouchableOpacity>
        </View>
      )}

      {account && (
        <View style={styles.profile}>
          <View style={styles.avatarCircle}><Text style={styles.avatarInitial}>{initial}</Text></View>
          {editing ? (
            <View style={{ flex: 1, gap: spacing.sm }}>
              <TextInput style={styles.editInput} value={draft.full_name} onChangeText={(t) => setDraft({ ...draft, full_name: t })} placeholder="Full name" placeholderTextColor={colors.textFaint} />
              <TextInput style={styles.editInput} value={draft.username} onChangeText={(t) => setDraft({ ...draft, username: t.replace(/\s/g, '') })} placeholder="Username" autoCapitalize="none" placeholderTextColor={colors.textFaint} />
              <TextInput style={styles.editInput} value={draft.email} onChangeText={(t) => setDraft({ ...draft, email: t })} placeholder="Email" autoCapitalize="none" keyboardType="email-address" placeholderTextColor={colors.textFaint} />
              <TextInput style={styles.editInput} value={draft.country} onChangeText={(t) => setDraft({ ...draft, country: t })} placeholder="Country" placeholderTextColor={colors.textFaint} />
              <View style={styles.editBtns}>
                <TouchableOpacity style={[styles.smallBtn, styles.smallBtnGhost]} onPress={() => setEditing(false)} disabled={saving}>
                  <Text style={styles.smallBtnGhostText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallBtn} onPress={saveEdit} disabled={saving}>
                  <Text style={styles.smallBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{account.full_name || account.username || 'Your account'}</Text>
                <Text style={styles.email}>{account.email}</Text>
                {account.is_guest ? (
                  <View style={[styles.planPill, { backgroundColor: colors.surfaceAlt }]}>
                    <Text style={[styles.planText, { color: colors.textMuted }]}>Guest account</Text>
                  </View>
                ) : (
                  <View style={styles.planPill}>
                    <Ionicons name={account.subscription_active ? 'diamond' : 'alert-circle'} size={11} color={colors.onPrimary} />
                    <Text style={styles.planText}>
                      {account.subscription_active && currentPlan
                        ? `${currentPlan.name} · ${currentPlan.quality_label}`
                        : 'No active plan'}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity hitSlop={12} onPress={beginEdit} accessibilityRole="button" accessibilityLabel="Edit account">
                <Ionicons name="create-outline" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Subscription management */}
      {account && !account.is_guest && (
        <>
          <Text style={styles.section}>Subscription</Text>
          <View style={styles.card}>
            {currentPlan ? (
              <View style={styles.subRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{currentPlan.name}</Text>
                  <Text style={styles.subMeta}>
                    {currentPlan.resolution} · {currentPlan.audio} · {currentPlan.max_screens} screen{currentPlan.max_screens > 1 ? 's' : ''}
                  </Text>
                </View>
                <Text style={styles.subPrice}>{currentPlan.price.toFixed(0)} {currentPlan.currency}/{currentPlan.period}</Text>
              </View>
            ) : (
              <View style={styles.subRow}><Text style={styles.rowLabel}>No active plan</Text></View>
            )}
            <View style={styles.divider} />
            <TouchableOpacity style={styles.row} onPress={() => setPlanPicker(true)} disabled={working}>
              <View style={styles.rowLeft}>
                <View style={styles.iconCircle}><Ionicons name="swap-horizontal" size={18} color={colors.text} /></View>
                <Text style={styles.rowLabel}>{account.subscription_active ? 'Change plan' : 'Choose a plan'}</Text>
              </View>
              {working ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />}
            </TouchableOpacity>
            {account.subscription_active && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.row} onPress={onCancelSub} disabled={working} accessibilityRole="button" accessibilityLabel="Cancel subscription">
                  <View style={styles.rowLeft}>
                    <View style={styles.iconCircle}><Ionicons name="close-circle" size={18} color={colors.danger} /></View>
                    <Text style={[styles.rowLabel, { color: colors.danger }]}>Cancel subscription</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </>
      )}

      {/* Profiles */}
      <Text style={styles.section}>Profiles</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profilesRow}>
        {profiles.map((p) => {
          const activeP = p.id === activeId;
          return (
            <TouchableOpacity key={p.id} activeOpacity={0.85} onPress={() => setActive(p.id)} onLongPress={() => onLongPressProfile(p.id, p.name)} style={styles.profileItem}>
              <View style={[styles.profileAvatar, { backgroundColor: p.avatar || colors.primary, borderColor: activeP ? colors.text : 'transparent' }]}>
                <Text style={styles.profileInitial}>{p.name.charAt(0).toUpperCase()}</Text>
                {p.is_kids && <Text style={styles.kidsTag}>KIDS</Text>}
              </View>
              <Text style={[styles.profileName, activeP && { color: colors.text }]} numberOfLines={1}>{p.name}</Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity activeOpacity={0.85} onPress={onAddProfile} style={styles.profileItem}>
          <View style={[styles.profileAvatar, styles.addAvatar]}><Ionicons name="add" size={28} color={colors.textMuted} /></View>
          <Text style={styles.profileName}>Add</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Playback */}
      <Text style={styles.section}>Playback</Text>
      <View style={styles.card}>
        <SettingRow icon="play-circle" label="Autoplay next episode" toggle on={autoplay} onToggle={setAutoplay} />
        <View style={styles.divider} />
        <SettingRow icon="wifi" label="Download over Wi-Fi only" toggle on={downloadWifi} onToggle={setDownloadWifi} />
      </View>

      <TouchableOpacity style={styles.signOut} activeOpacity={0.85} onPress={signOut} accessibilityRole="button" accessibilityLabel="Sign out">
        <Ionicons name="log-out-outline" size={18} color={colors.primary} />
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
      <Text style={styles.version}>StreamX · v1.0.0</Text>

      {/* Plan picker modal */}
      <Modal visible={planPicker} transparent animationType="slide" onRequestClose={() => setPlanPicker(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Choose a plan</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {plans.map((p) => {
                const active = p.id === account?.plan;
                return (
                  <TouchableOpacity key={p.id} style={[styles.modalPlan, active && styles.modalPlanOn]} onPress={() => changePlan(p.id)}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalPlanName}>{p.name}{active ? ' · current' : ''}</Text>
                      <Text style={styles.subMeta}>{p.resolution} · {p.audio} · {p.max_screens} screen{p.max_screens > 1 ? 's' : ''}</Text>
                    </View>
                    <Text style={styles.subPrice}>{p.price.toFixed(0)} {p.currency}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={[styles.smallBtn, styles.smallBtnGhost, { marginTop: spacing.md }]} onPress={() => setPlanPicker(false)}>
              <Text style={styles.smallBtnGhostText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

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
        <View style={styles.iconCircle}><Ionicons name={icon} size={18} color={colors.text} /></View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      {toggle ? (
        <Switch value={on} onValueChange={onToggle} trackColor={{ true: colors.primary, false: colors.border }} thumbColor={colors.text} />
      ) : (
        <View style={styles.rowRight}>
          {value && <Text style={styles.rowValue}>{value}</Text>}
          <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { color: colors.text, ...typography.h1, paddingHorizontal: spacing.lg },
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, margin: spacing.lg, padding: spacing.lg, borderRadius: radius.lg },
  avatarCircle: { width: 64, height: 64, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: colors.onPrimary, fontSize: 28, fontWeight: '900' },
  name: { color: colors.text, fontSize: 18, fontWeight: '700' },
  email: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  editLink: { color: colors.primary, fontWeight: '700' },
  editInput: { backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, fontSize: 14 },
  editBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: 2 },
  smallBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.sm, minHeight: touchTarget, justifyContent: 'center', paddingVertical: spacing.sm, alignItems: 'center' },
  smallBtnText: { color: colors.onPrimary, fontWeight: '800' },
  smallBtnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  smallBtnGhostText: { color: colors.text, fontWeight: '700' },
  planPill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: colors.primary, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill, marginTop: spacing.sm },
  planText: { color: colors.onPrimary, fontSize: 11, fontWeight: '800' },
  section: { color: colors.textMuted, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.sm },
  card: { backgroundColor: colors.surface, marginHorizontal: spacing.lg, borderRadius: radius.lg, overflow: 'hidden' },
  subRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  subMeta: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
  subPrice: { color: colors.text, fontSize: 14, fontWeight: '700' },
  profilesRow: { paddingHorizontal: spacing.lg, gap: spacing.md },
  profileItem: { alignItems: 'center', width: 72 },
  profileAvatar: { width: 60, height: 60, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  addAvatar: { backgroundColor: colors.surface, borderColor: colors.border, borderStyle: 'dashed' },
  profileInitial: { color: colors.onPrimary, fontSize: 24, fontWeight: '900' },
  kidsTag: { position: 'absolute', bottom: 3, color: colors.onPrimary, fontSize: 8, fontWeight: '900' },
  profileName: { color: colors.textMuted, fontSize: 12, fontWeight: '600', marginTop: 5 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: { width: 34, height: 34, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { color: colors.text, fontSize: 15, fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rowValue: { color: colors.textMuted, fontSize: 14 },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 64 },
  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginHorizontal: spacing.lg, marginTop: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  signOutText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  version: { color: colors.textFaint, fontSize: 12, textAlign: 'center', marginTop: spacing.lg },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, maxHeight: '80%' },
  modalHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: spacing.md },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '900', marginBottom: spacing.md },
  modalPlan: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.sm, borderWidth: 1.5, borderColor: 'transparent' },
  modalPlanOn: { borderColor: colors.primary },
  modalPlanName: { color: colors.text, fontSize: 16, fontWeight: '800' },
});
