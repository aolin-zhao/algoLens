### 方法一：递归

> **思考**
>
> 翻转整棵树即交换每个结点的左右孩子，并对其子树做同样操作。树规模允许一次递归遍历。
>
> 先递归翻转左右子树，再交换两棵子树的根指针。

我们首先判断 $\textit{root}$ 是否为空，若为空则直接返回 $\text{null}$。然后递归地对树的左右子树进行翻转，将翻转后的右子树作为新的左子树，将翻转后的左子树作为新的右子树，返回 $\textit{root}$。

时间复杂度 $O(n)$，空间复杂度 $O(n)$。其中 $n$ 是二叉树的节点个数。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0200-0299/0226.Invert%20Binary%20Tree/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
