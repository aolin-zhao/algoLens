import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { loadContent } from '../content.mjs';

const content = loadContent();
const problems = new Map(content.rows.problems.map(problem => [problem.id, problem]));
const solutions = new Map(content.rows.solutions.map(solution => [solution.id, solution]));

function comparable(slug, actual, expected, input) {
  if (slug === 'longest-palindromic-substring') {
    assert.equal(actual.length, expected.length);
    assert.ok(input.s.includes(actual));
    assert.equal(actual, [...actual].reverse().join(''));
    return;
  }
  if (slug === 'group-anagrams') {
    const normalize = groups => groups.map(group => [...group].sort()).map(group => JSON.stringify(group)).sort();
    assert.deepEqual(normalize(actual), normalize(expected));
    return;
  }
  if (slug === 'subsets') {
    const normalize = groups => groups.map(group => JSON.stringify([...group].sort((a,b) => a-b))).sort();
    assert.deepEqual(normalize(actual), normalize(expected));
    return;
  }
  assert.deepEqual(actual, expected);
}

test('Hot 100 content includes all official problems and available languages', () => {
  assert.equal(content.rows.problems.length, 100);
  assert.equal(content.rows.problem_list_items.length, 100);
  assert.equal(content.rows.solutions.length, 101);
  const languages = new Set(content.rows.solution_implementations.map(item => item.language_id));
  assert.deepEqual([...languages].sort(), ['c','cpp','go','java','javascript','python','rust','typescript']);
  for (const solution of content.rows.solutions) {
    const implementations = content.rows.solution_implementations.filter(item => item.solution_id === solution.id);
    assert.ok(implementations.length > 0, solution.id);
  }
});

test('runnable reference solutions match all public examples', () => {
  let checked = 0;
  for (const implementation of content.rows.solution_implementations) {
    if (!['python','javascript','typescript'].includes(implementation.language_id)) continue;
    const solution = solutions.get(implementation.solution_id);
    if (solution.slug !== 'reference') continue;
    const problem = problems.get(solution.problem_id);
    const template = content.rows.language_templates.find(item => item.problem_id === problem.id && item.language_id === implementation.language_id && item.mode === 'core');
    if (!template) continue;
    const invocation = JSON.parse(template.invocation);
    const cases = content.rows.test_cases.filter(item => item.problem_id === problem.id);
    const code = implementation.language_id === 'typescript'
      ? ts.transpileModule(implementation.code, {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
      : implementation.code;
    for (const item of cases) {
      const input = JSON.parse(item.input);
      let actual;
      if (implementation.language_id === 'python') {
        const harness = `\nimport json,sys\nconfig=json.loads(sys.argv[1])\ndata=json.loads(sys.stdin.read())\nanswer=getattr(Solution(),config['method'])(*[data[k] for k in config['arguments']])\nprint(json.dumps(answer))\n`;
        const result = spawnSync('python3', ['-c', code + harness, JSON.stringify(invocation)], {input:item.input,encoding:'utf8',timeout:5000});
        assert.equal(result.status, 0, `${problem.slug}: ${result.stderr}`);
        actual = JSON.parse(result.stdout);
      } else {
        actual = runInNewContext(`${code}\n${invocation.method}(...args)`, {args:invocation.arguments.map(name => input[name])}, {timeout:5000});
        actual = JSON.parse(JSON.stringify(actual));
      }
      comparable(problem.slug, actual, JSON.parse(item.expected_output), input);
      checked++;
    }
  }
  assert.ok(checked >= 300, `Only ${checked} examples executed`);
});
