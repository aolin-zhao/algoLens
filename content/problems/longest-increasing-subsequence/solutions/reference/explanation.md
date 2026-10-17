### 方法一：动态规划

> **思考**
>
> 子序列须保持相对顺序且严格递增。若枚举全部子序列，长度为 $n$ 时状态过多； $n \le 2500$，故可接受按结尾位置转移。
>
> 以 $nums[i]$ 结尾的最长递增子序列，只依赖于左侧更小的元素。为此定义 $f[i]$ 为该长度，枚举 $j < i$ 且 $nums[j] < nums[i]$，取 $f[j]+1$ 的最大值。每个位置独立成段时长度为 $1$，最终答案为 $\max f$。

我们定义 $f[i]$ 表示以 $nums[i]$ 结尾的最长递增子序列的长度，初始时 $f[i] = 1$，答案为 $f[i]$ 的最大值。

对于 $f[i]$，我们需要枚举 $0 \le j \lt i$，如果 $nums[j] \lt nums[i]$，则 $f[i] = \max(f[i], f[j] + 1)$。

最后的答案即为 $f[i]$ 的最大值。

时间复杂度 $O(n^2)$，空间复杂度 $O(n)$。其中 $n$ 为数组长度。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0300-0399/0300.Longest%20Increasing%20Subsequence/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
