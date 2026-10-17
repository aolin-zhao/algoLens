### 方法一：快慢指针

> **思考**
>
> 不但要判断有环，还要返回入环节点。哈希表记下首次出现的节点即可，但进阶要 $O(1)$ 空间。 $n\le 10^4$。
>
> 快慢指针相遇后，一个指针回到头、另一个留在相遇点，两者同速前进，相遇处即入口：头到入口的距离等于相遇点再走回入口的距离。

我们先利用快慢指针判断链表是否有环，如果有环的话，快慢指针一定会相遇，且相遇的节点一定在环中。

如果没有环，快指针会先到达链表尾部，直接返回 `null` 即可。

如果有环，我们再定义一个答案指针 $ans$ 指向链表头部，然后让 $ans$ 和慢指针一起向前走，每次走一步，直到 $ans$ 和慢指针相遇，相遇的节点即为环的入口节点。

为什么这样能找到环的入口节点呢？

我们不妨假设链表头节点到环入口的距离为 $x$，环入口到相遇节点的距离为 $y$，相遇节点到环入口的距离为 $z$，那么慢指针走过的距离为 $x + y$，快指针走过的距离为 $x + y + k \times (y + z)$，其中 $k$ 是快指针在环中绕了 $k$ 圈。

<p><img src="https://fastly.jsdelivr.net/gh/doocs/leetcode@main/solution/0100-0199/0142.Linked%20List%20Cycle%20II/images/linked-list-cycle-ii.png" /></p>

由于快指针速度是慢指针的 $2$ 倍，因此有 $2 \times (x + y) = x + y + k \times (y + z)$，可以推出 $x + y = k \times (y + z)$，即 $x = (k - 1) \times (y + z) + z$。

也即是说，如果我们定义一个答案指针 $ans$ 指向链表头部，然后 $ans$ 和慢指针一起向前走，那么它们一定会在环入口相遇。

时间复杂度 $O(n)$，其中 $n$ 是链表中节点的数目。空间复杂度 $O(1)$。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0100-0199/0142.Linked%20List%20Cycle%20II/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
