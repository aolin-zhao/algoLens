### 方法一：动态规划(完全背包)

> **思考**
>
> 每种硬币可用任意多次，求凑出 $amount$ 的最少枚数。完全背包：物品为硬币、容量为金额。若 DFS 搜索组合，金额较大时重复子问题多。
>
> 定义 $f[i][j]$ 为用前 $i$ 种硬币凑 $j$ 的最少枚数。不选第 $i$ 种则继承 $f[i-1][j]$；若 $j\ge x$ 则可从 $f[i][j-x]$ 再加一枚。 $f[0][0]=0$，其余为无穷，无法凑出返回 $-1$。

我们定义 $f[i][j]$ 表示使用前 $i$ 种硬币，凑出金额 $j$ 的最少硬币数。初始时 $f[0][0] = 0$，其余位置的值均为正无穷。

我们可以枚举使用的最后一枚硬币的数量 $k$，那么有：

$$
f[i][j] = \min(f[i - 1][j], f[i - 1][j - x] + 1, \cdots, f[i - 1][j - k \times x] + k)
$$

其中 $x$ 表示第 $i$ 种硬币的面值。

不妨令 $j = j - x$，那么有：

$$
f[i][j - x] = \min(f[i - 1][j - x], f[i - 1][j - 2 \times x] + 1, \cdots, f[i - 1][j - k \times x] + k - 1)
$$

将二式代入一式，我们可以得到以下状态转移方程：

$$
f[i][j] = \min(f[i - 1][j], f[i][j - x] + 1)
$$

最后答案即为 $f[m][n]$。

时间复杂度 $O(m \times n)$，空间复杂度 $O(m \times n)$。其中 $m$ 和 $n$ 分别为硬币的种类数和总金额。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0300-0399/0322.Coin%20Change/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
