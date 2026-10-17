### 方法一：递归

> **思考**
>
> 普通二叉树没有有序性，不能按值决定方向。LCA 是同时覆盖 $p$ 与 $q$ 的最深结点。
>
> 后序递归：子树中找到目标则上送该结点；左右都非空则当前根为 LCA，否则上送非空一侧。

我们递归遍历二叉树：

如果当前节点为空或者等于 $p$ 或者 $q$，则返回当前节点；

否则，我们递归遍历左右子树，将返回的结果分别记为 $left$ 和 $right$。如果 $left$ 和 $right$ 都不为空，则说明 $p$ 和 $q$ 分别在左右子树中，因此当前节点即为最近公共祖先；如果 $left$ 和 $right$ 中只有一个不为空，返回不为空的那个。

时间复杂度 $O(n)$，空间复杂度 $O(n)$。其中 $n$ 为二叉树节点个数。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0200-0299/0236.Lowest%20Common%20Ancestor%20of%20a%20Binary%20Tree/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
