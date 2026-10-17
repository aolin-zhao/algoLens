import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync, mkdtempSync, cpSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { runInNewContext, Script } from 'node:vm';
import ts from 'typescript';
import { loadContent, contentSql } from '../content.mjs';

const content = loadContent();
const problemId = content.rows.problems[0].id;
const rows = (db, table) => db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all();
function database(legacy = false) {
  const db = new DatabaseSync(':memory:');
  const files = readdirSync('migrations').filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    if (legacy && file.startsWith('0003')) db.exec(readFileSync('scripts/seed.sql', 'utf8'));
    db.exec(readFileSync(`migrations/${file}`, 'utf8'));
  }
  return db;
}
function sync(db, value = content) {
  db.exec('BEGIN');
  try { db.exec(contentSql(value)); db.exec('COMMIT'); }
  catch (error) { db.exec('ROLLBACK'); throw error; }
}
function nextVersion(mutator) {
  const value = structuredClone(content);
  value.manifest.version++;
  value.hash = 'test-next-content-hash';
  mutator(value);
  return value;
}

test('fresh install creates the complete curated list and solutions; rerun is a no-op', () => {
  const db = database(); sync(db);
  assert.equal(rows(db, 'problem_lists').length, 1);
  assert.equal(rows(db, 'problems').length, content.rows.problems.length);
  assert.equal(rows(db, 'problem_list_items').length, content.rows.problem_list_items.length);
  assert.equal(rows(db, 'solutions').length, content.rows.solutions.length);
  assert.equal(rows(db, 'solution_implementations').length, content.rows.solution_implementations.length);
  assert.equal(rows(db, 'test_cases').length, content.rows.test_cases.length);
  const tables = [...Object.keys(content.rows), 'content_syncs', 'tags', 'problem_tags', 'roles', 'languages'];
  const before = tables.map(t => rows(db, t));
  sync(db); assert.deepEqual(tables.map(t => rows(db, t)), before);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  db.close();
});

test('legacy upgrade preserves modified content, deleted content and all user records', () => {
  const db = database(true);
  db.exec(`UPDATE problems SET title='我的题面',description='管理员修改',updated_at=123;
    UPDATE language_templates SET code='我的模板',updated_at=456;
    UPDATE problem_examples SET deleted_at=111 WHERE sort_order=1;
    INSERT INTO users(id,email,password_hash,display_name,created_at,updated_at) VALUES('user-1','test@example.com','hash','Test',1,1);
    INSERT INTO saved_codes(id,user_id,problem_id,language_id,code,mode,created_at,updated_at) VALUES('saved','user-1','${problemId}','python','my draft','core',1,1);
    INSERT INTO favorites(user_id,problem_id,created_at) VALUES('user-1','${problemId}',1);
    INSERT INTO sessions(id,user_id,token_hash,expires_at,created_at,updated_at) VALUES('session','user-1','token',99999,1,1);
    INSERT INTO execution_jobs(id,user_id,language_id,code_key,input,created_at,updated_at) VALUES('job','user-1','python','code/key','{}',1,1);
    INSERT INTO execution_records(id,job_id,created_at,updated_at) VALUES('record','job',1,1);
    INSERT INTO submissions(id,user_id,problem_id,language_id,code_key,created_at,updated_at) VALUES('submission','user-1','${problemId}','python','code/key',1,1);`);
  const preserved = ['problems','problem_examples','language_templates','test_cases','users','saved_codes','favorites','sessions','execution_jobs','execution_records','submissions'];
  const before = preserved.map(t => rows(db,t));
  sync(db); sync(db);
  assert.deepEqual(preserved.map(t => ['problems','problem_examples','language_templates','test_cases'].includes(t)
    ? db.prepare(`SELECT * FROM ${t} WHERE content_package IS NULL ORDER BY rowid`).all()
    : rows(db,t)), before);
  assert.equal(rows(db,'solutions').length, content.rows.solutions.length);
  assert.equal(rows(db,'problem_list_items')[0].problem_id, problemId);
  db.close();
});

test('version update changes managed content, retires removed solutions and preserves custom solutions', () => {
  const db = database(); sync(db);
  db.exec(`INSERT INTO solutions(id,problem_id,slug,title,explanation,time_complexity,space_complexity,status,created_at,updated_at) VALUES('custom','${problemId}','custom','自定义','说明','O(n)','O(n)','published',1,1)`);
  const custom = db.prepare("SELECT * FROM solutions WHERE id='custom'").get();
  const next = nextVersion(v => {
    v.rows.problems[0].description = "修订后的题面 ' 测试转义";
    v.rows.solutions = v.rows.solutions.filter(s => s.slug === 'hash-map');
    v.rows.solutions[0].title = '更新哈希表讲解';
    v.rows.solution_implementations = v.rows.solution_implementations.filter(i => i.solution_id === v.rows.solutions[0].id);
    v.rows.problem_list_items = [];
  });
  sync(db,next);
  assert.equal(rows(db,'problems')[0].description,next.rows.problems[0].description);
  assert.equal(db.prepare("SELECT title FROM solutions WHERE slug='hash-map'").get().title, '更新哈希表讲解');
  assert.ok(db.prepare("SELECT deleted_at FROM solutions WHERE slug='brute-force'").get().deleted_at);
  assert.equal(rows(db,'problem_list_items').length,0);
  assert.deepEqual(db.prepare("SELECT * FROM solutions WHERE id='custom'").get(),custom);
  assert.equal(rows(db,'problems')[0].deleted_at,null);
  assert.throws(() => sync(db), /NOT NULL/);
  db.close();
});

