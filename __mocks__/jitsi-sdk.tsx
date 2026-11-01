import React, { forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';

export const JitsiMeeting = forwardRef((_props: object, ref) => {
  useImperativeHandle(ref, () => ({ close: () => {} }));
  return <View testID="jitsi-meeting" />;
});
