import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { makeStyles, spacing } from '../theme';

export function SectionTitle({ children }: { children: string }) {
  const s = useStyles();
  return (
    <Text style={s.title} accessibilityRole="header">
      {children.toUpperCase()}
    </Text>
  );
}

const useStyles = makeStyles(c =>
  StyleSheet.create({
    title: {
      color: c.textMuted,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 1,
      marginTop: spacing.l,
      marginBottom: spacing.s,
    },
  }),
);
