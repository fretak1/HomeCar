const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
let config = getDefaultConfig(__dirname);

// Fix for socket.io-client / engine.io-client
config.resolver.blockList = [
  /.*\/node_modules\/.*\/.*\.node\.js$/,
];

config.resolver.sourceExts.push('mjs');

// NativeWind v4 configuration
config = withNativeWind(config, { input: './src/styles/global.css' });

module.exports = config;
