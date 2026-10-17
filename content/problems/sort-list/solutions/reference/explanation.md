### 方法一：归并排序

> **思考**
>
> 链表排序，进阶要求 $O(n\log n)$ 时间、常数空间。随机访问缺失，快排交换不方便； $n\le 5\times 10^4$。归并只需要顺序访问：快慢指针断开中点，递归排序两半再线性合并。递归栈是 $O(\log n)$，满足时间要求。

我们可以用归并排序的思想来解决。

首先，我们利用快慢指针找到链表的中点，将链表从中点处断开，形成两个独立的子链表 $\textit{l1}$ 和 $\textit{l2}$。

然后，我们递归地对 $\textit{l1}$ 和 $\textit{l2}$ 进行排序，最后将 $\textit{l1}$ 和 $\textit{l2}$ 合并为一个有序链表。

时间复杂度 $O(n \times \log n)$，空间复杂度 $O(\log n)$。其中 $n$ 是链表的长度。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0100-0199/0148.Sort%20List/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
