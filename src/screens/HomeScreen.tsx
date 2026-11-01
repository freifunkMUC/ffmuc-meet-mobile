import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { t } from '../i18n';
import { RecentMeeting, loadRecent, removeRecent } from '../storage/recent';
import { SERVER_URL, colors, radius, spacing } from '../theme';

interface Props {
  busy: boolean;
  error?: string;
  onJoin: (input: string) => void;
  /** Changes when the recent list may have changed. */
  recentVersion: number;
  header?: React.ReactNode;
}

export function HomeScreen({
  busy,
  error,
  onJoin,
  recentVersion,
  header,
}: Props) {
  const [input, setInput] = useState('');
  const [recent, setRecent] = useState<RecentMeeting[]>([]);

  useEffect(() => {
    loadRecent().then(setRecent);
  }, [recentVersion]);

  const join = useCallback(() => {
    if (input.trim()) {
      onJoin(input);
    }
  }, [input, onJoin]);

  const confirmRemove = (r: RecentMeeting) =>
    Alert.alert(t('home.removeRecent', { room: r.room }), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('home.remove'),
        style: 'destructive',
        onPress: () => removeRecent(r.server, r.room).then(setRecent),
      },
    ]);

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Text style={styles.title}>{t('app.name')}</Text>
      </View>
      {header}
      <Text style={styles.label}>{t('home.inputLabel')}</Text>
      <TextInput
        testID="join-input"
        value={input}
        onChangeText={setInput}
        onSubmitEditing={join}
        placeholder={t('home.inputPlaceholder')}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        returnKeyType="go"
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        testID="join-button"
        title={t('home.join')}
        onPress={join}
        busy={busy}
        disabled={!input.trim()}
        style={styles.joinButton}
      />
      <Text style={styles.section}>{t('home.recent')}</Text>
      <FlatList
        data={recent}
        keyExtractor={r => `${r.server}/${r.room}`}
        ListEmptyComponent={
          <Text style={styles.muted}>{t('home.recentEmpty')}</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.recentItem}
            onPress={() =>
              onJoin(`${item.server}/${encodeURIComponent(item.room)}`)
            }
            onLongPress={() => confirmRemove(item)}
          >
            <Text style={styles.recentRoom}>{item.room}</Text>
            {item.server !== SERVER_URL ? (
              <Text style={styles.muted}>
                {item.server.replace(/^https?:\/\//, '')}
              </Text>
            ) : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.m },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  logo: { width: 40, height: 40, marginRight: spacing.s },
  title: { color: colors.text, fontSize: 24, fontWeight: '700' },
  label: { color: colors.textMuted, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius,
    color: colors.text,
    paddingHorizontal: spacing.m,
    minHeight: 48,
    fontSize: 16,
  },
  error: { color: colors.danger, marginTop: spacing.s },
  joinButton: { marginTop: spacing.m },
  section: {
    color: colors.sun,
    fontWeight: '600',
    marginTop: spacing.l,
    marginBottom: spacing.s,
  },
  muted: { color: colors.textMuted },
  recentItem: {
    paddingVertical: spacing.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  recentRoom: { color: colors.text, fontSize: 16 },
});
