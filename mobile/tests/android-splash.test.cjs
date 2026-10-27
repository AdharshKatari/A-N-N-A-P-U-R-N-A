const assert = require('node:assert/strict');
const { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { test } = require('node:test');
const { setSplashImageDrawablesAsync } = require('@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/withAndroidSplashImages');

test('splash configuration generates the drawable referenced by the Android theme', async () => {
  const config = require('../app.json').expo;
  const props = config.plugins.find(plugin => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen')[1];
  const projectRoot = mkdtempSync(join(tmpdir(), 'annapurna-splash-'));
  mkdirSync(join(projectRoot, 'src/assets'), { recursive: true });
  const asset = join(__dirname, '..', props.image);
  copyFileSync(asset, join(projectRoot, props.image));
  await setSplashImageDrawablesAsync(config, { ...props, image: join(projectRoot, props.image), dark: {} }, projectRoot, 100);
  for (const density of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
    const generated = join(projectRoot, `android/app/src/main/res/drawable-${density}/splashscreen_logo.png`);
    assert.ok(existsSync(generated), `Android splash drawable missing for ${density}`);
    assert.deepEqual(readFileSync(generated).subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
});
