### 方法一：递归

> **思考**
>
> 树的深度是根到最远叶子的边数加一。层序统计层数可行， $n \le 10^4$ 时间足够。树本身按递归定义，当前树的深度等于左右子树深度的较大值再加一，空树深度为 $0$。为此对左右子树递归求深度后取最大即可。

递归遍历左右子树，求左右子树的最大深度，然后取最大值加 $1$ 即可。

时间复杂度 $O(n)$，其中 $n$ 是二叉树的节点数。每个节点在递归中只被遍历一次。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0100-0199/0104.Maximum%20Depth%20of%20Binary%20Tree/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
