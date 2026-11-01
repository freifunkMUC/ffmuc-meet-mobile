import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ScreenHeader } from '../components/ScreenHeader';
import { formatDate, isExpired } from '../format';
import { t } from '../i18n';
import { clientFor } from '../join';
import { useNavigation } from '../navigation';
import { StoredRoom, loadRooms, saveRoomView } from '../storage/rooms';
import { makeStyles, radius, spacing, useTheme } from '../theme';

export function RoomsScreen() {
  const nav = useNavigation();
  const c = useTheme();
  const s = useStyles();
  const [rooms, setRooms] = useState<StoredRoom[]>();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRooms().then(setRooms);
  }, [nav.route]);

  // Each refresh is one POST per room (rate limit 60/h): only on request.
  const refresh = useCallback(async () => {
    setRefreshing(true);
    const client = clientFor();
    for (const r of await loadRooms()) {
      try {
        await saveRoomView(await client.manage(r.key));
      } catch {
        // The room screen shows the error.
      }
    }
    setRooms(await loadRooms());
    setRefreshing(false);
  }, []);

  const actions = (
    <>
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
    </>
  );

  return (
    <ScrollView
      contentContainerStyle={s.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={c.accent}
          colors={[c.accent]}
        />
      }
    >
      <ScreenHeader title={t('rooms.title')} onBack={nav.pop} />
      <Card style={s.intro}>
        <Text style={s.introText}>{t('rooms.intro')}</Text>
        <View style={s.roles}>
          {(['host', 'speaker', 'viewer'] as const).map(r => (
            <View key={r} style={s.role}>
              <Badge role={r} />
              <Text style={s.muted}>{t(`role.${r}Hint`)}</Text>
            </View>
          ))}
        </View>
      </Card>

      {rooms && rooms.length === 0 ? (
        <Card>
          <Text style={s.emptyText}>{t('rooms.empty')}</Text>
          {actions}
        </Card>
      ) : null}

      {rooms?.map(item => {
        const expired = isExpired(item.expires);
        return (
          <Pressable
            key={item.room}
            accessibilityRole="button"
            onPress={() => nav.push({ name: 'room', room: item.room })}
            style={({ pressed }) => [s.item, pressed && s.pressed]}
          >
            <View style={s.itemMain}>
              <Text style={s.room}>{item.room}</Text>
              <Text style={expired ? s.expired : s.muted}>
                {t(expired ? 'rooms.expired' : 'rooms.expires', {
                  date: formatDate(item.expires),
                })}
              </Text>
            </View>
            <Text style={s.chevron}>›</Text>
          </Pressable>
        );
      })}

      {rooms && rooms.length > 0 ? (
        <View style={s.footer}>{actions}</View>
      ) : null}
    </ScrollView>
  );
}

const useStyles = makeStyles(c =>
  StyleSheet.create({
    container: { padding: spacing.m },
    intro: {
      borderColor: c.scheme === 'dark' ? c.accent : c.border,
      backgroundColor: c.card,
    },
    introText: { color: c.text, fontSize: 16, lineHeight: 23 },
    roles: { marginTop: spacing.m, gap: spacing.s },
    role: { gap: 4 },
    emptyText: { color: c.text, fontSize: 16, marginBottom: spacing.s },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: radius,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.m,
      marginBottom: spacing.s,
    },
    pressed: { opacity: 0.8 },
    itemMain: { flex: 1 },
    room: { color: c.text, fontSize: 17, fontWeight: '700', marginBottom: 2 },
    chevron: { color: c.textMuted, fontSize: 28 },
    muted: { color: c.textMuted, lineHeight: 20 },
    expired: { color: c.danger },
    footer: { marginTop: spacing.m },
    button: { marginTop: spacing.s },
  }),
);
