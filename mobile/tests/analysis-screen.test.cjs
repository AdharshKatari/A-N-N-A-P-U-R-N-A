const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

// Run the screen's real request callback without needing a native UI runtime.
const source = ts.createSourceFile('AnalysisScreen.tsx', readFileSync(
  join(__dirname, '../src/screens/AnalysisScreen.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let callback;
function findCallback(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'processVision') {
    callback = node.initializer.arguments[0].getText(source);
  }
  ts.forEachChild(node, findCallback);
}
findCallback(source);
assert.ok(callback, 'Analysis request callback exists');
const code = ts.transpile(`(${callback})()`, { target: ts.ScriptTarget.ES2020 });

async function runAnalysis(analysisError, queueError, nestedScore) {
  const state = { queued: [], navigations: [] };
  const result = {
    crop_identified: 'Tomato', visual_quality_score: 72, confidence: 93,
    ripeness_stage: 'Optimal', fungal_pathogen_presence: false,
  };
  await vm.runInNewContext(code, {
    samples: [{ base64: 'sample' }], cropType: 'Tomato', effectiveGps: { lat: 1, lng: 2 },
    setLoadingVision: value => { state.loading = value; },
    setError: value => { state.error = value; },
    setRequiresLogin: value => { state.requiresLogin = value; },
    setVisionResult: value => { state.result = value; },
    analyzeBatch: async () => {
      if (analysisError) throw analysisError;
      if (nestedScore !== undefined) return {
        aggregated: { ...result, visual_quality_score: nestedScore },
        individual_results: [{ ...result, sequence: 1 }],
      };
      return result;
    },
    SyncService: { queueBatch: async batch => {
      if (queueError) throw queueError;
      state.queued.push(batch);
    } },
    navigation: { navigate: (...args) => state.navigations.push(args) },
    Alert: { alert() {} }, console: { error() {} },
  });
  return state;
}

test('successful scan retains its AI score without navigating away', async () => {
  const state = await runAnalysis();
  assert.equal(state.result.visual_quality_score, 72);
  assert.equal(state.error, null);
  assert.equal(state.loading, false);
  assert.equal(state.navigations.length, 0);
  assert.equal(state.queued.length, 0);
});

test('screen reads the backend aggregate and preserves a zero quality score', async () => {
  const state = await runAnalysis(null, null, 0);
  assert.equal(state.result.visual_quality_score, 0);
  assert.equal(state.result.individualResults.length, 1);
  assert.equal(state.navigations.length, 0);
});

test('failed analysis stays on screen with a saved scan and retry instructions', async () => {
  const state = await runAnalysis(new Error('Service unavailable'));
  assert.equal(state.navigations.length, 0);
  assert.equal(state.loading, false);
  assert.match(state.error, /Service unavailable/);
  assert.match(state.error, /Scan saved.*Retry Vision.*Manual Assessment/);
  assert.equal(state.queued.length, 1);
  assert.deepEqual(JSON.parse(state.queued[0].images), ['sample']);
});

test('failed offline save stays on screen without claiming the scan was saved', async () => {
  const state = await runAnalysis(new Error('Service unavailable'), new Error('Storage full'));
  assert.equal(state.navigations.length, 0);
  assert.equal(state.loading, false);
  assert.match(state.error, /Service unavailable/);
  assert.doesNotMatch(state.error, /Scan saved/);
});

test('unauthorized scan asks for sign-in without navigating or queuing offline', async () => {
  const state = await runAnalysis(Object.assign(new Error('Missing Authorization header'), { status: 401 }));
  assert.equal(state.requiresLogin, true);
  assert.match(state.error, /Sign in.*captured samples.*Retry Vision/);
  assert.equal(state.loading, false);
  assert.equal(state.navigations.length, 0);
  assert.equal(state.queued.length, 0);
});

test('offline queue propagates storage failures to the analysis screen', async () => {
  const storageError = new Error('Storage full');
  const exports = {};
  const code = ts.transpile(readFileSync(join(__dirname, '../src/services/SyncService.ts'), 'utf8'), {
    target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true,
  });
  vm.runInNewContext(code, {
    exports, console: { error() {} },
    require: name => {
      if (name === 'react-native') return { Platform: { OS: 'web' } };
      if (name === '@react-native-async-storage/async-storage') return {
        getItem: async () => null, setItem: async () => { throw storageError; },
      };
      if (name === './api') return {};
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  await assert.rejects(exports.default.queueBatch({ crop_type: 'Tomato', images: '[]' }),
    error => error === storageError);
});
