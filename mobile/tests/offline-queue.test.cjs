const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function loadModule(path, imports) {
  const exports = {};
  vm.runInNewContext(ts.transpile(readFileSync(join(__dirname, path), 'utf8'), {
    target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true,
  }), {
    exports, console: { error() {} },
    require: name => {
      assert.ok(name in imports, `Unexpected import: ${name}`);
      return imports[name];
    },
  });
  return exports;
}

function queueModule(storage) {
  return loadModule('../src/utils/offlineQueue.ts', {
    '@react-native-async-storage/async-storage': storage,
    'expo-modules-core': { uuid: { v4: () => 'native-generated-uuid' } },
    '../constants/api': { API_BASE_URL: 'http://api' },
  });
}

test('offline entries use Expo native UUID support and persist their payload', async () => {
  let saved;
  const queue = queueModule({ getItem: async () => null, setItem: async (_, value) => { saved = JSON.parse(value); } });
  const id = await queue.enqueueTransaction('batch_create', { weight_kg: 10 });
  assert.equal(id, 'native-generated-uuid');
  assert.equal(saved[0].payload.weight_kg, 10);
});

test('both enqueue entry points propagate storage failures', async () => {
  const failure = new Error('Storage full');
  const queue = queueModule({ getItem: async () => null, setItem: async () => { throw failure; } });
  await assert.rejects(queue.enqueueTransaction('batch_create', {}), error => error === failure);
  await assert.rejects(queue.useOfflineQueue().enqueueTransaction('batch_create', {}), error => error === failure);
});

test('an unreadable existing queue cannot be silently replaced with an empty queue', async () => {
  let wrote = false;
  const queue = queueModule({
    getItem: async () => '{corrupt', setItem: async () => { wrote = true; },
  });
  await assert.rejects(queue.enqueueTransaction('batch_create', {}));
  assert.equal(wrote, false);
});

test('offline sync reuses the shared queue and removes its network listener', () => {
  let listeners = 0;
  const useOfflineQueue = () => ({ getPendingCount: async () => 0 });
  const sync = loadModule('../src/services/offlineSync.ts', {
    '../utils/offlineQueue': { useOfflineQueue },
    '@react-native-community/netinfo': { addEventListener: () => {
      listeners++;
      return () => { listeners--; };
    } },
    '../services/api': {},
    './SyncService': {},
  });
  assert.equal(sync.useOfflineQueue, useOfflineQueue);
  sync.initializeOfflineSync();
  assert.equal(listeners, 1);
  const cleanup = sync.initializeOfflineSync();
  assert.equal(listeners, 1);
  cleanup();
  sync.stopOfflineSync();
  assert.equal(listeners, 0);
});

for (const fails of [false, true]) {
  test(`saved scans ${fails ? 'remain retryable after a failed' : 'complete after a successful'} authenticated upload`, async () => {
    let stored = JSON.stringify([{
      id: 1, crop_type: 'Tomato', images: '["aGVsbG8="]', latitude: 1, longitude: 2, status: 'syncing',
    }]);
    const uploads = [];
    const sync = loadModule('../src/services/SyncService.ts', {
      'react-native': { Platform: { OS: 'web' } },
      '@react-native-async-storage/async-storage': {
        getItem: async () => stored, setItem: async (_, value) => { stored = value; },
      },
      './api': { analyzeBatch: async (...args) => {
        uploads.push(args);
        if (fails) throw new Error('Unauthorized');
      } },
    });
    await sync.default.syncPendingBatches();
    assert.equal(uploads.length, 1);
    assert.equal(uploads[0][0][0], 'aGVsbG8=');
    assert.equal(uploads[0][2], 'Tomato');
    const batches = JSON.parse(stored);
    assert.equal(batches.length, fails ? 1 : 0);
    if (fails) assert.equal(batches[0].status, 'failed');
  });
}
