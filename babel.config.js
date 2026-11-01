module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Needed by @jitsi/react-native-sdk.
    'optional-require',
    ['@babel/plugin-transform-private-methods', { loose: true }],
    'react-native-worklets-core/plugin',
  ],
};
