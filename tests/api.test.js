import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ApiError,
  createApiClient,
  normalizeExpression,
} from '../js/api.js';

test('normalizeExpression converts display operators and trims spaces', () => {
  assert.equal(normalizeExpression(' 12×3÷2−1 '), '12*3/2-1');
});

test('calculate sends JSON to backend', async () => {
  const calls = [];
  const client = createApiClient('http://api.test', async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true, expression: '1+1', result: 2 }),
    };
  });

  const result = await client.calculate('1+1');

  assert.equal(result.result, 2);
  assert.equal(calls[0].url, 'http://api.test/api/calculate');
  assert.equal(calls[0].options.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].options.body), { expression: '1+1' });
});

test('getHistory returns backend items', async () => {
  const client = createApiClient('http://api.test', async () => ({
    ok: true,
    status: 200,
    json: async () => ({ success: true, items: [{ id: 4 }] }),
  }));

  assert.deepEqual(await client.getHistory(), [{ id: 4 }]);
});

test('deleteHistory accepts empty 204 response', async () => {
  const client = createApiClient('http://api.test', async (_url, options) => {
    assert.equal(options.method, 'DELETE');
    return { ok: true, status: 204, json: async () => null };
  });

  assert.equal(await client.deleteHistory(4), null);
});

test('backend errors become ApiError', async () => {
  const client = createApiClient('http://api.test', async () => ({
    ok: false,
    status: 400,
    json: async () => ({ success: false, message: 'Division by zero' }),
  }));

  await assert.rejects(
    () => client.calculate('1/0'),
    (error) => error instanceof ApiError
      && error.status === 400
      && error.message === 'Division by zero',
  );
});
