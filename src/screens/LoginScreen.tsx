import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signInPassword, register, signInGuest } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        <View style={[styles.body, { paddingTop: insets.top + spacing.xxl }]}>
          <Text style={styles.brand}>STREAM<Text style={{ color: colors.primary }}>X</Text></Text>
          <Text style={styles.tagline}>Movies & series, anywhere.</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input} placeholder="Email" placeholderTextColor={colors.textFaint}
              autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail}
            />
            <TextInput
              style={styles.input} placeholder="Password" placeholderTextColor={colors.textFaint}
              secureTextEntry value={password} onChangeText={setPassword}
            />
            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85} disabled={busy}
              onPress={() => run(() => (mode === 'login' ? signInPassword(email.trim(), password) : register(email.trim(), password)))}>
              {busy ? <ActivityIndicator color={colors.onPrimary} />
                : <Text style={styles.primaryText}>{mode === 'login' ? 'Sign in' : 'Create account'}</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}>
              <Text style={styles.switch}>
                {mode === 'login' ? "No account? Register" : 'Have an account? Sign in'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}><View style={styles.line} /><Text style={styles.or}>or</Text><View style={styles.line} /></View>

            <TouchableOpacity style={styles.guestBtn} activeOpacity={0.85} disabled={busy} onPress={() => run(signInGuest)}>
              <Text style={styles.guestText}>Continue as guest</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  body: { flex: 1, paddingHorizontal: spacing.xl },
  brand: { color: colors.text, fontSize: 40, fontWeight: '900', letterSpacing: 1, textAlign: 'center', marginTop: spacing.xxl },
  tagline: { color: colors.textMuted, fontSize: 15, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.xxl },
  form: { gap: spacing.md },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, color: colors.text, fontSize: 16,
  },
  error: { color: '#FF6B6B', fontSize: 13, fontWeight: '600' },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  primaryText: { color: colors.onPrimary, fontSize: 16, fontWeight: '800' },
  switch: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: spacing.sm },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.lg },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  or: { color: colors.textFaint, fontSize: 13 },
  guestBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  guestText: { color: colors.text, fontSize: 16, fontWeight: '700' },
});
