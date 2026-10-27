const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const source = ts.createSourceFile('api.ts', readFileSync(
  join(__dirname, '../src/services/api.ts'), 'utf8'), ts.ScriptTarget.Latest, true);
let callback;
function findCallback(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'analyzeBatch') {
    callback = node.initializer.getText(source);
  }
  ts.forEachChild(node, findCallback);
}
findCallback(source);
assert.ok(callback);
const code = ts.transpile(`(${callback})(['aGVsbG8='], 'image/webp', 'Tomato', 1, 2)`, {
  target: ts.ScriptTarget.ES2020,
});

for (const platform of ['android', 'ios', 'web']) {
  test(`${platform} scan sends image data and cleans up temporary files`, async () => {
    const fields = [];
    const files = [];
    const response = { aggregated: { visual_quality_score: 72 } };
    const result = await vm.runInNewContext(code, {
      Platform: { OS: platform }, Paths: { cache: 'file:///cache/' },
      File: class {
        constructor(cache, name) { this.uri = cache + name; files.push(this); }
        write(data, options) { this.data = data; this.options = options; this.exists = true; }
        delete() { this.exists = false; }
      },
      FormData: class { append(...args) { fields.push(args); } },
      Blob, atob, getAuthToken: async () => 'token', BASE_URL: 'http://api',
      fetch: async (url, options) => {
        assert.equal(url, 'http://api/api/v5/vision/analyze-batch');
        assert.equal(options.headers.Authorization, 'Bearer token');
        if (platform === 'web') {
          assert.equal(await fields[0][1].text(), 'hello');
        } else {
          assert.equal(files[0].exists, true);
          assert.equal(files[0].data, 'aGVsbG8=');
          assert.equal(files[0].options.encoding, 'base64');
          assert.equal(fields[0][1].uri, files[0].uri);
          assert.equal(fields[0][1].type, 'image/webp');
        }
        return { ok: true, json: async () => response };
      },
    });
    assert.equal(result, response);
    assert.ok(files.every(file => !file.exists));
    assert.equal(fields.length, 4);
  });
}

test('failed native upload removes the temporary image and preserves the error', async () => {
  let exists = false;
  const networkError = new Error('Network request failed');
  await assert.rejects(vm.runInNewContext(code, {
    Platform: { OS: 'android' }, Paths: { cache: 'file:///cache/' },
    File: class {
      constructor() { this.uri = 'file:///cache/scan.webp'; }
      write() { exists = true; }
      get exists() { return exists; }
      delete() { exists = false; }
    },
    FormData: class { append() {} }, getAuthToken: async () => null, BASE_URL: 'http://api',
    fetch: async () => { throw networkError; },
  }), error => error === networkError);
  assert.equal(exists, false);
});
