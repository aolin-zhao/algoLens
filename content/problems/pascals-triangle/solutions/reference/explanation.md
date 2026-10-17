### 方法一：模拟

> **思考**
>
> 第 $i$ 行由上一行相邻两项相加得到，两端为 $1$。 $\textit{numRows}\le 30$，按行模拟即可。每一行只依赖上一行，依次生成并保存。

我们先创建一个答案数组 $f$，然后将 $f$ 的第一行元素设为 $[1]$。接下来，我们从第二行开始，每一行的开头和结尾元素都是 $1$，其它 $f[i][j] = f[i - 1][j - 1] + f[i - 1][j]$。

时间复杂度 $O(n^2)$，其中 $n$ 为给定的行数。忽略答案的空间消耗，空间复杂度 $O(1)$。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0100-0199/0118.Pascal's%20Triangle/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
