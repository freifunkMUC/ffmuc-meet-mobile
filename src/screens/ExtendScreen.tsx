import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { PowForm } from '../components/PowForm';
import { ScreenHeader } from '../components/ScreenHeader';
import { formatDate } from '../format';
import { t } from '../i18n';
import { clientFor } from '../join';
import { useNavigation } from '../navigation';
import { StoredRoom, getRoom, saveRoomView } from '../storage/rooms';
import { makeStyles, spacing } from '../theme';

export function ExtendScreen({ room }: { room: string }) {
  const nav = useNavigation();
  const styles = useStyles();
  const [stored, setStored] = useState<StoredRoom | null>();

  useEffect(() => {
    getRoom(room).then(r => setStored(r ?? null));
  }, [room]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ScreenHeader title={t('extend.title', { room })} onBack={nav.pop} />
      {stored === null ? (
        <Text style={styles.error}>{t('room.gone')}</Text>
      ) : stored ? (
        <>
          <Text style={styles.muted}>
            {t('extend.current', { date: formatDate(stored.expires) })}
          </Text>
          <PowForm
            submitLabel={t('extend.submit')}
            info={t('create.info')}
            run={(hours, opts) => clientFor().extend(stored.key, hours, opts)}
            onDone={async view => {
              await saveRoomView(view);
              nav.pop();
            }}
          />
        </>
      ) : null}
    </ScrollView>
  );
}

const useStyles = makeStyles(colors =>
  StyleSheet.create({
    container: { padding: spacing.m },
    muted: { color: colors.textMuted, marginBottom: spacing.m },
    error: { color: colors.danger },
  }),
);
