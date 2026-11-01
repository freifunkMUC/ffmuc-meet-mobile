import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDuration } from '../format';
import { accentGradient, makeStyles, smallRadius, spacing } from '../theme';

export function DurationPicker({
  durations,
  value,
  onChange,
  disabled,
}: {
  durations: number[];
  value: number;
  onChange: (h: number) => void;
  disabled?: boolean;
}) {
  const s = useStyles();
  return (
    <View style={s.row} accessibilityRole="radiogroup">
      {durations.map(h => {
        const on = h === value;
        return (
          <Pressable
            key={h}
            accessibilityRole="radio"
            accessibilityState={{ checked: on, disabled }}
            disabled={disabled}
            onPress={() => onChange(h)}
            style={[s.chip, on && s.chipOn]}
          >
            <Text style={[s.text, on && s.textOn]}>{formatDuration(h)}</Text>
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
