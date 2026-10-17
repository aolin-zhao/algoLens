### 方法一：哈希表

> **思考**
>
> 判断链表是否有环。 $n\le 10^4$。走过的节点放进哈希表，再次出现即有环；走到空则无环。实现直接，空间 $O(n)$。进阶要求常数空间。

我们可以遍历链表，用一个哈希表 $s$ 记录每个节点。当某个节点二次出现时，则表示存在环，直接返回 `true`。否则链表遍历结束，返回 `false`。

时间复杂度 $O(n)$，空间复杂度 $O(n)$。其中 $n$ 是链表中的节点数。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0100-0199/0141.Linked%20List%20Cycle/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
