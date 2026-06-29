import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { Checkbox, Field, PrimaryButton } from './ui';

export default function LoginScreen({
  onRegister,
  onForgot,
}: {
  onRegister: () => void;
  onForgot: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { signInPassword, signInGuest } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setError(null);
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#13241b', colors.background, colors.background]} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[styles.body, { paddingTop: insets.top + spacing.xxl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.brand}>STREAM<Text style={{ color: colors.primary }}>X</Text></Text>
          <Text style={styles.tagline}>Movies & series, anywhere.</Text>

          <View style={styles.form}>
            <Field
              label="Email or username" placeholder="you@example.com"
              autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail}
            />
            <Field
              label="Password" placeholder="••••••••"
              secureTextEntry value={password} onChangeText={setPassword}
            />

            <View style={styles.rememberRow}>
              <Checkbox checked={remember} onToggle={() => setRemember(!remember)} label="Keep me signed in" />
              <TouchableOpacity onPress={onForgot} hitSlop={8}>
                <Text style={styles.forgot}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <PrimaryButton label="Sign in" loading={busy}
              onPress={() => run(() => signInPassword(email.trim(), password, remember))} />

            <TouchableOpacity onPress={onRegister} hitSlop={8}>
              <Text style={styles.switch}>No account? <Text style={styles.switchAccent}>Create one</Text></Text>
            </TouchableOpacity>

            <View style={styles.divider}><View style={styles.line} /><Text style={styles.or}>or</Text><View style={styles.line} /></View>

            <TouchableOpacity style={styles.guestBtn} activeOpacity={0.85} disabled={busy} onPress={() => run(signInGuest)}>
              <Text style={styles.guestText}>Continue as guest</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  brand: { color: colors.text, fontSize: 40, fontWeight: '900', letterSpacing: 1, textAlign: 'center', marginTop: spacing.xxl },
  tagline: { color: colors.textMuted, fontSize: 15, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.xxl },
  form: { gap: spacing.lg },
  rememberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  forgot: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  switch: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  switchAccent: { color: colors.primary, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  or: { color: colors.textFaint, fontSize: 13 },
  guestBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  guestText: { color: colors.text, fontSize: 16, fontWeight: '700' },
});
