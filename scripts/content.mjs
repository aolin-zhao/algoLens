import { readFileSync, realpathSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const identifier = value => { assert.match(value, /^[a-z0-9][a-z0-9-]*$/); return value; };
const text = value => { assert.equal(typeof value, 'string'); assert.ok(value.trim().length && value.length <= 50000); return value; };
const unique = values => assert.equal(new Set(values).size, values.length, 'Duplicate content identity');
const order = value => { assert.ok(Number.isSafeInteger(value) && value >= 0); return value; };

export function loadContent(root = resolve('content')) {
  root = realpathSync(root);
  const read = path => {
    const file = realpathSync(resolve(root, path));
    assert.ok(file.startsWith(root + sep), 'Content path escapes package');
    return readFileSync(file, 'utf8');
  };
  const json = path => JSON.parse(read(path));
  const manifest = json('manifest.json');
  identifier(manifest.id); assert.ok(Number.isSafeInteger(manifest.version) && manifest.version > 0);
  unique(manifest.problems); unique(manifest.lists); unique(manifest.languages.map(x => x.id)); unique(manifest.tags.map(x => x.id));
  manifest.languages.forEach(x => { identifier(x.id); text(x.label); assert.ok([0,1,2].includes(x.supportLevel)); assert.ok([0,1].includes(x.enabled)); });
  manifest.tags.forEach(x => { identifier(x.id); text(x.name); });
  const rows = { problems: [], problem_examples: [], test_cases: [], language_templates: [], problem_lists: [], problem_list_items: [], solutions: [], solution_implementations: [] };
  const problemIds = new Map();
  for (const slug of manifest.problems) {
    identifier(slug);
    const base = `problems/${slug}/`, p = json(base + 'problem.json');
    assert.equal(p.slug, slug); assert.match(p.id, /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.ok(['easy','medium','hard'].includes(p.difficulty)); assert.ok(['published','draft'].includes(p.status));
    problemIds.set(slug, p.id);
    unique(p.tags); p.tags.forEach(id => assert.ok(manifest.tags.some(t => t.id === id), 'Unknown tag'));
    rows.problems.push({ id:p.id, slug, title:text(p.title), description:text(read(base+p.description)), difficulty:p.difficulty, status:p.status, _tags:p.tags });
    for (const e of json(base+'examples.json')) {
      JSON.parse(e.input); JSON.parse(e.output);
      rows.problem_examples.push({ id:identifier(e.id), problem_id:p.id, input:text(e.input), output:text(e.output), explanation:e.explanation ?? null, sort_order:order(e.sort_order) });
    }
    for (const t of json(base+'tests.json')) {
      JSON.parse(t.input); JSON.parse(t.expected_output); assert.ok([0,1].includes(t.hidden));
      rows.test_cases.push({ id:identifier(t.id), problem_id:p.id, input:text(t.input), expected_output:text(t.expected_output), hidden:t.hidden });
    }
    const implementation = (t, folder) => {
      identifier(t.id); assert.ok(manifest.languages.some(l => l.id===t.languageId), 'Unknown language'); assert.ok(['core','main'].includes(t.mode));
      return {id:t.id, language_id:t.languageId, mode:t.mode, code:text(read(folder+t.code))};
    };
    for (const t of p.templates) {
      if(t.mode==='core') {
        assert.ok(t.invocation && Array.isArray(t.invocation.arguments));
        text(t.invocation.method); text(t.invocation.className);
        t.invocation.arguments.forEach(text);
      }
      rows.language_templates.push({...implementation(t,base), problem_id:p.id, invocation:t.invocation ? JSON.stringify(t.invocation) : null});
    }
    unique(p.solutions);
    for (const key of p.solutions) {
      identifier(key); const folder=base+`solutions/${key}/`, s=json(folder+'solution.json');
      assert.equal(s.slug,key); identifier(s.id); assert.ok(s.diagram===null || s.diagram==='two-sum-hash-map');
      rows.solutions.push({id:s.id,problem_id:p.id,slug:key,title:text(s.title),explanation:text(read(folder+s.explanation)),time_complexity:text(s.timeComplexity),space_complexity:text(s.spaceComplexity),sort_order:order(s.order),status:'published',diagram:s.diagram});
      assert.ok(s.implementations.length, 'Solution needs an implementation');
      for(const i of s.implementations) rows.solution_implementations.push({...implementation(i,folder),solution_id:s.id});
    }
  }
  for(const slug of manifest.lists) {
    identifier(slug); const l=json(`lists/${slug}.json`); assert.equal(l.slug,slug); identifier(l.id); assert.equal(new URL(l.sourceUrl).protocol,'https:');
    rows.problem_lists.push({id:l.id,slug,title:text(l.title),description:text(l.description),source_url:l.sourceUrl,status:'published'});
    unique(l.items.map(i=>i.problem));
    for(const i of l.items) { assert.ok(problemIds.has(i.problem),'Unknown problem'); rows.problem_list_items.push({list_id:l.id,problem_id:problemIds.get(i.problem),group_name:text(i.group),sort_order:order(i.order)}); }
  }
  for(const [table,items] of Object.entries(rows)) if(table!=='problem_list_items') unique(items.map(x=>x.id));
  unique(rows.problems.map(x=>x.slug));
  unique(rows.language_templates.map(x=>[x.problem_id,x.language_id,x.mode].join(':')));
  unique(rows.solution_implementations.map(x=>[x.solution_id,x.language_id,x.mode].join(':')));
  const hash=createHash('sha256').update(JSON.stringify({manifest,rows})).digest('hex');
  return {manifest,rows,hash};
}
const quote = value => value===null ? 'NULL' : typeof value==='number' ? String(value) : "'"+String(value).replaceAll("'","''")+"'";
export function contentSql({manifest:m,rows,hash}) {
  const pkg=quote(m.id), now='unixepoch()*1000';
  const changed=`NOT EXISTS (SELECT 1 FROM content_syncs WHERE package_id=${pkg} AND hash=${quote(hash)})`;
  // Abort the atomic import on downgrade or a changed package without a version bump.
  const sql=[`INSERT INTO content_syncs (package_id,version,hash,synced_at) SELECT NULL,0,'invalid content version',0 WHERE EXISTS (SELECT 1 FROM content_syncs WHERE package_id=${pkg} AND (version>${m.version} OR (version=${m.version} AND hash<>${quote(hash)})));`];
  const insertOnly=(table,row)=>{ const keys=Object.keys(row); sql.push(`INSERT INTO ${table} (${keys.join(',')},created_at,updated_at) VALUES (${keys.map(k=>quote(row[k])).join(',')},${now},${now}) ON CONFLICT DO NOTHING;`); };
  for(const role of ['admin','user']) insertOnly('roles',{id:role,name:role});
  for(const l of m.languages) insertOnly('languages',{id:l.id,label:l.label,support_level:l.supportLevel,enabled:l.enabled});
  for(const t of m.tags) insertOnly('tags',t);
  for(const table of ['problems','problem_examples','test_cases','language_templates','problem_lists','solutions','solution_implementations','problem_list_items']) {
    for(const original of rows[table]) {
      const {_tags,...row}=original; const relation=table==='problem_list_items';
      const keys=Object.keys(row), conflict=relation?'list_id,problem_id':'id';
      const updates=keys.filter(k=>!conflict.split(',').includes(k)).map(k=>`${k}=excluded.${k}`);
      if(!relation) updates.push(`updated_at=${now}`,'deleted_at=NULL');
      sql.push(`INSERT INTO ${table} (${keys.join(',')},content_package${relation?'':',created_at,updated_at'}) SELECT ${keys.map(k=>quote(row[k])).join(',')},${pkg}${relation?'':`,${now},${now}`} WHERE ${changed} ON CONFLICT(${conflict}) DO UPDATE SET ${updates.join(',')} WHERE ${table}.content_package=${pkg};`);
      if(_tags) for(const tag of _tags) sql.push(`INSERT INTO problem_tags (problem_id,tag_id) SELECT ${quote(row.id)},${quote(tag)} WHERE EXISTS (SELECT 1 FROM problems WHERE id=${quote(row.id)} AND content_package=${pkg}) ON CONFLICT DO NOTHING;`);
    }
    // Retire package-owned children; keep problems when removed from a list.
    if(['solutions','solution_implementations','problem_examples','test_cases','language_templates','problem_lists'].includes(table)) {
      const ids=rows[table].map(x=>quote(x.id)).join(',');
      sql.push(`UPDATE ${table} SET deleted_at=${now},updated_at=${now} WHERE content_package=${pkg} AND deleted_at IS NULL AND ${ids?`id NOT IN (${ids})`:'1=1'} AND ${changed};`);
    }
  }
  const keep=rows.problem_list_items.map(i=>`(${quote(i.list_id)},${quote(i.problem_id)})`).join(',');
  sql.push(`DELETE FROM problem_list_items WHERE content_package=${pkg} AND ${keep?`(list_id,problem_id) NOT IN (${keep})`:'1=1'} AND ${changed};`);
  sql.push(`INSERT INTO content_syncs (package_id,version,hash,synced_at) VALUES (${pkg},${m.version},${quote(hash)},${now}) ON CONFLICT(package_id) DO UPDATE SET version=excluded.version,hash=excluded.hash,synced_at=excluded.synced_at WHERE content_syncs.hash<>excluded.hash;`);
  return sql.join('\n')+'\n';
}
