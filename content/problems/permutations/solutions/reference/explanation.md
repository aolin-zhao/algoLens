### 方法一：DFS（回溯）

> **思考**
>
> $n \le 6$，排列共 $n!$ 个，规模允许全部枚举。调用语言自带的全排列，或写死若干层循环，都可以生成结果；但 $n$ 不固定，循环层数无法预先写死。
>
> 每个位置须选一个尚未使用的数，重复使用会破坏排列，因此需要标记。生成过程是「按位置填数」，自然对应深度优先搜索。
>
> 为此用布尔数组标记已选下标，按位置递归填写：未使用则放入当前位并继续，返回后撤销标记。 $n$ 很小，时间 $O(n \cdot n!)$ 与输出规模相符。

我们设计一个函数 $dfs(i)$ 表示已经填完了前 $i$ 个位置，现在需要填第 $i+1$ 个位置。枚举所有可能的数，如果这个数没有被填过，就填入这个数，然后继续填下一个位置，直到填完所有的位置。

时间复杂度 $O(n \times n!)$，其中 $n$ 是数组的长度。一共有 $n!$ 个排列，每个排列需要 $O(n)$ 的时间来构造。

相似题目：

- [47. 全排列 II](https://github.com/doocs/leetcode/blob/main/solution/0000-0099/0047.Permutations%20II/README.md)

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0000-0099/0046.Permutations/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
