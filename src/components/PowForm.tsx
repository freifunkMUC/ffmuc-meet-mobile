import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { errorText } from '../errors';
import { formatDuration } from '../format';
import { t } from '../i18n';
import { clientFor } from '../join';
import type { PowOptions, RoomView } from '../reserve/client';
import { makeStyles, spacing } from '../theme';
import { Button } from './Button';
import { DurationPicker } from './DurationPicker';
import { PowProgress } from './PowProgress';

const FALLBACK_DURATIONS = [72, 168, 720, 2160, 8760];

/** Duration choice plus the anti-spam check, for reserve and extend. */
export function PowForm({
  submitLabel,
  info,
  run,
  onDone,
}: {
  submitLabel: string;
  info?: string;
  run: (
    hours: number,
    opts: Pick<PowOptions, 'onProgress' | 'signal'>,
  ) => Promise<RoomView>;
  onDone: (view: RoomView) => void;
}) {
  const [durations, setDurations] = useState(FALLBACK_DURATIONS);
  const [maxAhead, setMaxAhead] = useState<number>();
  const [hours, setHours] = useState(FALLBACK_DURATIONS[0]);
  const [ratio, setRatio] = useState<number>();
  const [error, setError] = useState<string>();
  const abort = useRef<AbortController | null>(null);
  const styles = useStyles();

  useEffect(() => {
    let live = true;
    // GET only: does not count against the POST rate limit.
    clientFor()
      .challenge()
      .then(c => {
        if (live && c.durations.length) {
          setDurations(c.durations);
          setHours(
            c.durations.includes(c.default) ? c.default : c.durations[0],
          );
          setMaxAhead(c.max_ahead_h);
        }
      })
      .catch(() => undefined);
    return () => {
      live = false;
      abort.current?.abort();
    };
  }, []);

  const busy = ratio !== undefined;

  const submit = async () => {
    const ctl = new AbortController();
    abort.current = ctl;
    setError(undefined);
    setRatio(0);
    try {
      const view = await run(hours, {
        signal: ctl.signal,
        onProgress: p => setRatio(Math.min(p.ratio, 0.99)),
      });
      if (!ctl.signal.aborted) {
        onDone(view);
      }
    } catch (e) {
      if (!ctl.signal.aborted) {
        setError(errorText(e));
      }
    } finally {
      if (abort.current === ctl) {
        abort.current = null;
        setRatio(undefined);
      }
    }
  };

  const cancel = () => {
    abort.current?.abort();
    abort.current = null;
    setRatio(undefined);
  };

  return (
    <View>
      <Text style={styles.label}>{t('create.duration')}</Text>
      <DurationPicker
        durations={durations}
        value={hours}
        onChange={setHours}
        disabled={busy}
      />
      {maxAhead ? (
        <Text style={styles.muted}>
          {t('extend.max', { duration: formatDuration(maxAhead) })}
        </Text>
      ) : null}
      {info ? <Text style={styles.muted}>{info}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {busy ? (
        <>
          <PowProgress ratio={ratio} />
          <Button
            kind="secondary"
            title={t('common.cancel')}
            onPress={cancel}
            style={styles.button}
          />
        </>
      ) : (
        <Button title={submitLabel} onPress={submit} style={styles.button} />
      )}
    </View>
  );
}

const useStyles = makeStyles(colors =>
  StyleSheet.create({
    label: { color: colors.textMuted, marginBottom: spacing.s },
    muted: { color: colors.textMuted, marginTop: spacing.m },
    error: { color: colors.danger, marginTop: spacing.m },
    button: { marginTop: spacing.l },
  }),
);
