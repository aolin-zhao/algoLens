import assert from "node:assert/strict";
import { test } from "node:test";
import { parseExecutionTrace, previousScopeFrames, sameValue, traceLineForEditor } from "../src/execution-trace.ts";

const scalar = value => ({ type: "scalar", value: String(value) });
const frame = (line, event, frameId, locals = {}) => ({ line, event, function: "solve", frameId, locals });

test("读取实际 v2 轨迹，也兼容没有调用标识的旧轨迹", () => {
  const value = { version: 2, frames: [frame(1, "line", 1, { nums: { type: "array", items: [scalar(3)], total: 50 }, seen: { type: "map", entries: [[scalar(3), scalar(0)]], total: 1 } })] };
  assert.deepEqual(parseExecutionTrace(value), value);
  const old = { version: 2, frames: [frame(1, "line", undefined)] };
  assert.deepEqual(parseExecutionTrace(old), old);
  assert.deepEqual(parseExecutionTrace({ version: 2, frames: [] }).frames, []);
});

test("异常、返回值和损坏的轨迹能正确区分", () => {
  assert.equal(parseExecutionTrace({ version: 2, frames: [{ ...frame(2, "exception", 1), exception: "ZeroDivisionError" }] }).frames[0].exception, "ZeroDivisionError");
  assert.equal(parseExecutionTrace({ version: 2, frames: [{ ...frame(2, "return", 1), returnValue: scalar(9) }] }).frames[0].returnValue.value, "9");
  for (const invalid of [
    { version: 1, frames: [] }, { version: 2, frames: null },
    { version: 2, frames: [frame(0, "line", 1)] },
    { version: 2, frames: [frame(1, "invented", 1)] },
    { version: 2, frames: [frame(1, "line", 1, { a: { type: "array", items: [null] } })] },
    { version: 2, frames: [frame(1, "line", 1, { a: { type: "map", entries: [[scalar(1)]] } })] },
  ]) assert.throws(() => parseExecutionTrace(invalid));
});

test("递归与重复调用只和同一次调用的变量比较", () => {
  const frames = [
    frame(1, "call", 1, { n: scalar(2) }),
    frame(2, "line", 1, { n: scalar(2) }),
    frame(1, "call", 2, { n: scalar(1) }),
    frame(3, "return", 2, { n: scalar(1) }),
    frame(3, "return", 1, { n: scalar(2) }),
    frame(1, "call", 3, { n: scalar(8) }),
  ];
  const previous = previousScopeFrames(frames);
  assert.equal(previous[2], undefined);
  assert.equal(previous[4], frames[1]);
  assert.equal(previous[5], undefined);
  const legacy = frames.map(({ frameId, ...rest }) => rest);
  const oldPrevious = previousScopeFrames(legacy);
  assert.equal(oldPrevious[2], undefined);
  assert.equal(oldPrevious[4], legacy[1]);
  assert.equal(oldPrevious[5], undefined);
});

test("修改草稿、切换模式后不会把旧行号高亮到新代码上", () => {
  const source = "x = 1\nprint(x)\n";
  const current = frame(2, "line", 1);
  assert.equal(traceLineForEditor(current, source, source, true), 2);
  assert.equal(traceLineForEditor(current, "\n" + source, source, true), null);
  assert.equal(traceLineForEditor(current, source, source, false), null);
  assert.equal(traceLineForEditor(frame(99, "line", 1), source, source, true), null);
  assert.equal(traceLineForEditor(undefined, source, source, true), null);
});

test("数组原地修改、字典更新与变量删除由快照决定", () => {
  const a = { type: "array", items: [scalar(2), scalar(7)] };
  const b = { type: "array", items: [scalar(2), scalar(9)] };
  assert.equal(sameValue(a, b), false);
  assert.equal(sameValue(a.items[0], b.items[0]), true);
  assert.equal(sameValue(a.items[1], b.items[1]), false);
  assert.equal(sameValue({ type: "map", entries: [] }, { type: "map", entries: [[scalar(2), scalar(0)]] }), false);
  assert.equal(sameValue(scalar(1), undefined), false);
});
