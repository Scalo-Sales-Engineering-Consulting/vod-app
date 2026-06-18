import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import {
  checkEmailAvailable,
  checkUsernameAvailable,
  fetchPlans,
  registerFull,
  subscribe,
  type Plan,
  type PaymentMethod,
} from '../../lib/api';
import { Checkbox, Field, PrimaryButton } from './ui';

const STEPS = ['Account', 'About you', 'Plan', 'Payment'];
const COUNTRIES = ['Poland', 'Germany', 'United Kingdom', 'United States', 'Spain', 'Other'];

type Form = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  isKids: boolean;
  tos: boolean;
  marketing: boolean;
  birthdate: string; // YYYY-MM-DD
  country: string;
  plan: string;
  method: PaymentMethod;
  cardNumber: string;
  cardExp: string;
  cardCvc: string;
  giftCode: string;
};

const emptyForm: Form = {
  fullName: '', username: '', email: '', password: '', isKids: false, tos: false, marketing: false,
  birthdate: '', country: 'Poland', plan: '', method: 'card',
  cardNumber: '', cardExp: '', cardCvc: '', giftCode: '',
};

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// Valid YYYY-MM-DD and at least 13 years old.
function birthdateOk(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const age = (now.getTime() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
  return age >= 13 && age < 120;
}

export default function RegisterWizard({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const { markAuthed } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(emptyForm);
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  // submission / result
  const registered = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const submit = async () => {
    setSubmitting(true);
    try {
      if (!registered.current) {
        await registerFull({
          email: form.email.trim(),
          password: form.password,
          username: form.username.trim(),
          full_name: form.fullName.trim(),
          birthdate: form.birthdate,
          country: form.country,
          marketing_opt_in: form.marketing,
          is_kids: form.isKids,
        });
        registered.current = true;
      }
      const msg = await subscribe({
        plan: form.plan,
        payment_method: form.method,
        card_number: form.method === 'card' ? form.cardNumber : undefined,
        card_exp: form.method === 'card' ? form.cardExp : undefined,
        card_cvc: form.method === 'card' ? form.cardCvc : undefined,
        gift_code: form.method === 'gift' ? form.giftCode : undefined,
      });
      setResult({ ok: true, message: msg });
    } catch (e) {
      setResult({ ok: false, message: e instanceof Error ? e.message : String(e) });
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <ResultScreen
        result={result}
        plan={form.plan}
        onContinue={markAuthed}
        onRetry={() => { setResult(null); setStep(3); }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#13241b', colors.background, colors.background]} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <TouchableOpacity onPress={() => (step === 0 ? onBack() : setStep(step - 1))} hitSlop={10}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.stepLabel}>Step {step + 1} of {STEPS.length} · {STEPS[step]}</Text>
          <View style={{ width: 26 }} />
        </View>
        <View style={styles.progress}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.progressSeg, i <= step && styles.progressOn]} />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 0 && <AccountStep form={form} set={set} onNext={() => setStep(1)} />}
          {step === 1 && <AboutStep form={form} set={set} onNext={() => setStep(2)} />}
          {step === 2 && <PlanStep form={form} set={set} onNext={() => setStep(3)} />}
          {step === 3 && <PaymentStep form={form} set={set} submitting={submitting} onSubmit={submit} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ---- Step 1: account ----

function AccountStep({ form, set, onNext }: { form: Form; set: (p: Partial<Form>) => void; onNext: () => void }) {
  const [emailFree, setEmailFree] = useState<boolean | null>(null);
  const [userFree, setUserFree] = useState<boolean | null>(null);
  const [checking, setChecking] = useState<{ email: boolean; user: boolean }>({ email: false, user: false });

  // Debounced availability checks.
  useEffect(() => {
    if (!emailOk(form.email.trim())) { setEmailFree(null); return; }
    setChecking((c) => ({ ...c, email: true }));
    const t = setTimeout(async () => {
      const ok = await checkEmailAvailable(form.email.trim());
      setEmailFree(ok); setChecking((c) => ({ ...c, email: false }));
    }, 450);
    return () => clearTimeout(t);
  }, [form.email]);

  useEffect(() => {
    if (form.username.trim().length < 3) { setUserFree(null); return; }
    setChecking((c) => ({ ...c, user: true }));
    const t = setTimeout(async () => {
      const ok = await checkUsernameAvailable(form.username.trim());
      setUserFree(ok); setChecking((c) => ({ ...c, user: false }));
    }, 450);
    return () => clearTimeout(t);
  }, [form.username]);

  const emailHint = !form.email ? undefined
    : !emailOk(form.email.trim()) ? 'Enter a valid email'
    : checking.email ? 'Checking…'
    : emailFree === false ? 'Email already registered'
    : emailFree ? 'Email available' : undefined;
  const userHint = !form.username ? 'At least 3 characters'
    : form.username.trim().length < 3 ? 'At least 3 characters'
    : checking.user ? 'Checking…'
    : userFree === false ? 'Username taken'
    : userFree ? 'Username available' : undefined;

  const canNext =
    form.fullName.trim().length > 1 &&
    form.username.trim().length >= 3 && userFree !== false &&
    emailOk(form.email.trim()) && emailFree !== false &&
    form.password.length >= 8 &&
    form.tos;

  const hintColor = (free: boolean | null, bad: boolean) =>
    bad ? '#FF6B6B' : free === true ? colors.primary : free === false ? '#FF6B6B' : colors.textFaint;

  return (
    <View style={styles.step}>
      <Text style={styles.title}>Create your account</Text>
      <Field label="Full name" placeholder="Jane Doe" value={form.fullName} onChangeText={(t) => set({ fullName: t })} />
      <Field
        label="Username" placeholder="janedoe" autoCapitalize="none"
        value={form.username} onChangeText={(t) => set({ username: t.replace(/\s/g, '') })}
        hint={userHint} hintColor={hintColor(userFree, false)}
      />
      <Field
        label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address"
        value={form.email} onChangeText={(t) => set({ email: t })}
        hint={emailHint} hintColor={hintColor(emailFree, !!form.email && !emailOk(form.email.trim()))}
      />
      <Field
        label="Password" placeholder="at least 8 characters" secureTextEntry
        value={form.password} onChangeText={(t) => set({ password: t })}
        hint={form.password && form.password.length < 8 ? 'Too short' : undefined}
        hintColor="#FF6B6B"
      />

      <Text style={styles.fieldLabel}>Profile type</Text>
      <View style={styles.segment}>
        {[{ k: false, label: 'Adult', icon: 'person' }, { k: true, label: 'Kids', icon: 'happy' }].map((o) => {
          const active = form.isKids === o.k;
          return (
            <TouchableOpacity key={o.label} style={[styles.segBtn, active && styles.segOn]} onPress={() => set({ isKids: o.k })}>
              <Ionicons name={o.icon as any} size={16} color={active ? colors.onPrimary : colors.textMuted} />
              <Text style={[styles.segText, active && styles.segTextOn]}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.note}>Kids profiles only see age-appropriate titles. You can add more profiles later.</Text>

      <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
        <Checkbox checked={form.tos} onToggle={() => set({ tos: !form.tos })}
          label="I agree to the Terms of Service and Privacy Policy." />
        <Checkbox checked={form.marketing} onToggle={() => set({ marketing: !form.marketing })}
          label="Send me news and special offers by email (optional)." />
      </View>

      <PrimaryButton label="Continue" disabled={!canNext} onPress={onNext} />
    </View>
  );
}

// ---- Step 2: about you ----

function AboutStep({ form, set, onNext }: { form: Form; set: (p: Partial<Form>) => void; onNext: () => void }) {
  // Auto-format digits into YYYY-MM-DD as the user types.
  const onBirth = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 8);
    let out = d.slice(0, 4);
    if (d.length > 4) out += '-' + d.slice(4, 6);
    if (d.length > 6) out += '-' + d.slice(6, 8);
    set({ birthdate: out });
  };
  const bad = !!form.birthdate && form.birthdate.length === 10 && !birthdateOk(form.birthdate);
  const canNext = birthdateOk(form.birthdate) && !!form.country;

  return (
    <View style={styles.step}>
      <Text style={styles.title}>A bit about you</Text>
      <Text style={styles.note}>We use your date of birth to keep age-appropriate content in front of the right viewers.</Text>
      <Field
        label="Date of birth" placeholder="YYYY-MM-DD" keyboardType="number-pad"
        value={form.birthdate} onChangeText={onBirth}
        hint={bad ? 'Enter a valid date (you must be 13+)' : undefined} hintColor="#FF6B6B"
      />

      <Text style={styles.fieldLabel}>Country</Text>
      <View style={styles.chips}>
        {COUNTRIES.map((c) => {
          const active = form.country === c;
          return (
            <TouchableOpacity key={c} style={[styles.chip, active && styles.chipOn]} onPress={() => set({ country: c })}>
              <Text style={[styles.chipText, active && styles.chipTextOn]}>{c}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <PrimaryButton label="Continue" disabled={!canNext} onPress={onNext} />
    </View>
  );
}

// ---- Step 3: plan ----

function PlanStep({ form, set, onNext }: { form: Form; set: (p: Partial<Form>) => void; onNext: () => void }) {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchPlans().then((p) => { if (alive) { setPlans(p); if (!form.plan && p[1]) set({ plan: p[1].id }); } })
      .catch(() => { if (alive) setErr(true); });
    return () => { alive = false; };
  }, []);

  if (err) return <View style={styles.step}><Text style={styles.title}>Choose your plan</Text><Text style={styles.error}>Couldn’t load plans. Check your connection.</Text></View>;
  if (!plans) return <View style={[styles.step, { alignItems: 'center', paddingTop: spacing.xxl }]}><ActivityIndicator color={colors.primary} size="large" /></View>;

  return (
    <View style={styles.step}>
      <Text style={styles.title}>Choose your plan</Text>
      <Text style={styles.note}>Switch or cancel anytime. Prices shown per month.</Text>
      {plans.map((p) => {
        const active = form.plan === p.id;
        return (
          <TouchableOpacity key={p.id} activeOpacity={0.9} onPress={() => set({ plan: p.id })}
            style={[styles.planCard, active && styles.planCardOn]}>
            <View style={styles.planTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.planName}>{p.name}</Text>
                <Text style={styles.planQuality}>{p.quality_label}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.planPrice}>{p.price.toFixed(0)} {p.currency}</Text>
                <Text style={styles.planPeriod}>/ {p.period}</Text>
              </View>
              <View style={[styles.radio, active && styles.radioOn]}>
                {active && <Ionicons name="checkmark" size={14} color={colors.onPrimary} />}
              </View>
            </View>
            <Text style={styles.planTagline}>{p.tagline}</Text>
            <View style={styles.specs}>
              <Spec icon="tv" text={`${p.resolution} · ${p.quality_label}`} />
              <Spec icon="volume-high" text={p.audio} />
              <Spec icon="people" text={`Watch on ${p.max_screens} screen${p.max_screens > 1 ? 's' : ''} at once`} />
              <Spec icon="download" text={`Downloads on ${p.download_devices} device${p.download_devices > 1 ? 's' : ''}`} />
              <Spec icon="phone-portrait" text={p.devices.join(', ')} />
            </View>
          </TouchableOpacity>
        );
      })}
      <PrimaryButton label="Continue to payment" disabled={!form.plan} onPress={onNext} />
    </View>
  );
}

function Spec({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.specRow}>
      <Ionicons name={icon as any} size={15} color={colors.primary} />
      <Text style={styles.specText}>{text}</Text>
    </View>
  );
}

// ---- Step 4: payment ----

function PaymentStep({
  form, set, submitting, onSubmit,
}: {
  form: Form; set: (p: Partial<Form>) => void; submitting: boolean; onSubmit: () => void;
}) {
  const onCard = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 16);
    set({ cardNumber: d.replace(/(.{4})/g, '$1 ').trim() });
  };
  const onExp = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 4);
    set({ cardExp: d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d });
  };
  const cardDigits = form.cardNumber.replace(/\s/g, '');
  const canPay =
    form.method === 'paypal' ||
    (form.method === 'card' && cardDigits.length === 16 && form.cardExp.length === 5 && form.cardCvc.length >= 3) ||
    (form.method === 'gift' && form.giftCode.trim().length >= 4);

  const methods: { k: PaymentMethod; label: string; icon: string }[] = [
    { k: 'card', label: 'Card', icon: 'card' },
    { k: 'paypal', label: 'PayPal', icon: 'logo-paypal' },
    { k: 'gift', label: 'Gift code', icon: 'gift' },
  ];

  return (
    <View style={styles.step}>
      <Text style={styles.title}>Payment method</Text>
      <View style={styles.methodRow}>
        {methods.map((m) => {
          const active = form.method === m.k;
          return (
            <TouchableOpacity key={m.k} style={[styles.methodBtn, active && styles.methodOn]} onPress={() => set({ method: m.k })}>
              <Ionicons name={m.icon as any} size={20} color={active ? colors.onPrimary : colors.textMuted} />
              <Text style={[styles.methodText, active && styles.methodTextOn]}>{m.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {form.method === 'card' && (
        <>
          <Field label="Card number" placeholder="4242 4242 4242 4242" keyboardType="number-pad"
            value={form.cardNumber} onChangeText={onCard} />
          <View style={styles.cardRow}>
            <View style={{ flex: 1 }}>
              <Field label="Expiry" placeholder="MM/YY" keyboardType="number-pad" value={form.cardExp} onChangeText={onExp} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="CVC" placeholder="123" keyboardType="number-pad" secureTextEntry
                value={form.cardCvc} onChangeText={(t) => set({ cardCvc: t.replace(/\D/g, '').slice(0, 4) })} />
            </View>
          </View>
          <View style={styles.testBox}>
            <Ionicons name="flask" size={14} color={colors.textFaint} />
            <Text style={styles.testText}>Test cards: 4242 4242 4242 4242 succeeds · 4000 0000 0000 0002 is declined.</Text>
          </View>
        </>
      )}

      {form.method === 'paypal' && (
        <View style={styles.paypalBox}>
          <Ionicons name="logo-paypal" size={28} color="#0070BA" />
          <Text style={styles.note}>You’ll complete a sandbox PayPal checkout. No real charge — this always approves in test mode.</Text>
        </View>
      )}

      {form.method === 'gift' && (
        <>
          <Field label="Gift / promo code" placeholder="VODFLIX2026" autoCapitalize="characters"
            value={form.giftCode} onChangeText={(t) => set({ giftCode: t })} />
          <View style={styles.testBox}>
            <Ionicons name="flask" size={14} color={colors.textFaint} />
            <Text style={styles.testText}>Test code: VODFLIX2026 redeems successfully.</Text>
          </View>
        </>
      )}

      <PrimaryButton label="Start subscription" disabled={!canPay} loading={submitting} onPress={onSubmit} />
      <Text style={styles.disclaimer}>Stub checkout — no real payment is processed.</Text>
    </View>
  );
}

// ---- Result ----

function ResultScreen({
  result, plan, onContinue, onRetry,
}: {
  result: { ok: boolean; message: string }; plan: string; onContinue: () => void; onRetry: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, styles.resultWrap, { paddingTop: insets.top }]}>
      <LinearGradient colors={[result.ok ? '#13241b' : '#2a1414', colors.background, colors.background]} style={StyleSheet.absoluteFill} />
      <View style={[styles.resultIcon, { backgroundColor: result.ok ? colors.primary : '#FF6B6B' }]}>
        <Ionicons name={result.ok ? 'checkmark' : 'close'} size={56} color={result.ok ? colors.onPrimary : '#2a0d0d'} />
      </View>
      <Text style={styles.resultTitle}>{result.ok ? 'You’re all set!' : 'Payment failed'}</Text>
      <Text style={styles.resultMsg}>{result.message}</Text>
      {result.ok && <Text style={styles.resultSub}>Your {plan} subscription is active. Enjoy the show.</Text>}
      <View style={{ alignSelf: 'stretch', marginTop: spacing.md }}>
        {result.ok ? (
          <PrimaryButton label="Start watching" onPress={onContinue} />
        ) : (
          <PrimaryButton label="Try another method" onPress={onRetry} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  stepLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  progress: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  progressSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  progressOn: { backgroundColor: colors.primary },
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  step: { gap: spacing.lg },
  title: { color: colors.text, fontSize: 26, fontWeight: '900' },
  note: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  error: { color: '#FF6B6B', fontSize: 14, fontWeight: '600' },
  fieldLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  segment: { flexDirection: 'row', gap: spacing.md },
  segBtn: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  segOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  segText: { color: colors.textMuted, fontSize: 15, fontWeight: '700' },
  segTextOn: { color: colors.onPrimary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  chipTextOn: { color: colors.onPrimary, fontWeight: '700' },
  planCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, padding: spacing.lg, gap: spacing.sm },
  planCardOn: { borderColor: colors.primary, backgroundColor: colors.surfaceAlt },
  planTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  planName: { color: colors.text, fontSize: 20, fontWeight: '900' },
  planQuality: { color: colors.primary, fontSize: 13, fontWeight: '700', marginTop: 2 },
  planPrice: { color: colors.text, fontSize: 20, fontWeight: '900' },
  planPeriod: { color: colors.textFaint, fontSize: 12 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  planTagline: { color: colors.textMuted, fontSize: 13 },
  specs: { gap: 6, marginTop: spacing.sm },
  specRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  specText: { color: colors.textMuted, fontSize: 13, flex: 1 },
  methodRow: { flexDirection: 'row', gap: spacing.sm },
  methodBtn: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  methodOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  methodText: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  methodTextOn: { color: colors.onPrimary },
  cardRow: { flexDirection: 'row', gap: spacing.md },
  testBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.sm, padding: spacing.md },
  testText: { color: colors.textFaint, fontSize: 12, flex: 1, lineHeight: 17 },
  paypalBox: { alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.xl },
  disclaimer: { color: colors.textFaint, fontSize: 12, textAlign: 'center' },
  resultWrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.lg },
  resultIcon: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { color: colors.text, fontSize: 28, fontWeight: '900', textAlign: 'center' },
  resultMsg: { color: colors.textMuted, fontSize: 15, textAlign: 'center', lineHeight: 21 },
  resultSub: { color: colors.textFaint, fontSize: 13, textAlign: 'center' },
});
