import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '../i18n';
import { makeStyles, spacing } from '../theme';

export function ScreenHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const s = useStyles();
  return (
    <View style={s.row}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={onBack}
          hitSlop={12}
          style={s.back}
        >
          <Text style={s.backText}>‹</Text>
        </Pressable>
      ) : null}
      <Text style={s.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
      {right}
    </View>
  );
}

const useStyles = makeStyles(c =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 48,
      marginBottom: spacing.m,
    },
    back: { paddingRight: spacing.m },
    backText: { color: c.text, fontSize: 34, lineHeight: 36 },
    title: { flex: 1, color: c.text, fontSize: 24, fontWeight: '800' },
  }),
);
