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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { forgotPassword, resetPassword } from '../../lib/api';
import { Field, PrimaryButton } from './ui';

// Two-step reset. The self-hosted backend has no mail server, so step 1 hands the
// reset token straight back and we pre-fill it for step 2 (real apps email it).
export default function ForgotPasswordScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const { markAuthed } = useAuth();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const request = async () => {
    setBusy(true); setError(null); setNotice(null);
    try {
      const tok = await forgotPassword(email.trim());
      if (tok) {
        setResetToken(tok);
        setNotice('Reset token issued. Enter a new password below.');
      } else {
        setNotice('If that email exists, a reset link was sent.');
      }
      setStep('reset');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true); setError(null);
    try {
      await resetPassword(resetToken.trim(), newPassword);
      markAuthed(); // reset endpoint signs us in
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#13241b', colors.background, colors.background]} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[styles.body, { paddingTop: insets.top + spacing.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.back} onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back to sign in">
            <Ionicons name="chevron-back" size={24} color={colors.text} />
            <Text style={styles.backText}>Sign in</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.sub}>
            {step === 'request'
              ? 'Enter the email on your account to get a reset token.'
              : 'Choose a new password for your account.'}
          </Text>

          <View style={styles.form}>
            {step === 'request' ? (
              <Field
                label="Email" placeholder="you@example.com"
                autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail}
              />
            ) : (
              <>
                <Field label="Reset token" placeholder="paste token" autoCapitalize="none"
                  value={resetToken} onChangeText={setResetToken} />
                <Field label="New password" placeholder="at least 8 characters"
                  secureTextEntry value={newPassword} onChangeText={setNewPassword} />
              </>
            )}

            {notice && <Text style={styles.notice}>{notice}</Text>}
            {error && <Text style={styles.error}>{error}</Text>}

            {step === 'request' ? (
              <PrimaryButton label="Send reset token" loading={busy} disabled={email.trim().length < 3} onPress={request} />
            ) : (
              <PrimaryButton label="Set new password & sign in" loading={busy}
                disabled={resetToken.trim().length < 4 || newPassword.length < 8} onPress={reset} />
            )}
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
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: spacing.xl },
  backText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  title: { color: colors.text, fontSize: 28, fontWeight: '900' },
  sub: { color: colors.textMuted, fontSize: 14, marginTop: spacing.sm, marginBottom: spacing.xl, lineHeight: 20 },
  form: { gap: spacing.lg },
  notice: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 13, fontWeight: '600' },
});
