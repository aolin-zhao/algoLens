### 方法一：头插法

> **思考**
>
> 把结点依次放入数组再反向重建可行，但只需改指针。头插可在一次遍历中完成反转：当前结点不断插到哑结点之后。
>
> 遍历结束时 $\textit{dummy.next}$ 即为新头，空间为常数。

我们创建一个虚拟头节点 $\textit{dummy}$，然后遍历链表，将每个节点依次插入 $\textit{dummy}$ 的下一个节点。遍历结束，返回 $\textit{dummy.next}$。

时间复杂度 $O(n)$，其中 $n$ 为链表的长度。空间复杂度 $O(1)$。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0200-0299/0206.Reverse%20Linked%20List/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
