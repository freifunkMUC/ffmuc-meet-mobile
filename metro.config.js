const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaults = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaults.resolver;

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  // @jitsi/react-native-sdk imports SVG files as components.
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg'],
  },
};

module.exports = mergeConfig(defaults, config);
