import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, BackHandler, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useDeepLinks } from './src/deeplinks';
import { errorText } from './src/errors';
import { t } from './src/i18n';
import { parseInput, planJoin } from './src/join';
import { applyDeviceLocale } from './src/locale';
import { importRoom } from './src/myRooms';
import { Navigation, NavigationProvider, Route } from './src/navigation';
import { CreateRoomScreen } from './src/screens/CreateRoomScreen';
import { ExtendScreen } from './src/screens/ExtendScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ImportScreen } from './src/screens/ImportScreen';
import { MeetingScreen } from './src/screens/MeetingScreen';
import { RoomScreen } from './src/screens/RoomScreen';
import { RoomsScreen } from './src/screens/RoomsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { roomOfExtendLink, syncReminders } from './src/reminders';
import { addRecent } from './src/storage/recent';
import { loadRooms, onRoomsChanged } from './src/storage/rooms';
import { Settings, loadSettings } from './src/storage/settings';
import { applyThemePref, loadThemePref } from './src/storage/themePref';
import { SERVER_URL, useTheme } from './src/theme';

applyDeviceLocale();

function App() {
  const c = useTheme();
  const [lang, setLang] = useState(0);
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [recentVersion, setRecentVersion] = useState(0);
  const joinSeq = useRef(0);
  const [settings, setSettings] = useState<Settings>();

  const nav = useMemo<Navigation>(
    () => ({
      route: stack[stack.length - 1],
      push: r => setStack(s => [...s, r]),
      pop: () => setStack(s => (s.length > 1 ? s.slice(0, -1) : s)),
      reset: (...r) => setStack([{ name: 'home' }, ...r]),
    }),
    [stack],
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (nav.route.name === 'meeting') {
        // The meeting handles "back" itself (hang up).
        return true;
      }
      if (stack.length > 1) {
        nav.pop();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [nav, stack.length]);

  /** Opens any link. Returns an error text, or nothing on success. */
  const resolveLink = useCallback(
    async (input: string, seq: number): Promise<string | undefined> => {
      const link = parseInput(input);
      if (link.kind === 'invalid') {
        return t('join.invalid');
      }
      try {
        const plan = await planJoin(link);
        if (seq !== joinSeq.current) {
          return undefined;
        }
        switch (plan.kind) {
          case 'meeting':
            await addRecent(plan.target.server, plan.target.room);
            setRecentVersion(v => v + 1);
            nav.reset({ name: 'meeting', target: plan.target });
            return undefined;
          case 'manage': {
            if (plan.server !== SERVER_URL) {
              // "My rooms" is for this server only: join as host.
              return resolveLink(`${plan.server}/reserve/h/${plan.key}`, seq);
            }
            const r = await importRoom(plan.key);
            if (r.ok && seq === joinSeq.current) {
              nav.reset({ name: 'rooms' }, { name: 'room', room: r.room.room });
            }
            return r.ok ? undefined : t('import.notHost');
          }
          case 'reserve':
            return t('join.reserveHint');
          default:
            return t('join.invalid');
        }
      } catch (e) {
        return errorText(e);
      }
    },
    [nav],
  );

  const openLink = useCallback(
    async (input: string) => {
      const seq = ++joinSeq.current;
      setError(undefined);
      setBusy(true);
      const err = await resolveLink(input, seq);
      if (seq === joinSeq.current) {
        setError(err);
        setBusy(false);
      }
      return err;
    },
    [resolveLink],
  );

  const saveLink = useCallback(
    async (input: string) => {
      const seq = ++joinSeq.current;
      setError(undefined);
      setBusy(true);
      try {
        const r = await importRoom(input);
        if (seq !== joinSeq.current) {
          return;
        }
        if (r.ok) {
          nav.reset({ name: 'rooms' }, { name: 'room', room: r.room.room });
        } else {
          setError(
            t(r.reason === 'speaker' ? 'import.speaker' : 'import.notHost'),
          );
        }
      } catch (e) {
        if (seq === joinSeq.current) {
          setError(errorText(e));
        }
      } finally {
        if (seq === joinSeq.current) {
          setBusy(false);
        }
      }
    },
    [nav],
  );

  useEffect(() => {
    loadThemePref().then(applyThemePref);
    loadSettings().then(setSettings);
    const appState = AppState.addEventListener('change', st => {
      if (st === 'active' && applyDeviceLocale()) {
        setLang(v => v + 1);
      }
    });
    loadRooms()
      .then(syncReminders)
      .catch(() => {});
    const unsub = onRoomsChanged(rooms => {
      syncReminders(rooms).catch(() => {});
    });
    return () => {
      appState.remove();
      unsub();
    };
  }, []);

  const onDeepLink = useCallback(
    (url: string) => {
      const room = roomOfExtendLink(url);
      if (room) {
        joinSeq.current++;
        nav.reset(
          { name: 'rooms' },
          { name: 'room', room },
          { name: 'extend', room },
        );
        return;
      }
      openLink(url);
    },
    [nav, openLink],
  );

  useDeepLinks(onDeepLink);

  const route = nav.route;
  const screen = () => {
    switch (route.name) {
      case 'rooms':
        return <RoomsScreen />;
      case 'create':
        return <CreateRoomScreen />;
      case 'import':
        return <ImportScreen />;
      case 'room':
        return (
          <RoomScreen
            key={route.room}
            room={route.room}
            onJoinHost={openLink}
          />
        );
      case 'extend':
        return <ExtendScreen room={route.room} />;
      case 'settings':
        return <SettingsScreen onChange={setSettings} />;
      default:
        return (
          <HomeScreen
            busy={busy}
            error={error}
            onJoin={openLink}
            onSave={saveLink}
            recentVersion={recentVersion}
          />
        );
    }
  };
  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={
          c.scheme === 'dark' || route.name === 'meeting'
            ? 'light-content'
            : 'dark-content'
        }
        backgroundColor={route.name === 'meeting' ? '#000000' : c.background}
      />
      <NavigationProvider value={nav}>
        {route.name === 'meeting' ? (
          <SafeAreaView style={[styles.container, styles.meeting]}>
            <MeetingScreen
              key={`${route.target.server}/${route.target.room}/${route.target.role}`}
              target={route.target}
              options={settings}
              onClose={nav.pop}
            />
          </SafeAreaView>
        ) : (
          <SafeAreaView
            key={lang}
            style={[styles.container, { backgroundColor: c.background }]}
          >
            {screen()}
          </SafeAreaView>
        )}
      </NavigationProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  meeting: { backgroundColor: '#000000' },
});

export default App;
