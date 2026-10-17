import assert from 'node:assert/strict';
import { test } from 'node:test';
import { listResource } from '../src/admin-resources';
import { page, size } from '../src/repository';
import type { Bindings } from '../src/types';

test('pagination normalizes invalid inputs and bounds page sizes', () => {
  for (const raw of [undefined, '', '-1', '0', 'NaN', 'Infinity', '2oops', '1.5', '9'.repeat(400)]) assert.equal(page(raw), 1);
  assert.equal(page('3'), 3);
  assert.equal(size(undefined), 20);
  assert.equal(size('500'), 100);
  assert.equal(size('-1'), 1);
});

test('resource pagination applies the same search to count and rows, with stable ordering', async () => {
  const calls: { sql: string; values: unknown[] }[] = [];
  const env = { DB: { prepare(sql: string) {
    return { bind(...values: unknown[]) {
      calls.push({ sql, values });
      return { all: async () => ({ results: [{ id: 'tag-21' }] }), first: async () => ({ count: 45 }) };
    } };
  } } } as unknown as Bindings;
  assert.deepEqual(await listResource(env, 'tags', { page: '2', size: '20', q: ' graph ' }), {
    items: [{ id: 'tag-21' }], total: 45, page: 2, size: 20,
  });
  assert.match(calls[0].sql, /ORDER BY created_at DESC, id DESC LIMIT \? OFFSET \?/);
  assert.deepEqual(calls[0].values, ['%graph%', 20, 20]);
  assert.deepEqual(calls[1].values, ['%graph%']);
  assert.match(calls[1].sql, /deleted_at IS NULL AND name LIKE \?/);
  assert.equal(await listResource(env, 'unknown', {}), null);
  await listResource(env, 'system-settings', {});
  assert.match(calls[2].sql, /created_at DESC, key DESC/);
});
