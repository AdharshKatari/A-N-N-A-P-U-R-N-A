const { withAndroidManifest } = require('expo/config-plugins');

module.exports = config => withAndroidManifest(config, config => {
  // shortcut: Wi-Fi test backend uses HTTP, remove when switching to HTTPS.
  config.modResults.manifest.application[0].$['android:usesCleartextTraffic'] = 'true';
  return config;
});
