### 方法一：递归

> **思考**
>
> 镜像对称要求左子树与右子树互为镜像，而不是各自与自身相同。进阶同时要求递归与迭代都能做； $n \le 1000$，一次遍历即可。
>
> 一对节点对称，当且仅当取值相同，且一方的左孩子与另一方的右孩子对称、一方的右孩子与另一方的左孩子对称。因此从根的左右孩子出发做交叉递归即可。

我们设计一个函数 $\textit{dfs}(\textit{root1}, \textit{root2})$，用于判断两个二叉树是否对称。答案即为 $\textit{dfs}(\textit{root.left}, \textit{root.right})$。

函数 $\textit{dfs}(\textit{root1}, \textit{root2})$ 的逻辑如下：

- 如果 $\textit{root1}$ 和 $\textit{root2}$ 都为空，则两个二叉树对称，返回 `true`；
- 如果 $\textit{root1}$ 和 $\textit{root2}$ 中只有一个为空，或者 $\textit{root1.val} \neq \textit{root2.val}$
- 否则，判断 $\textit{root1}$ 的左子树和 $\textit{root2}$ 的右子树是否对称，以及 $\textit{root1}$ 的右子树和 $\textit{root2}$ 的左子树是否对称，这里使用了递归。

时间复杂度 $O(n)$，空间复杂度 $O(n)$。其中 $n$ 是二叉树的节点数。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0100-0199/0101.Symmetric%20Tree/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
