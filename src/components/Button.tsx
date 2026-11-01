import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {
  accentGradient,
  makeStyles,
  smallRadius,
  spacing,
  useTheme,
} from '../theme';

interface Props {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'danger';
  /** One line below the title. */
  hint?: string;
  disabled?: boolean;
  busy?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function Button({
  title,
  onPress,
  kind = 'primary',
  hint,
  disabled,
  busy,
  style,
  testID,
}: Props) {
  const c = useTheme();
  const s = useStyles();
  const off = disabled || busy;
  const onColor = kind === 'secondary' ? c.text : '#ffffff';
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!off, busy: !!busy }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [
        s.base,
        s[kind],
        pressed && s.pressed,
        off && s.disabled,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={onColor} />
      ) : (
        <View style={s.center}>
          <Text style={[s.text, { color: onColor }]}>{title}</Text>
          {hint ? (
            <Text
              style={[s.hint, kind === 'secondary' ? s.hintMuted : s.hintOn]}
            >
              {hint}
            </Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const useStyles = makeStyles(c =>
  StyleSheet.create({
    base: {
      minHeight: 52,
      borderRadius: smallRadius,
      paddingHorizontal: spacing.m,
      paddingVertical: spacing.s,
      alignItems: 'center',
      justifyContent: 'center',
    },
    center: { alignItems: 'center' },
    primary: {
      backgroundColor: c.accent,
      experimental_backgroundImage: accentGradient(c),
    },
    secondary: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    danger: { backgroundColor: c.danger },
    pressed: { opacity: 0.85 },
    disabled: { opacity: 0.55 },
    // 18 px bold: AA "large text" (3:1) also on the light gradient end.
    text: { fontSize: 18, fontWeight: '700' },
    hint: { fontSize: 13, marginTop: 2, textAlign: 'center' },
    hintOn: { color: '#ffffff' },
    hintMuted: { color: c.textMuted },
  }),
);
