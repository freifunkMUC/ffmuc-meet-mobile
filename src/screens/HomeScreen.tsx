import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { t } from '../i18n';
import { describeLink, recentJoin } from '../join';
import { formatDate, isExpired } from '../format';
import { useNavigation } from '../navigation';
import { RecentMeeting, loadRecent, removeRecent } from '../storage/recent';
import { StoredRoom, loadRooms } from '../storage/rooms';
import {
  RESERVE_BASE,
  SERVER_URL,
  makeStyles,
  smallRadius,
  spacing,
  useTheme,
} from '../theme';

interface Props {
  busy: boolean;
  error?: string;
  onJoin: (input: string) => void;
  /** Adds a host or manage link to "My rooms". */
  onSave: (input: string) => void;
  /** Changes when the recent list may have changed. */
  recentVersion: number;
}

const host = (server: string) => server.replace(/^https?:\/\//, '');

export function HomeScreen({
  busy,
  error,
  onJoin,
  onSave,
  recentVersion,
}: Props) {
  const c = useTheme();
  const s = useStyles();
  const nav = useNavigation();
  const [input, setInput] = useState('');
  const [recent, setRecent] = useState<RecentMeeting[]>([]);
  const [rooms, setRooms] = useState<StoredRoom[]>([]);
  const preview = useMemo(() => describeLink(input), [input]);

  useEffect(() => {
    loadRecent().then(setRecent);
  }, [recentVersion]);

  useEffect(() => {
    loadRooms()
      .then(setRooms)
      .catch(() => setRooms([]));
  }, [recentVersion]);

  const nextRooms = rooms.filter(r => !isExpired(r.expires)).slice(0, 3);

  const join = useCallback(() => {
    if (preview) {
      onJoin(input);
    }
  }, [input, onJoin, preview]);

  const hostKeys = useMemo(
    () => new Map(rooms.map(r => [r.room, r.key])),
    [rooms],
  );

  const confirmRemove = (r: RecentMeeting) =>
    Alert.alert(t('home.removeRecent', { room: r.room }), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('home.remove'),
        style: 'destructive',
        onPress: () => removeRecent(r.server, r.room).then(setRecent),
      },
    ]);

  const joinRole =
    preview?.role === 'manage' ? 'host' : preview?.role ?? 'viewer';

  return (
    <ScrollView
      contentContainerStyle={s.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={s.brand}>
        <Image source={require('../../assets/logo.png')} style={s.logo} />
        <Text style={s.title} numberOfLines={1}>
          {t('app.name')}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => nav.push({ name: 'settings' })}
          hitSlop={8}
          style={s.settings}
        >
          <Text style={s.settingsText}>{t('settings.title')}</Text>
        </Pressable>
      </View>

      <Card>
        <Text style={s.label} nativeID="join-label">
          {t('home.inputLabel')}
        </Text>
        <TextInput
          testID="join-input"
          accessibilityLabelledBy="join-label"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={join}
          placeholder={t('home.inputPlaceholder')}
          placeholderTextColor={c.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          style={s.input}
        />
        <Text style={s.help}>{t('home.inputHelp')}</Text>

        {preview ? (
          <View style={s.preview} accessibilityLiveRegion="polite">
            <Badge role={preview.role} />
            <Text style={s.room}>
              {preview.room
                ? t('home.room', { room: preview.room })
                : t('home.roomAfterJoin')}
            </Text>
            {preview.server !== SERVER_URL ? (
              <Text style={s.help}>
                {t('home.otherServer', { server: host(preview.server) })}
              </Text>
            ) : null}
            <Text style={s.help}>{t(`role.${preview.role}Hint`)}</Text>
          </View>
        ) : null}

        {error ? (
          <Text style={s.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
        <Button
          testID="join-button"
          title={
            preview && preview.role !== 'open'
              ? t('home.joinAs', { role: t(`role.${joinRole}`) })
              : t('home.join')
          }
          onPress={join}
          busy={busy}
          disabled={!preview}
          style={s.button}
        />
        {preview?.canSave ? (
          <Button
            kind="secondary"
            title={t('home.save')}
            onPress={() => onSave(input)}
            disabled={busy}
            style={s.button}
          />
        ) : null}
      </Card>

      <Card>
        <Text style={s.cardTitle}>{t('home.reserved')}</Text>
        <Text style={s.help}>{t('home.reservedHint')}</Text>
        {nextRooms.map(r => (
          <View key={r.room} style={s.roomRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityHint={t('home.openRoomHint')}
              onPress={() => nav.push({ name: 'room', room: r.room })}
              style={s.roomInfo}
            >
              <Text style={s.recentRoom} numberOfLines={1}>
                {r.room}
              </Text>
              <Text style={s.help}>
                {t('rooms.expires', { date: formatDate(r.expires) })}
              </Text>
            </Pressable>
            <Button
              kind="secondary"
              title={t('room.joinHost')}
              onPress={() => onJoin(`${RESERVE_BASE}/h/${r.key}`)}
              disabled={busy}
              style={s.roomJoin}
            />
          </View>
        ))}
        {rooms.length > 0 ? (
          <Button
            kind="secondary"
            title={t('home.allRooms', { count: rooms.length })}
            onPress={() => nav.push({ name: 'rooms' })}
            style={s.button}
          />
        ) : null}
        <Button
          title={t('rooms.create')}
          hint={t('rooms.createHint')}
          onPress={() => nav.push({ name: 'create' })}
          style={s.button}
        />
        <Button
          kind="secondary"
          title={t('rooms.import')}
          hint={t('rooms.importHint')}
          onPress={() => nav.push({ name: 'import' })}
          style={s.button}
        />
      </Card>

      <Card style={s.recentCard}>
        <Text style={s.cardTitle}>{t('home.recent')}</Text>
        {recent.length === 0 ? (
          <Text style={s.help}>{t('home.recentEmpty')}</Text>
        ) : (
          recent.map(item => {
            const rj = recentJoin(item, hostKeys);
            return (
              <View key={`${item.server}/${item.room}`} style={s.roomRow}>
                <View style={s.roomInfo}>
                  <View style={s.recentTitle}>
                    <Text style={s.recentRoom} numberOfLines={1}>
                      {item.room}
                    </Text>
                    {rj.role ? <Badge role={rj.role} /> : null}
                  </View>
                  {item.server !== SERVER_URL ? (
                    <Text style={s.help}>{host(item.server)}</Text>
                  ) : null}
                  {item.at ? (
                    <Text style={s.help}>
                      {t('home.lastJoined', {
                        date: formatDate(new Date(item.at).toISOString()),
                      })}
                    </Text>
                  ) : null}
                </View>
                <Button
                  kind="secondary"
                  title={t('home.join')}
                  accessibilityLabel={t('home.joinRoom', { room: item.room })}
                  onPress={() => onJoin(rj.url)}
                  disabled={busy}
                  style={s.recentJoin}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('home.removeRecent', {
                    room: item.room,
                  })}
                  onPress={() => confirmRemove(item)}
                  hitSlop={8}
                  style={s.remove}
                >
                  <Text style={s.removeText}>{t('home.remove')}</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </Card>
    </ScrollView>
  );
}

const useStyles = makeStyles(c =>
  StyleSheet.create({
    container: { padding: spacing.m },
    brand: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.l,
    },
    logo: { width: 44, height: 44, marginRight: spacing.s },
    title: { flex: 1, color: c.text, fontSize: 28, fontWeight: '800' },
    settings: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: smallRadius,
      paddingHorizontal: spacing.m,
      paddingVertical: spacing.s,
      backgroundColor: c.card,
    },
    settingsText: { color: c.text, fontWeight: '600', fontSize: 15 },
    cardTitle: { color: c.text, fontSize: 18, fontWeight: '700' },
    label: { color: c.text, fontWeight: '600', marginBottom: spacing.s },
    input: {
      backgroundColor: c.surface,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: smallRadius,
      color: c.text,
      paddingHorizontal: spacing.m,
      minHeight: 50,
      fontSize: 16,
    },
    help: { color: c.textMuted, marginTop: spacing.xs, lineHeight: 20 },
    preview: {
      marginTop: spacing.m,
      padding: spacing.m,
      borderRadius: smallRadius,
      backgroundColor: c.surface,
      gap: spacing.xs,
    },
    room: {
      color: c.text,
      fontSize: 16,
      fontWeight: '600',
      marginTop: spacing.xs,
    },
    error: { color: c.danger, marginTop: spacing.m, lineHeight: 20 },
    button: { marginTop: spacing.m },
    recentCard: { marginTop: spacing.m },
    recentTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.s },
    recentRoom: { color: c.text, fontSize: 16, flexShrink: 1 },
    recentJoin: { minWidth: 90 },
    remove: { paddingVertical: spacing.s },
    removeText: {
      color: c.textMuted,
      fontSize: 14,
      textDecorationLine: 'underline',
    },
    roomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s,
      marginTop: spacing.m,
      paddingTop: spacing.m,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    roomInfo: { flex: 1 },
    roomJoin: { minWidth: 130 },
  }),
);
