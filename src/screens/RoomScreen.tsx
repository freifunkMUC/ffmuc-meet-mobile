import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { SectionTitle } from '../components/SectionTitle';
import { ScreenHeader } from '../components/ScreenHeader';
import { errorText } from '../errors';
import { formatDate, isExpired } from '../format';
import { MessageKey, t } from '../i18n';
import { clientFor } from '../join';
import { useNavigation } from '../navigation';
import { ReserveError, RoomView } from '../reserve/client';
import {
  StoredRoom,
  getRoom,
  removeRoom,
  saveRoomView,
} from '../storage/rooms';
import {
  RESERVE_BASE,
  SERVER_URL,
  makeStyles,
  radius,
  spacing,
  useTheme,
} from '../theme';

type Op = 'load' | 'join' | 'rotate' | 'delete';

interface Props {
  room: string;
  /** Joins with a host link. Returns an error text or nothing. */
  onJoinHost: (hostUrl: string) => Promise<string | undefined>;
}

export function RoomScreen({ room, onJoinHost }: Props) {
  const nav = useNavigation();
  const c = useTheme();
  const styles = useStyles();
  const [stored, setStored] = useState<StoredRoom | null>();
  const [view, setView] = useState<RoomView>();
  const [gone, setGone] = useState<string>();
  const [op, setOp] = useState<Op>();
  const [error, setError] = useState<string>();

  const fail = useCallback((e: unknown) => {
    if (e instanceof ReserveError && e.isGone) {
      setGone(e.code);
    } else {
      setError(errorText(e));
    }
  }, []);

  // Read again after the extend screen closes.
  useEffect(() => {
    getRoom(room).then(r => setStored(r ?? null));
  }, [room, nav.route]);

  // One POST per screen open, for the speaker link and the status.
  useEffect(() => {
    let live = true;
    getRoom(room).then(async r => {
      if (!r) {
        return;
      }
      setOp('load');
      try {
        const v = await clientFor().manage(r.key);
        if (live) {
          setView(v);
          setStored(await saveRoomView(v));
        }
      } catch (e) {
        if (live) {
          fail(e);
        }
      } finally {
        if (live) {
          setOp(undefined);
        }
      }
    });
    return () => {
      live = false;
    };
  }, [room, fail]);

  const confirm = (title: string, text: string, onOk: () => void) =>
    Alert.alert(title, text, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: title, style: 'destructive', onPress: onOk },
    ]);

  const forget = async () => {
    clientFor().forgetJwts(room);
    await removeRoom(room);
    nav.pop();
  };

  const run = async (o: Op, fn: () => Promise<void>) => {
    setOp(o);
    setError(undefined);
    try {
      await fn();
    } catch (e) {
      fail(e);
    } finally {
      setOp(undefined);
    }
  };

  if (stored === null) {
    return (
      <View style={styles.container}>
        <ScreenHeader title={room} onBack={nav.pop} />
        <Text style={styles.error}>{t('room.gone')}</Text>
      </View>
    );
  }
  if (!stored) {
    return null;
  }

  const key = stored.key;
  const hostUrl = view?.host_url ?? `${RESERVE_BASE}/h/${key}`;
  const links: {
    role: 'host' | 'speaker' | 'viewer' | 'manage';
    url?: string;
  }[] = [
    { role: 'viewer', url: view?.guest_url ?? `${SERVER_URL}/${room}` },
    { role: 'speaker', url: view?.speaker_url },
    { role: 'host', url: hostUrl },
    { role: 'manage', url: view?.manage_url ?? `${RESERVE_BASE}/#k=${key}` },
  ];
  const expired = isExpired(stored.expires);
  const status = gone ?? view?.status ?? (expired ? 'expired' : undefined);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ScreenHeader
        title={room}
        onBack={nav.pop}
        right={op === 'load' ? <ActivityIndicator color={c.accent} /> : null}
      />
      <Card>
        {status ? (
          <Text style={status === 'active' ? styles.ok : styles.error}>
            {t(`room.status.${status}` as MessageKey)}
          </Text>
        ) : null}
        <Text style={styles.text}>
          {t(expired ? 'rooms.expired' : 'rooms.expires', {
            date: formatDate(stored.expires),
          })}
        </Text>
      </Card>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {gone ? (
        <>
          <Text style={styles.text}>{t('room.gone')}</Text>
          <Button
            kind="danger"
            title={t('room.remove')}
            onPress={forget}
            style={styles.button}
          />
        </>
      ) : (
        <>
          <Button
            title={t('room.joinHost')}
            hint={t('room.joinHostHint')}
            busy={op === 'join'}
            disabled={!!op && op !== 'load'}
            onPress={() =>
              run('join', async () => {
                const err = await onJoinHost(hostUrl);
                if (err) {
                  setError(err);
                }
              })
            }
            style={styles.button}
          />
          <Button
            kind="secondary"
            title={t('room.extend')}
            hint={t('room.extendHint')}
            disabled={!!op && op !== 'load'}
            onPress={() => nav.push({ name: 'extend', room })}
            style={styles.button}
          />

          <SectionTitle>{t('room.share')}</SectionTitle>
          <Text style={styles.muted}>{t('room.shareTap')}</Text>
          {links.map(({ role, url }) => (
            <Pressable
              key={role}
              accessibilityRole="button"
              accessibilityLabel={`${t(`role.${role}`)}: ${t(
                `role.${role}Hint`,
              )}`}
              disabled={!url}
              onPress={() => url && Share.share({ message: url })}
              style={({ pressed }) => [
                styles.link,
                role === 'manage' && styles.linkManage,
                !url && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.linkHead}>
                <Badge role={role} />
                <Text style={styles.shareIcon}>↗</Text>
              </View>
              <Text style={styles.text}>{t(`role.${role}Hint`)}</Text>
              {url ? (
                <Text
                  style={styles.url}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {url}
                </Text>
              ) : null}
            </Pressable>
          ))}

          <SectionTitle>{t('room.actions')}</SectionTitle>
          <Button
            kind="secondary"
            title={t('room.rotate')}
            hint={t('room.rotateHint')}
            busy={op === 'rotate'}
            disabled={!!op && op !== 'load'}
            onPress={() =>
              confirm(t('room.rotate'), t('room.rotateConfirm'), () =>
                run('rotate', async () => {
                  const v = await clientFor().rotate(key);
                  setView(v);
                  setStored(await saveRoomView(v));
                }),
              )
            }
            style={styles.button}
          />
          <Button
            kind="danger"
            title={t('room.delete')}
            hint={t('room.deleteHint')}
            busy={op === 'delete'}
            disabled={!!op && op !== 'load'}
            onPress={() =>
              confirm(t('room.delete'), t('room.deleteConfirm'), () =>
                run('delete', async () => {
                  await clientFor().delete(key);
                  await forget();
                }),
              )
            }
            style={styles.button}
          />
          <Button
            kind="secondary"
            title={t('room.remove')}
            hint={t('room.removeHint')}
            disabled={!!op && op !== 'load'}
            onPress={() =>
              confirm(t('room.remove'), t('room.removeConfirm'), forget)
            }
            style={styles.button}
          />
        </>
      )}
    </ScrollView>
  );
}

const useStyles = makeStyles(c =>
  StyleSheet.create({
    container: { padding: spacing.m },
    text: { color: c.text, fontSize: 15, lineHeight: 21 },
    muted: { color: c.textMuted, marginBottom: spacing.s },
    ok: { color: c.success, fontWeight: '700', marginBottom: spacing.xs },
    error: { color: c.danger, marginTop: spacing.s, lineHeight: 20 },
    link: {
      backgroundColor: c.card,
      borderRadius: radius,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.m,
      marginBottom: spacing.s,
      gap: 6,
    },
    linkManage: { borderColor: c.accent },
    linkHead: { flexDirection: 'row', justifyContent: 'space-between' },
    shareIcon: { color: c.accentText, fontSize: 18, fontWeight: '700' },
    url: { color: c.textMuted, fontSize: 13 },
    pressed: { opacity: 0.8 },
    disabled: { opacity: 0.5 },
    button: { marginTop: spacing.s },
  }),
);
