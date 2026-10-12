type Scene = {
  index: number;
  complement: number;
  seen: [number, number][];
  match?: number;
  title: string;
  explanation: string;
};
export function buildTwoSumScenes(nums: number[], target: number): Scene[] {
  const seen = new Map<number, number>();
  const scenes: Scene[] = [];
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    const match = seen.get(complement);
    scenes.push({
      index: i,
      complement,
      seen: [...seen],
      match,
      title:
        match !== undefined ? "找到互补的一对" : `寻找 ${nums[i]} 的另一半`,
      explanation:
        match !== undefined
          ? `哈希表中已有 ${complement}，下标为 ${match}。与当前下标 ${i} 配对，得到答案 [${match}, ${i}]。`
          : `目标是 ${target}，当前值为 ${nums[i]}，所以需要 ${complement}。哈希表中还没有它，将 ${nums[i]} → ${i} 记录下来，再向右寻找。`,
    });
    if (match !== undefined) return scenes;
    seen.set(nums[i], i);
  }
  scenes.push({
    index: nums.length,
    complement: 0,
    seen: [...seen],
    title: "遍历结束，未找到配对",
    explanation:
      "这组输入不存在满足条件的两个下标。题目保证的有效测试输入应恰好有一个解。",
  });
  return scenes;
}
