### 方法一：动态规划

> **思考**
>
> 从左上走到右下、每步只能向右或向下时，若枚举全部路径再取数字和最小者， $m, n \le 200$，路径条数随格子增长而迅速增加，无法在时限内完成。同一格子会被多条路径反复走到，子问题大量重叠。
>
> 因此走到 $(i, j)$ 的最小路径和，必来自其上方或左方的最优值再加上当前格。用 $f[i][j]$ 记录该值，边界沿唯一方向累加，内部取两侧最小值，按行填表即可。

我们定义 $f[i][j]$ 表示从左上角走到 $(i, j)$ 位置的最小路径和。初始时 $f[0][0] = grid[0][0]$，答案为 $f[m - 1][n - 1]$。

考虑 $f[i][j]$：

- 如果 $j = 0$，那么 $f[i][j] = f[i - 1][j] + grid[i][j]$；
- 如果 $i = 0$，那么 $f[i][j] = f[i][j - 1] + grid[i][j]$；
- 如果 $i \gt 0$ 且 $j \gt 0$，那么 $f[i][j] = \min(f[i - 1][j], f[i][j - 1]) + grid[i][j]$。

最后返回 $f[m - 1][n - 1]$ 即可。

时间复杂度 $O(m \times n)$，空间复杂度 $O(m \times n)$。其中 $m$ 和 $n$ 分别是网格的行数和列数。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0000-0099/0064.Minimum%20Path%20Sum/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
