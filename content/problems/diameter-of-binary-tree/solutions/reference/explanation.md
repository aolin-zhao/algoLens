### 方法一：枚举 + DFS

> **思考**
>
> 直径是任意两点路径的最长边数。枚举所有点对再求路径不现实。任一直径必经过某节点，等于该节点左右子树高度之和。
>
> DFS 返回子树高度，并在回溯时用 $l+r$ 更新全局答案，同时向父节点返回 $1+\max(l,r)$。每个节点只访问一次，高度与直径一起算出。

我们可以枚举二叉树的每个节点，以该节点为根节点，计算其左右子树的最大深度 $\textit{l}$ 和 $\textit{r}$，则该节点的直径为 $\textit{l} + \textit{r}$。取所有节点的直径的最大值即为二叉树的直径。

时间复杂度 $O(n)$，空间复杂度 $O(n)$。其中 $n$ 为二叉树的节点个数。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0500-0599/0543.Diameter%20of%20Binary%20Tree/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
