import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { t } from '../i18n';
import { makeStyles, spacing } from '../theme';

/** ratio 0..1 while working, 1 while the request is sent. */
export function PowProgress({ ratio }: { ratio: number }) {
  const s = useStyles();
  const done = ratio >= 1;
  const percent = Math.min(99, Math.floor(ratio * 100));
  return (
    <View
      style={s.box}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: done ? 100 : percent }}
    >
      <View style={s.track}>
        <View style={[s.bar, { width: `${done ? 100 : percent}%` }]} />
      </View>
      <Text style={s.text}>
        {done ? t('pow.sending') : t('pow.working', { percent })}
      </Text>
    </View>
  );
}

const useStyles = makeStyles(c =>
  StyleSheet.create({
    box: { marginTop: spacing.m },
    track: {
      height: 8,
      borderRadius: 4,
      backgroundColor: c.surface,
      overflow: 'hidden',
    },
    bar: {
      height: 8,
      backgroundColor: c.accent,
      experimental_backgroundImage: `linear-gradient(90deg, ${c.accent}, ${c.accent2})`,
    },
    text: { color: c.textMuted, marginTop: spacing.xs },
  }),
);
