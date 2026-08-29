// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Limit worker pool to 2 on Windows to prevent `spawn UNKNOWN` (errno: -4094) child_process fork errors
config.maxWorkers = 2;

module.exports = config;
