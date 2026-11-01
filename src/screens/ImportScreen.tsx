import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { Button } from '../components/Button';
import { ScreenHeader } from '../components/ScreenHeader';
import { errorText } from '../errors';
import { t } from '../i18n';
import { importRoom } from '../myRooms';
import { useNavigation } from '../navigation';
import { makeStyles, useTheme, smallRadius, spacing } from '../theme';

export function ImportScreen() {
  const nav = useNavigation();
  const styles = useStyles();
  const c = useTheme();
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const submit = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const r = await importRoom(input);
      if (r.ok) {
        nav.reset({ name: 'rooms' }, { name: 'room', room: r.room.room });
        return;
      }
      setError(t(r.reason === 'speaker' ? 'import.speaker' : 'import.notHost'));
    } catch (e) {
      setError(errorText(e));
    }
    setBusy(false);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader title={t('import.title')} onBack={nav.pop} />
      <Text style={styles.intro}>{t('rooms.importHint')}</Text>
      <Text style={styles.label}>{t('import.label')}</Text>
      <TextInput
        value={input}
        onChangeText={setInput}
        onSubmitEditing={submit}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        secureTextEntry={false}
        style={styles.input}
        placeholder="https://meet.ffmuc.net/reserve/#k=…"
        placeholderTextColor={c.textMuted}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        title={t('import.submit')}
        onPress={submit}
        busy={busy}
        disabled={!input.trim()}
        style={styles.button}
      />
    </ScrollView>
  );
}

const useStyles = makeStyles(colors =>
  StyleSheet.create({
    container: { padding: spacing.m },
    intro: { color: colors.text, fontSize: 16, marginBottom: spacing.m },
    label: { color: colors.textMuted, marginBottom: spacing.xs },
    input: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: smallRadius,
      color: colors.text,
      paddingHorizontal: spacing.m,
      minHeight: 48,
      fontSize: 16,
    },
    error: { color: colors.danger, marginTop: spacing.s },
    button: { marginTop: spacing.m },
  }),
);
