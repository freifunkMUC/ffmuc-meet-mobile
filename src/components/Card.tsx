import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { makeStyles, radius, spacing } from '../theme';

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}) {
  const s = useStyles();
  return <View style={[s.card, style]}>{children}</View>;
}

const useStyles = makeStyles(c =>
  StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderRadius: radius,
      borderWidth: c.cardBorder,
      borderColor: c.border,
      ...c.elevation,
      padding: spacing.m,
      marginBottom: spacing.m,
    },
  }),
);
