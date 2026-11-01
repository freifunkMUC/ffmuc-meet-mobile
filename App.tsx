import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { BackHandler, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useDeepLinks } from './src/deeplinks';
import { errorText } from './src/errors';
import { t } from './src/i18n';
import { parseInput, planJoin } from './src/join';
import { Navigation, NavigationProvider, Route } from './src/navigation';
import { HomeScreen } from './src/screens/HomeScreen';
import { MeetingScreen } from './src/screens/MeetingScreen';
import { addRecent } from './src/storage/recent';
import { colors } from './src/theme';

function App() {
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [recentVersion, setRecentVersion] = useState(0);
  const joinSeq = useRef(0);

  const nav = useMemo<Navigation>(
    () => ({
      route: stack[stack.length - 1],
      push: r => setStack(s => [...s, r]),
      pop: () => setStack(s => (s.length > 1 ? s.slice(0, -1) : s)),
      reset: r => setStack(r ? [{ name: 'home' }, r] : [{ name: 'home' }]),
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

  const openLink = useCallback(
    async (input: string) => {
      const seq = ++joinSeq.current;
      setError(undefined);
      const link = parseInput(input);
      if (link.kind === 'invalid') {
        setError(t('join.invalid'));
        return;
      }
      setBusy(true);
      try {
        const plan = await planJoin(link);
        if (seq !== joinSeq.current) {
          return;
        }
        switch (plan.kind) {
          case 'meeting':
            await addRecent(plan.target.server, plan.target.room);
            setRecentVersion(v => v + 1);
            nav.reset({ name: 'meeting', target: plan.target });
            break;
          case 'manage':
            // Until "My rooms" exists, a manage link joins as host.
            return openLink(`${plan.server}/reserve/h/${plan.key}`);
          case 'reserve':
            setError(t('join.reserveHint'));
            break;
          default:
            setError(t('join.invalid'));
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

  useDeepLinks(openLink);

  const route = nav.route;
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <NavigationProvider value={nav}>
        {route.name === 'meeting' ? (
          <MeetingScreen
            key={`${route.target.server}/${route.target.room}/${route.target.role}`}
            target={route.target}
            onClose={nav.pop}
          />
        ) : (
          <SafeAreaView style={styles.container}>
            <HomeScreen
              busy={busy}
              error={error}
              onJoin={openLink}
              recentVersion={recentVersion}
            />
          </SafeAreaView>
        )}
      </NavigationProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});

export default App;
