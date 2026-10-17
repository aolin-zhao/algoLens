### 方法一：中序遍历

> **思考**
>
> BST 的中序遍历即为升序。只需走到第 $k$ 个被访问的结点，不必列出整棵树。
>
> 用栈模拟一路向左，弹出时将 $k$ 减一，减到 $0$ 即答案。

由于二叉搜索树的性质，中序遍历一定能得到升序序列，因此可以采用中序遍历找出第 k 小的元素。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0200-0299/0230.Kth%20Smallest%20Element%20in%20a%20BST/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
