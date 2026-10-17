### 方法一：快慢指针

> **思考**
>
> 放入数组再比较首尾可行，但要求常数空间。回文关于中点对称，可先找中点、反转后半，再与前半逐一比较。
>
> 快慢指针定位中点后原地反转后半段，比较结束后不必恢复。

我们可以先用快慢指针找到链表的中点，接着反转右半部分的链表。然后同时遍历前后两段链表，若前后两段链表节点对应的值不等，说明不是回文链表，否则说明是回文链表。

时间复杂度 $O(n)$，其中 $n$ 为链表的长度。空间复杂度 $O(1)$。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0200-0299/0234.Palindrome%20Linked%20List/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
