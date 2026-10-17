### 方法一：哈希表 + 前缀和 + 递归

> **思考**
>
> 路径必须向下，枚举每个祖先再向下扫描是 $O(n^2)$。路径和等于 $\textit{targetSum}$ 可改写成「当前前缀和减去某个祖先前缀和」。
>
> 先序累加前缀和 $s$，用哈希表统计根到当前结点的前缀出现次数， $\textit{cnt}[s-\textit{targetSum}]$ 即以此为终点的合法路径数。回溯时撤销 $s$，避免把另一条分支算进来。
>
> 初始 $\textit{cnt}[0]=1$，对应从根出发整段刚好等于目标。先查询再插入，路径不含「当前结点用两次」。

我们可以运用前缀和的思想，对二叉树进行递归遍历，同时用哈希表 $\textit{cnt}$ 统计从根节点到当前节点的路径上各个前缀和出现的次数。

我们设计一个递归函数 $\textit{dfs(node, s)}$，表示当前遍历到的节点为 $\textit{node}$，从根节点到当前节点的路径上的前缀和为 $s$。函数的返回值是统计以 $\textit{node}$ 节点及其子树节点作为路径终点且路径和为 $\textit{targetSum}$ 的路径数目。那么答案就是 $\textit{dfs(root, 0)}$。

函数 $\textit{dfs(node, s)}$ 的递归过程如下：

- 如果当前节点 $\textit{node}$ 为空，则返回 $0$。
- 计算从根节点到当前节点的路径上的前缀和 $s$。
- 用 $\textit{cnt}[s - \textit{targetSum}]$ 表示以当前节点为路径终点且路径和为 $\textit{targetSum}$ 的路径数目，其中 $\textit{cnt}[s - \textit{targetSum}]$ 即为 $\textit{cnt}$ 中前缀和为 $s - \textit{targetSum}$ 的个数。
- 将前缀和 $s$ 的计数值加 $1$，即 $\textit{cnt}[s] = \textit{cnt}[s] + 1$。
- 递归地遍历当前节点的左右子节点，即调用函数 $\textit{dfs(node.left, s)}$ 和 $\textit{dfs(node.right, s)}$，并将它们的返回值相加。
- 在返回值计算完成以后，需要将当前节点的前缀和 $s$ 的计数值减 $1$，即执行 $\textit{cnt}[s] = \textit{cnt}[s] - 1$。
- 最后返回答案。

时间复杂度 $O(n)$，空间复杂度 $O(n)$。其中 $n$ 是二叉树的节点个数。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0400-0499/0437.Path%20Sum%20III/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
