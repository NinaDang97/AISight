module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',  // This will be overridden by ENVFILE
      safe: false,
      allowUndefined: true,
    }],
  ],
};