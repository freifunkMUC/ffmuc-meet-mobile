// The SDK ships its TypeScript sources. These types cover only what the app
// uses, so that `tsc` does not check the whole SDK.
declare module '@jitsi/react-native-sdk' {
  import type { ForwardRefExoticComponent, RefAttributes } from 'react';
  import type { StyleProp, ViewStyle } from 'react-native';

  export interface JitsiUserInfo {
    displayName?: string;
    email?: string;
    avatarURL?: string;
  }

  export interface JitsiEventListeners {
    onConferenceJoined?: (...args: unknown[]) => void;
    onConferenceLeft?: (...args: unknown[]) => void;
    onConferenceWillJoin?: (...args: unknown[]) => void;
    onReadyToClose?: () => void;
    [name: string]: ((...args: any[]) => void) | undefined;
  }

  export interface JitsiMeetingProps {
    config: object;
    eventListeners?: JitsiEventListeners;
    flags?: object;
    room: string;
    serverURL?: string;
    style?: StyleProp<ViewStyle>;
    token?: string;
    userInfo?: JitsiUserInfo;
  }

  export interface JitsiRefProps {
    close: () => void;
    setAudioMuted?: (muted: boolean) => void;
    setVideoMuted?: (muted: boolean) => void;
  }

  export const JitsiMeeting: ForwardRefExoticComponent<
    JitsiMeetingProps & RefAttributes<JitsiRefProps>
  >;
}
