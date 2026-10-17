### 方法一：大小根堆（优先队列）

> **思考**
>
> 动态求中位数若每次排序则过慢。用大根堆存较小一半、小根堆存较大一半，堆顶即可拼出中位数。
>
> 新元素先入大根堆再倒到小根堆，并保持小根堆大小至多大 $1$；偶数个取两顶平均，奇数个取小根堆顶。

我们可以使用两个堆来维护所有的元素，一个小根堆 $\textit{minQ}$ 和一个大根堆 $\textit{maxQ}$，其中小根堆 $\textit{minQ}$ 存储较大的一半，大根堆 $\textit{maxQ}$ 存储较小的一半。

调用 `addNum` 方法时，我们首先将元素加入到大根堆 $\textit{maxQ}$，然后将 $\textit{maxQ}$ 的堆顶元素弹出并加入到小根堆 $\textit{minQ}$。如果此时 $\textit{minQ}$ 的大小与 $\textit{maxQ}$ 的大小差值大于 $1$，我们就将 $\textit{minQ}$ 的堆顶元素弹出并加入到 $\textit{maxQ}$。时间复杂度为 $O(\log n)$。

调用 `findMedian` 方法时，如果 $\textit{minQ}$ 的大小等于 $\textit{maxQ}$ 的大小，说明元素的总数为偶数，我们就可以返回 $\textit{minQ}$ 的堆顶元素与 $\textit{maxQ}$ 的堆顶元素的平均值；否则，我们返回 $\textit{minQ}$ 的堆顶元素。时间复杂度为 $O(1)$。

空间复杂度为 $O(n)$。其中 $n$ 为元素的个数。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0200-0299/0295.Find%20Median%20from%20Data%20Stream/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
