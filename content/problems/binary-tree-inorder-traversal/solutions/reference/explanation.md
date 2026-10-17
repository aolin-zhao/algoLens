### 方法一：递归遍历

> **思考**
>
> 中序遍历的顺序是「左、根、右」。树本身按递归定义，因此可以直接递归：先走完左子树，再记录根，再走右子树。 $n \le 100$，最坏 $O(n)$ 的递归栈可以接受。进阶才要求改成迭代。

我们先递归左子树，再访问根节点，接着递归右子树。

时间复杂度 $O(n)$，空间复杂度 $O(n)$。其中 $n$ 是二叉树的节点数，空间复杂度主要取决于递归调用的栈空间。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0000-0099/0094.Binary%20Tree%20Inorder%20Traversal/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
