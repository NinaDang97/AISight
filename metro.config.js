const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    extraNodeModules: {
      dns: path.resolve(__dirname, 'src/utils/shims/dns.js'),
      net: path.resolve(__dirname, 'src/utils/shims/net.js'),
      stream: require.resolve('stream'),
      url: require.resolve('url'),
      assert: require.resolve('assert'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