test('same version with changed content is rejected; failed imports roll back and can retry', () => {
  const db=database(); sync(db);
  const reused=structuredClone(content);reused.hash='changed';
  assert.throws(()=>sync(db,reused), /NOT NULL/);
  const before=rows(db,'problems');
  const broken=nextVersion(v=>{v.rows.problems[0].title='Must roll back';v.rows.solution_implementations[0].language_id='missing';});
  assert.throws(()=>sync(db,broken),/FOREIGN KEY/);
  assert.deepEqual(rows(db,'problems'),before);
  assert.equal(rows(db,'content_syncs')[0].version,content.manifest.version);
  broken.rows.solution_implementations[0].language_id=content.rows.solution_implementations[0].language_id;sync(db,broken);
  assert.equal(rows(db,'content_syncs')[0].version,content.manifest.version+1);
  db.close();
});

test('a new solution can be added without replacing existing implementations', () => {
  const db=database(); sync(db);
  const original=rows(db,'solution_implementations');
  const next=nextVersion(v=>{
    v.rows.solutions.push({...v.rows.solutions[0],id:'third-approach',slug:'third-approach',title:'新增思路',sort_order:2});
    v.rows.solution_implementations.push({...v.rows.solution_implementations[0],id:'third-python',solution_id:'third-approach'});
  });
  sync(db,next); sync(db,next);
  assert.equal(rows(db,'solutions').length,content.rows.solutions.length+1);
  assert.equal(rows(db,'solution_implementations').length,original.length+1);
  for(const item of original) assert.equal(db.prepare('SELECT code FROM solution_implementations WHERE id=?').get(item.id).code,item.code);
  db.close();
});

test('validation catches broken references and duplicates before any write', () => {
  const root=mkdtempSync(join(tmpdir(),'content-validation-'));
  try {
    cpSync('content',root,{recursive:true});
    const path=join(root,'lists/leetcode-hot-100.json');
    const list=JSON.parse(readFileSync(path,'utf8'));list.items[0].problem='missing';
    writeFileSync(path,JSON.stringify(list));assert.throws(()=>loadContent(root),/Unknown problem/);
    list.items[0].problem='two-sum';list.items.push(list.items[0]);
    writeFileSync(path,JSON.stringify(list));assert.throws(()=>loadContent(root),/Duplicate/);
  } finally {rmSync(root,{recursive:true,force:true});}
});

test('all curated Python, JavaScript and TypeScript solutions pass their bundled cases', () => {
  const solutionById = new Map(content.rows.solutions.map(s => [s.id, s]));
  const templateByProblem = new Map(content.rows.language_templates.filter(t => t.mode === 'core' && t.language_id === 'python').map(t => [t.problem_id, JSON.parse(t.invocation)]));
  for(const implementation of content.rows.solution_implementations.filter(i => i.language_id === 'python' && solutionById.get(i.solution_id).slug !== 'reference')) {
    const problemId = solutionById.get(implementation.solution_id).problem_id;
    const invocation = templateByProblem.get(problemId);
    const cases = content.rows.test_cases.filter(t => t.problem_id === problemId);
    const result=spawnSync('python3',['-c',`${implementation.code}\nimport json\nconfig=json.loads(${JSON.stringify(JSON.stringify(invocation))})\ncases=json.loads(input())\nfor case in cases:\n    data=json.loads(case['input'])\n    actual=getattr(Solution(), config['method'])(*[data[key] for key in config['arguments']])\n    expected=json.loads(case['expected_output'])\n    if config['method']=='twoSum':\n        actual,expected=sorted(actual),sorted(expected)\n    assert actual==expected, (data,actual,expected)\n`],{input:JSON.stringify(cases),encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);
  }
  for (const implementation of content.rows.solution_implementations.filter(i => ['javascript', 'typescript'].includes(i.language_id) && solutionById.get(i.solution_id).slug !== 'reference')) {
    const problemId = solutionById.get(implementation.solution_id).problem_id;
    const template = content.rows.language_templates.find(t => t.problem_id === problemId && t.language_id === implementation.language_id && t.mode === 'core');
    const invocation = JSON.parse(template.invocation);
    const code = implementation.language_id === 'typescript'
      ? ts.transpileModule(implementation.code, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
      : implementation.code;
    for (const testCase of content.rows.test_cases.filter(t => t.problem_id === problemId)) {
      const data = JSON.parse(testCase.input);
      const actual = runInNewContext(`${code}\n${invocation.method}(...args)`, {args: invocation.arguments.map(key => data[key])});
      assert.deepEqual(JSON.parse(JSON.stringify(actual)), JSON.parse(testCase.expected_output));
    }
  }
});

test('imported Python, JavaScript and TypeScript reference code parses', () => {
  const references = new Set(content.rows.solutions.filter(s => s.slug === 'reference').map(s => s.id));
  const implementations = content.rows.solution_implementations.filter(i => references.has(i.solution_id));
  const python = implementations.filter(i => i.language_id === 'python');
  const result = spawnSync('python3', ['-c', 'import ast,json,sys\nfor item in json.load(sys.stdin): ast.parse(item["code"], filename=item["id"])'],
    {input:JSON.stringify(python),encoding:'utf8'});
  assert.equal(result.status, 0, result.stderr);
  for (const item of implementations.filter(i => i.language_id === 'javascript')) {
    assert.doesNotThrow(() => new Script(item.code), item.id);
  }
  for (const item of implementations.filter(i => i.language_id === 'typescript')) {
    const compiled = ts.transpileModule(item.code, {reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022}});
    assert.deepEqual(compiled.diagnostics, [], item.id);
  }
});
