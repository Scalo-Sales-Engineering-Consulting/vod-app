// Small shared building blocks for the pre-auth screens (login + wizard).
import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';

export function Field({
  label,
  hint,
  hintColor,
  right,
  ...props
}: TextInputProps & { label: string; hint?: string; hintColor?: string; right?: React.ReactNode }) {
  return (
    <View style={ui.fieldWrap}>
      <Text style={ui.label}>{label}</Text>
      <View style={ui.inputRow}>
        <TextInput
          style={ui.input}
          placeholderTextColor={colors.textFaint}
          {...props}
        />
        {right}
      </View>
      {!!hint && <Text style={[ui.hint, hintColor ? { color: hintColor } : null]}>{hint}</Text>}
    </View>
  );
}

export function Checkbox({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <TouchableOpacity style={ui.cbRow} activeOpacity={0.8} onPress={onToggle}>
      <View style={[ui.cbBox, checked && ui.cbBoxOn]}>
        {checked && <Ionicons name="checkmark" size={14} color={colors.onPrimary} />}
      </View>
      <Text style={ui.cbLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[ui.btn, (disabled || loading) && ui.btnDisabled]}
      activeOpacity={0.85}
      disabled={disabled || loading}
      onPress={onPress}
    >
      <Text style={ui.btnText}>{loading ? 'Please wait…' : label}</Text>
    </TouchableOpacity>
  );
}

const ui = StyleSheet.create({
  fieldWrap: { gap: 6 },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingRight: spacing.md,
  },
  input: { flex: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, color: colors.text, fontSize: 16 },
  hint: { fontSize: 12, color: colors.textFaint },
  cbRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  cbBox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  cbBoxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  cbLabel: { flex: 1, color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  btn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: colors.onPrimary, fontSize: 16, fontWeight: '800' },
});
