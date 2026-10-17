import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { loadContent, contentSql } from '../content.mjs';

test('public APIs filter unpublished/deleted content and keep list order and solution implementations', async () => {
  const require = createRequire(import.meta.url);
  const { build } = createRequire(require.resolve('wrangler/package.json'))('esbuild');
  const temp = mkdtempSync(join(tmpdir(), 'algovision-api-test-'));
  const db = new DatabaseSync(':memory:');
  try {
    const output = join(temp, 'routes.mjs');
    await build({ entryPoints: ['apps/api/src/content-routes.ts'], outfile: output, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
    const { contentRoutes } = await import(pathToFileURL(output).href);
    for (const file of readdirSync('migrations').filter(f => f.endsWith('.sql')).sort()) db.exec(readFileSync(`migrations/${file}`, 'utf8'));
    const content = loadContent(); db.exec(contentSql(content));
    // SQLite-backed adapter exercises the real Hono routes and Drizzle queries without network.
    const DB = { prepare(sql) {
      const statement = db.prepare(sql);
      return { bind(...values) {
        return {
          async raw() { statement.setReturnArrays(true); return statement.all(...values); },
          async all() { return { results: statement.all(...values) }; },
        };
      } };
    } };
    const get = path => contentRoutes.request(path, undefined, { DB });
    const id = content.rows.problems[0].id;
    let response = await get('/problem-lists');
    assert.equal(response.status, 200);
    assert.equal((await response.json()).items[0].count, content.rows.problems.length);
    response = await get('/problem-lists/leetcode-hot-100');
    const list = await response.json();
    assert.equal(list.items.length, content.rows.problems.length);
    assert.equal(list.items[0].id, id); assert.equal(list.items[0].group, '哈希');
    assert.equal(list.items[1].group, '哈希');
    assert.ok(new Set(list.items.map(item => item.group)).size > 1);
    const newId = content.rows.problems.find(problem => problem.slug === 'longest-consecutive-sequence').id;
    const newSolutions = await (await get(`/problems/${newId}/solutions`)).json();
    assert.deepEqual(newSolutions.items.map(s => s.slug), ['optimal']);
    assert.deepEqual(newSolutions.items[0].implementations.map(i => i.languageId).sort(), ['cpp', 'go', 'java', 'javascript', 'python', 'rust', 'typescript']);
    response = await get(`/problems/${id}/solutions`);
    const result = await response.json();
    assert.deepEqual(result.items.map(s => s.slug), ['brute-force', 'hash-map']);
    assert.equal(result.items[0].implementations.length, 5);
    assert.equal(result.items[1].implementations.length, 8);
    assert.equal(result.items[0].diagram, null);
    assert.equal(result.items[1].diagram, 'two-sum-hash-map');
    assert.equal((await get('/problem-lists/missing')).status, 404);
    db.exec("UPDATE solutions SET status='draft' WHERE slug='brute-force'; UPDATE solution_implementations SET deleted_at=1 WHERE solution_id LIKE '%hash-map'");
    const filtered = await (await get(`/problems/${id}/solutions`)).json();
    assert.equal(filtered.items.length, 1); assert.equal(filtered.items[0].implementations.length, 0);
    db.exec("UPDATE solutions SET deleted_at=1 WHERE slug='hash-map'");
    assert.equal((await (await get(`/problems/${id}/solutions`)).json()).items.length, 0);
    db.exec("UPDATE problems SET status='draft'");
    assert.equal((await get(`/problems/${id}/solutions`)).status, 404);
    assert.equal((await (await get('/problem-lists')).json()).items[0].count, 0);
    assert.equal((await (await get('/problem-lists/leetcode-hot-100')).json()).items.length, 0);
    db.exec("UPDATE problems SET status='published',deleted_at=1");
    assert.equal((await get(`/problems/${id}/solutions`)).status, 404);
    db.exec("UPDATE problem_lists SET status='draft'");
    assert.equal((await get('/problem-lists/leetcode-hot-100')).status, 404);
    assert.equal((await (await get('/problem-lists')).json()).items.length, 0);
    db.exec("UPDATE problem_lists SET status='published',deleted_at=1");
    assert.equal((await get('/problem-lists/leetcode-hot-100')).status, 404);
  } finally { db.close(); rmSync(temp, { recursive: true, force: true }); }
});
