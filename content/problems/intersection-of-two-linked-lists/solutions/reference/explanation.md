### 方法一：双指针

> **思考**
>
> 找两链表第一个公共节点。哈希记下一条链再扫另一条是 $O(m+n)$ 时间、 $O(m)$ 空间；进阶要 $O(1)$ 内存。 $m,n\le 3\times 10^4$。
>
> 两条指针走完各自的链后改走另一条，路程都是 $a+b$，若有交点则在交点相遇，否则同时走到空。不必先算长度。

我们使用两个指针 $a$, $b$ 分别指向两个链表 $\textit{headA}$, $\textit{headB}$。

同时遍历链表，当 $a$ 到达链表 $\textit{headA}$ 的末尾时，重新定位到链表 $\textit{headB}$ 的头节点；当 $b$ 到达链表 $\textit{headB}$ 的末尾时，重新定位到链表 $\textit{headA}$ 的头节点。

若两指针相遇，所指向的结点就是第一个公共节点。若没相遇，说明两链表无公共节点，此时两个指针都指向 `null`，返回其中一个即可。

时间复杂度 $O(m + n)$，其中 $m$ 和 $n$ 分别是链表 $\textit{headA}$ 和 $\textit{headB}$ 的长度。空间复杂度 $O(1)$。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0100-0199/0160.Intersection%20of%20Two%20Linked%20Lists/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
