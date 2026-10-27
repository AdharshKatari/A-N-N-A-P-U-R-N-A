const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const source = ts.createSourceFile('AuthContext.tsx', readFileSync(
  join(__dirname, '../src/context/AuthContext.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const callbacks = {};
function findCallbacks(node) {
  if (ts.isVariableDeclaration(node) && ['login', 'register', 'loadStoredAuth'].includes(node.name.getText(source))) {
    callbacks[node.name.getText(source)] = node.initializer.arguments[0].getText(source);
  }
  ts.forEachChild(node, findCallbacks);
}
findCallbacks(source);

class ApiError extends Error {
  constructor(status) { super('Unauthorized'); this.status = status; }
}

async function runAuth(name, storage, authResult, authError) {
  const state = { writes: [], cleared: false };
  const auth = async () => {
    if (authError) throw authError;
    return authResult;
  };
  const code = ts.transpile(`(${callbacks[name]})('farmer', 'password')`, { target: ts.ScriptTarget.ES2020 });
  const result = vm.runInNewContext(code, {
    AsyncStorage: {
      getItem: async key => storage[key] ?? null,
      setItem: async (key, value) => state.writes.push([key, value]),
    },
    api: {
      auth: { login: auth, register: auth, me: auth },
      setAuthToken: async token => { state.apiToken = token; },
      clearAuthToken: async () => { state.cleared = true; },
    },
    setToken: token => { state.token = token; },
    setUser: user => { state.user = user; },
    setIsLoading: value => { state.loading = value; },
    ApiError, console: { warn() {} },
  });
  return { state, result };
}

test('a fresh app has no fabricated authenticated session', async () => {
  const { state, result } = await runAuth('loadStoredAuth', {});
  await result;
  assert.equal(state.token, undefined);
  assert.equal(state.user, undefined);
  assert.equal(state.loading, false);
});

for (const method of ['login', 'register']) {
  test(`failed ${method} propagates the error without saving a fake token`, async () => {
    const failure = new Error('Credentials rejected');
    const { state, result } = await runAuth(method, {}, null, failure);
    await assert.rejects(result, error => error === failure);
    assert.equal(state.token, undefined);
    assert.equal(state.writes.length, 0);
  });

  test(`successful ${method} saves the backend-issued token`, async () => {
    const token = { access_token: 'signed-token', user_id: 'user-1', username: 'farmer' };
    const { state, result } = await runAuth(method, {}, token);
    assert.equal(await result, token);
    assert.equal(state.token, 'signed-token');
    assert.equal(state.apiToken, 'signed-token');
    assert.deepEqual(state.writes, [
      ['auth_token', 'signed-token'], ['user_id', 'user-1'], ['username', 'farmer'],
    ]);
  });
}

test('an invalid restored session is cleared', async () => {
  const { state, result } = await runAuth('loadStoredAuth', {
    auth_token: 'jwt-session-old', user_id: 'user-1', username: 'farmer',
  }, null, new ApiError(401));
  await result;
  assert.equal(state.cleared, true);
  assert.equal(state.token, null);
  assert.equal(state.user, null);
});

for (const [screen, handler] of [['LoginScreen', 'handleLogin'], ['LoginScreen', 'handleQuickDemo'], ['RegisterScreen', 'handleRegister']]) {
  test(`${handler} returns to analysis while preserving its captured samples`, async () => {
    const source = ts.createSourceFile(`${screen}.tsx`, readFileSync(
      join(__dirname, `../src/screens/${screen}.tsx`), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let callback;
    function findHandler(node) {
      if (ts.isVariableDeclaration(node) && node.name.getText(source) === handler) {
        callback = (ts.isCallExpression(node.initializer) ? node.initializer.arguments[0] : node.initializer).getText(source);
      }
      ts.forEachChild(node, findHandler);
    }
    findHandler(source);
    const navigations = [];
    const noop = () => {};
    await vm.runInNewContext(ts.transpile(`(${callback})()`, { target: ts.ScriptTarget.ES2020 }), {
      returnTo: 'Analysis', isFormValid: true, loading: false,
      username: 'farmer', password: 'password', confirmPassword: 'password',
      login: async () => {}, register: async () => {},
      setLoading: noop, setShowSuccess: noop, setShowConfetti: noop, setShakeTrigger: noop,
      setUsername: noop, setPassword: noop, hapticMedium: noop, hapticLight: noop,
      Alert: { alert: () => assert.fail('Unexpected login failure') },
      setTimeout: callback => callback(),
      navigation: { popTo: (...args) => navigations.push(args), replace: () => assert.fail('Must retain analysis screen') },
    });
    assert.equal(navigations.length, 1);
    assert.equal(navigations[0][0], 'Analysis');
    assert.equal(navigations[0][2].merge, true);
  });
}
