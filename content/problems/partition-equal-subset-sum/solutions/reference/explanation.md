### 方法一：动态规划

> **思考**
>
> 等和划分即能否选出一个子集，其和为总和的一半。总和为奇数则不可能。子集枚举在 $n\le 200$ 时不可行。
>
> 这是容量为 $m=s/2$ 的 $0$-$1$ 背包：令 $f[i][j]$ 表示前 $i$ 个数能否凑出 $j$，转移为选或不选 $x$。 $n$ 与 $m$ 的乘积可接受。
>
> 先判奇偶再填表，空集对应 $f[0][0]=\textit{true}$，保证转移有起点。

我们先计算出数组的总和 $s$，如果总和是奇数，那么一定不能分割成两个和相等的子集，直接返回 $false$。如果总和是偶数，我们记目标子集的和为 $m = \frac{s}{2}$，那么问题就转化成了：是否存在一个子集，使得其元素的和为 $m$。

我们定义 $f[i][j]$ 表示前 $i$ 个数中选取若干个数，使得其元素的和恰好为 $j$。初始时 $f[0][0] = true$，其余 $f[i][j] = false$。答案为 $f[n][m]$。

考虑 $f[i][j]$，如果我们选取了第 $i$ 个数 $x$，那么 $f[i][j] = f[i - 1][j - x]$；如果我们没有选取第 $i$ 个数 $x$，那么 $f[i][j] = f[i - 1][j]$。因此状态转移方程为：

$$
f[i][j] = f[i - 1][j] \textit{ or } f[i - 1][j - x] \textit{ if } j \geq x
$$

最终答案为 $f[n][m]$。

时间复杂度 $O(m \times n)$，空间复杂度 $O(m \times n)$。其中 $m$ 和 $n$ 分别为数组的总和的一半和数组的长度。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0400-0499/0416.Partition%20Equal%20Subset%20Sum/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
