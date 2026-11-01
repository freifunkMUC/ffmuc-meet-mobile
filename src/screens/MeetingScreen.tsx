import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { JitsiMeeting, JitsiRefProps } from '@jitsi/react-native-sdk';
import type { MeetingTarget } from '../join';
import { colors } from '../theme';

export interface MeetingOptions {
  displayName?: string;
  startAudioMuted?: boolean;
  startVideoMuted?: boolean;
}

interface Props {
  target: MeetingTarget;
  options?: MeetingOptions;
  onClose: () => void;
}

/** Features off: they need non-free services or do not fit this app. */
const FLAGS = {
  'calendar.enabled': false,
  'call-integration.enabled': true,
  'welcomepage.enabled': false,
  resolution: 720,
};

export function MeetingScreen({ target, options = {}, onClose }: Props) {
  const ref = useRef<JitsiRefProps>(null);

  useEffect(() => {
    const meeting = ref;
    return () => meeting.current?.close();
  }, []);

  return (
    <View style={styles.container}>
      <JitsiMeeting
        ref={ref}
        room={target.room}
        serverURL={target.server}
        token={target.token}
        config={{
          analytics: { disabled: true },
          giphy: { enabled: false },
          disableThirdPartyRequests: true,
          startWithAudioMuted: !!options.startAudioMuted,
          startWithVideoMuted: !!options.startVideoMuted,
        }}
        flags={FLAGS}
        userInfo={
          options.displayName ? { displayName: options.displayName } : undefined
        }
        eventListeners={{ onReadyToClose: onClose }}
        style={styles.container}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
