### 方法一：递归

> **思考**
>
> 仅检查「左孩子小于根、右孩子大于根」并不充分：左子树里的最大值也必须小于根。可以给每棵子树传入允许取值的区间，也可以利用 BST 的定义——中序序列必须严格递增。
>
> 中序时记下上一个值，当前值必须更大。递归左、比较、再递归右，一遍即可发现违规。空树合法。

我们可以对二叉树进行递归中序遍历，如果遍历到的结果是严格升序的，那么这棵树就是一个二叉搜索树。

因此，我们使用一个变量 $\textit{prev}$ 来保存上一个遍历到的节点，初始时 $\textit{prev} = -\infty$，然后我们递归遍历左子树，如果左子树不是二叉搜索树，直接返回 $\textit{False}$，否则判断当前节点的值是否大于 $\textit{prev}$，如果不是，返回 $\textit{False}$，否则更新 $\textit{prev}$ 为当前节点的值，然后递归遍历右子树。

时间复杂度 $O(n)$，空间复杂度 $O(n)$。其中 $n$ 是二叉树的节点个数。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0000-0099/0098.Validate%20Binary%20Search%20Tree/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
