### 方法一：动态规划

> **思考**
>
> 机器人每步只能向右或向下。若从起点直接搜索全部路径，格点规模 $m, n \le 100$，路径条数可达组合数级别，同一格子会被反复走到，时间无法接受。
>
> 注意到到达 $(i, j)$ 的路径只可能来自上方或左方，且两类来源互不重叠。因此可以用 $f[i][j]$ 记录走到该格的方案数，按行列顺序填表，保证转移所依赖的状态已经计算完毕。

我们定义 $f[i][j]$ 表示从左上角走到 $(i, j)$ 的路径数量，初始时 $f[0][0] = 1$，答案为 $f[m - 1][n - 1]$。

考虑 $f[i][j]$：

- 如果 $i \gt 0$，那么 $f[i][j]$ 可以从 $f[i - 1][j]$ 走一步到达，因此 $f[i][j] = f[i][j] + f[i - 1][j]$；
- 如果 $j \gt 0$，那么 $f[i][j]$ 可以从 $f[i][j - 1]$ 走一步到达，因此 $f[i][j] = f[i][j] + f[i][j - 1]$。

因此，我们有如下的状态转移方程：

$$
f[i][j] = \begin{cases}
1 & i = 0, j = 0 \\
f[i - 1][j] + f[i][j - 1] & \textit{otherwise}
\end{cases}
$$

最终的答案即为 $f[m - 1][n - 1]$。

时间复杂度 $O(m \times n)$，空间复杂度 $O(m \times n)$。其中 $m$ 和 $n$ 分别是网格的行数和列数。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0000-0099/0062.Unique%20Paths/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
