import { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View, type PressableProps, type ViewProps } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from './themed-text';

export function Card({ style, children, ...rest }: PropsWithChildren<ViewProps>) {
  const t = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: t.backgroundElement }, style]} {...rest}>
      {children}
    </View>
  );
}

type ButtonProps = PressableProps & { title: string; variant?: 'primary' | 'secondary' | 'danger' };

export function Button({ title, variant = 'primary', style, disabled, ...rest }: ButtonProps) {
  const t = useTheme();
  const bg = variant === 'primary' ? t.tint : variant === 'danger' ? t.danger : t.backgroundSelected;
  const fg = variant === 'secondary' ? t.text : '#fff';
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
        typeof style === 'function' ? undefined : style,
      ]}
      {...rest}>
      <ThemedText style={{ color: fg, fontWeight: '700' }}>{title}</ThemedText>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: selected ? t.tint : t.backgroundElement, borderColor: selected ? t.tint : t.border },
      ]}>
      <ThemedText type="small" style={{ color: selected ? '#fff' : t.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function SectionTitle({ children }: PropsWithChildren) {
  return (
    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
      {children}
    </ThemedText>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <ThemedText type="subtitle" style={{ fontSize: 24, lineHeight: 30 }}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
    </View>
  );
}

export function Checkbox({ checked, onPress }: { checked: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={[
        styles.checkbox,
        { borderColor: checked ? t.success : t.border, backgroundColor: checked ? t.success : 'transparent' },
      ]}>
      {checked ? <ThemedText style={{ color: '#fff', fontWeight: '800', lineHeight: 20 }}>✓</ThemedText> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  button: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.four,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  sectionTitle: { textTransform: 'uppercase', letterSpacing: 0.6, marginTop: Spacing.three },
  stat: { flex: 1, gap: 2 },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
