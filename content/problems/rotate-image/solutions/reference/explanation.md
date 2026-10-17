### 方法一：原地翻转

> **思考**
>
> 顺时针旋转 $90^\circ$ 的映射是 $\textit{matrix}[i][j] \to \textit{matrix}[j][n-1-i]$。若新开矩阵按此赋值，时间和空间都是 $O(n^2)$。 $n \le 20$ 时额外空间足够，但题目要求原地修改。
>
> 该映射可拆成两个可原地完成的操作：先上下翻转，再沿主对角线翻转（转置）。
>
> $(i, j)$ 先到 $(n-1-i, j)$，再转到 $(j, n-1-i)$，恰好是目标位置。两次交换即可，额外空间 $O(1)$。

根据题目要求，我们实际上需要将 $\text{matrix}[i][j]$ 旋转至 $\text{matrix}[j][n - i - 1]$。

我们可以先对矩阵进行上下翻转，即 $\text{matrix}[i][j]$ 和 $\text{matrix}[n - i - 1][j]$ 进行交换，然后再对矩阵进行主对角线翻转，即 $\text{matrix}[i][j]$ 和 $\text{matrix}[j][i]$ 进行交换。这样就能将 $\text{matrix}[i][j]$ 旋转至 $\text{matrix}[j][n - i - 1]$ 了。

时间复杂度 $O(n^2)$，其中 $n$ 是矩阵的边长。空间复杂度 $O(1)$。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0000-0099/0048.Rotate%20Image/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
