import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing } from '../theme';

interface Props {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  busy?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function Button({
  title,
  onPress,
  kind = 'primary',
  disabled,
  busy,
  style,
  testID,
}: Props) {
  const off = disabled || busy;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!busy }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[kind],
        pressed && styles.pressed,
        off && styles.disabled,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text
          style={[styles.text, kind === 'secondary' && styles.textSecondary]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius,
    paddingHorizontal: spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.accent },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: { backgroundColor: colors.danger },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
  text: { color: '#fff', fontSize: 16, fontWeight: '600' },
  textSecondary: { color: colors.text },
});
