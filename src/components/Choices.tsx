import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { accentGradient, makeStyles, smallRadius, spacing } from '../theme';

/** A row of choice chips. One is selected. */
export function Choices<T extends string | number>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  const s = useStyles();
  return (
    <View style={s.row} accessibilityRole="radiogroup">
      {options.map(o => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on, disabled }}
            disabled={disabled}
            onPress={() => onChange(o.value)}
            style={[s.chip, on && s.chipOn]}
          >
            <Text style={[s.text, on && s.textOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles(c =>
  StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s },
    chip: {
      borderRadius: smallRadius,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      paddingHorizontal: spacing.m,
      paddingVertical: 10,
    },
    chipOn: {
      borderColor: c.accent,
      backgroundColor: c.accent,
      experimental_backgroundImage: accentGradient(c),
    },
    text: { color: c.text, fontSize: 15 },
    textOn: { color: '#ffffff', fontWeight: '700' },
  }),
);
