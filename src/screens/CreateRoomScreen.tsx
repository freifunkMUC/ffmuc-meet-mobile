import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { PowForm } from '../components/PowForm';
import { ScreenHeader } from '../components/ScreenHeader';
import { t } from '../i18n';
import { clientFor } from '../join';
import { useNavigation } from '../navigation';
import { saveRoomView } from '../storage/rooms';
import { makeStyles, spacing } from '../theme';

export function CreateRoomScreen() {
  const nav = useNavigation();
  const styles = useStyles();
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ScreenHeader title={t('create.title')} onBack={nav.pop} />
      <PowForm
        submitLabel={t('create.submit')}
        info={t('create.info')}
        run={(hours, opts) => clientFor().reserve(hours, opts)}
        onDone={async view => {
          const r = await saveRoomView(view);
          nav.reset({ name: 'rooms' }, { name: 'room', room: r.room });
        }}
      />
    </ScrollView>
  );
}

const useStyles = makeStyles(() =>
  StyleSheet.create({
    container: { padding: spacing.m },
  }),
);
