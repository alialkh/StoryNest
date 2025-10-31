import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  resetAuthStoreDependencies,
  resetAuthStoreState,
  setAuthStoreDependencies,
  useAuthStore
} from '../src/store/authStore';
import type { AuthStoreDependencies } from '../src/store/authStore';
import type { AuthUser } from '../src/types';

type StorageCall = { method: 'getItem' | 'setItem' | 'removeItem'; args: unknown[] };

type ApiCall = { method: 'get' | 'post'; args: unknown[] };

const createMockStorage = () => {
  const calls: StorageCall[] = [];
  const data = new Map<string, string>();

  return {
    calls,
    data,
    async getItem(key: string) {
      calls.push({ method: 'getItem', args: [key] });
      return data.has(key) ? data.get(key)! : null;
    },
    async setItem(key: string, value: string) {
      calls.push({ method: 'setItem', args: [key, value] });
      data.set(key, value);
    },
    async removeItem(key: string) {
      calls.push({ method: 'removeItem', args: [key] });
      data.delete(key);
    }
  };
};

const createMockApi = () => {
  const calls: ApiCall[] = [];
  let getResponse: unknown = null;
  let postResponse: unknown = null;
  let postError: unknown = null;

  return {
    calls,
    setGetResponse(response: unknown) {
      getResponse = response;
    },
    setPostResponse(response: unknown) {
      postResponse = response;
      postError = null;
    },
    setPostError(error: unknown) {
      postError = error;
      postResponse = null;
    },
    async get(url: string) {
      calls.push({ method: 'get', args: [url] });
      if (getResponse instanceof Error) {
        throw getResponse;
      }
      return getResponse ?? { data: {} };
    },
    async post(url: string, payload: unknown) {
      calls.push({ method: 'post', args: [url, payload] });
      if (postError) {
        throw postError;
      }
      return postResponse ?? { data: {} };
    }
  };
};

const createDependencies = () => {
  const storage = createMockStorage();
  const api = createMockApi();
  const authTokenCalls: Array<string | null> = [];

  const deps: Partial<AuthStoreDependencies> = {
    storage: storage as unknown as AuthStoreDependencies['storage'],
    api: api as unknown as AuthStoreDependencies['api'],
    setAuthToken: ((token: string | null) => {
      authTokenCalls.push(token);
    }) as AuthStoreDependencies['setAuthToken']
  };

  return { storage, api, deps, authTokenCalls };
};

beforeEach(() => {
  resetAuthStoreDependencies();
  resetAuthStoreState();
});

test('initialise hydrates from API when a token is stored', async () => {
  const { storage, api, deps, authTokenCalls } = createDependencies();
  const user: AuthUser = { id: 'user-1', email: 'reader@example.com', tier: 'FREE' };

  storage.data.set('storynest:token', 'token-123');
  api.setGetResponse({ data: { user } });

  setAuthStoreDependencies(deps);

  await useAuthStore.getState().initialise();

  const state = useAuthStore.getState();
  assert.deepEqual(state.user, user);
  assert.equal(state.token, 'token-123');
  assert.equal(authTokenCalls[0], 'token-123');
  assert.equal(storage.data.get('storynest:user'), JSON.stringify(user));
  assert.deepEqual(api.calls, [{ method: 'get', args: ['/auth/me'] }]);
});

test('initialise falls back to cached user when token is missing', async () => {
  const { storage, deps, api } = createDependencies();
  const user: AuthUser = { id: 'user-2', email: 'cached@example.com', tier: 'PREMIUM' };

  storage.data.set('storynest:user', JSON.stringify(user));

  setAuthStoreDependencies(deps);

  await useAuthStore.getState().initialise();

  const state = useAuthStore.getState();
  assert.deepEqual(state.user, user);
  assert.equal(state.token, null);
  assert.equal(api.calls.length, 0);
});

test('login persists credentials and clears the loading flag on success', async () => {
  const { storage, api, deps, authTokenCalls } = createDependencies();
  const user: AuthUser = { id: 'user-3', email: 'login@example.com', tier: 'FREE' };

  api.setPostResponse({ data: { user, token: 'token-456' } });

  setAuthStoreDependencies(deps);

  await useAuthStore.getState().login('login@example.com', 'password123');

  const state = useAuthStore.getState();
  assert.deepEqual(state.user, user);
  assert.equal(state.token, 'token-456');
  assert.equal(state.loading, false);
  assert.equal(storage.data.get('storynest:token'), 'token-456');
  assert.equal(storage.data.get('storynest:user'), JSON.stringify(user));
  assert.equal(authTokenCalls.at(-1), 'token-456');
  assert.deepEqual(api.calls, [
    { method: 'post', args: ['/auth/login', { email: 'login@example.com', password: 'password123' }] }
  ]);
});

test('login surfaces an error message when the API call fails', async () => {
  const { deps, api } = createDependencies();

  api.setPostError(new Error('network-failure'));

  setAuthStoreDependencies(deps);

  await useAuthStore.getState().login('login@example.com', 'bad-password');

  const state = useAuthStore.getState();
  assert.equal(state.user, null);
  assert.equal(state.token, null);
  assert.equal(state.loading, false);
  assert.equal(state.error, 'Unable to login. Check your credentials.');
});

test('register follows the same happy path as login', async () => {
  const { storage, api, deps, authTokenCalls } = createDependencies();
  const user: AuthUser = { id: 'user-4', email: 'register@example.com', tier: 'PREMIUM' };

  api.setPostResponse({ data: { user, token: 'token-789' } });

  setAuthStoreDependencies(deps);

  await useAuthStore.getState().register('register@example.com', 'password123');

  const state = useAuthStore.getState();
  assert.deepEqual(state.user, user);
  assert.equal(state.token, 'token-789');
  assert.equal(state.loading, false);
  assert.equal(storage.data.get('storynest:token'), 'token-789');
  assert.equal(storage.data.get('storynest:user'), JSON.stringify(user));
  assert.equal(authTokenCalls.at(-1), 'token-789');
  assert.deepEqual(api.calls, [
    { method: 'post', args: ['/auth/register', { email: 'register@example.com', password: 'password123' }] }
  ]);
});

test('logout clears persisted credentials and auth token', async () => {
  const { storage, deps, authTokenCalls } = createDependencies();

  storage.data.set('storynest:token', 'token-logout');
  storage.data.set('storynest:user', '{"foo":"bar"}');

  setAuthStoreDependencies(deps);
  useAuthStore.setState({ user: { id: '1', email: 'test', tier: 'FREE' }, token: 'token-logout', loading: false, error: null });

  await useAuthStore.getState().logout();

  const state = useAuthStore.getState();
  assert.equal(state.user, null);
  assert.equal(state.token, null);
  assert(!storage.data.has('storynest:token'));
  assert(!storage.data.has('storynest:user'));
  assert.equal(authTokenCalls.at(-1), null);
});
