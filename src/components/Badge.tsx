import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { t } from '../i18n';
import type { LinkRole } from '../join';
import { BadgeKind, useTheme } from '../theme';

/** Role badge as on the reserve web page: host pink, speaker yellow, viewer grey. */
export function Badge({ role }: { role: LinkRole }) {
  const c = useTheme();
  const kind: BadgeKind = role === 'open' ? 'viewer' : role;
  const { bg, fg } = c.badge[kind];
  return (
    <Text style={[styles.badge, { backgroundColor: bg, color: fg }]}>
      {t(`role.${role}`).toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 99,
    overflow: 'hidden',
  },
});
