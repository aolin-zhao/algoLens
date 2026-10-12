import assert from "node:assert/strict";
import { test } from "node:test";
import { buildTwoSumScenes } from "../src/solution-scenes.ts";
for (const [nums, target, answer] of [
  [[2, 7, 11, 15], 9, [0, 1]],
  [[3, 2, 4], 6, [1, 2]],
  [[3, 3], 6, [0, 1]],
  [[-3, 4, 3, 90], 0, [0, 2]],
  [[0, 4, 3, 0], 0, [0, 3]],
  [[1000000000, -1000000000], 0, [0, 1]],
])
  test(`图解配对 ${JSON.stringify(nums)} → ${target}`, () => {
    const scenes = buildTwoSumScenes(nums, target);
    const last = scenes.at(-1);
    assert.deepEqual([last.match, last.index], answer);
    for (const scene of scenes)
      assert.ok(
        scene.seen.every(([, index]) => index < scene.index),
        "只能查询先前的元素",
      );
  });
test("没有配对的输入会结束而不会显示假答案", () => {
  const last = buildTwoSumScenes([1, 2], 9).at(-1);
  assert.equal(last.index, 2);
  assert.equal(last.match, undefined);
});
