### 方法一：哈希表 + 优先队列（小根堆）

> **思考**
>
> 前 $k$ 个高频元素。全排序为 $O(n\log n)$。只需前 $k$，用频次堆或选择即可。
>
> 先计数，再取频次最高的 $k$ 个。Python 中 `Counter.most_common(k)` 即小根堆/堆选择，时间 $O(n\log k)$。

我们可以使用一个哈希表 $\textit{cnt}$ 统计每个元素出现的次数，然后使用一个小根堆（优先队列）来保存前 $k$ 个高频元素。

我们首先遍历一遍数组，统计每个元素出现的次数，然后遍历哈希表，将元素和出现次数存入小根堆中。如果小根堆的大小超过了 $k$，我们就将堆顶元素弹出，保证堆的大小始终为 $k$。

最后，我们将小根堆中的元素依次弹出，放入结果数组中即可。

时间复杂度 $O(n \times \log k)$，空间复杂度 $O(k)$。其中 $n$ 是数组的长度。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0300-0399/0347.Top%20K%20Frequent%20Elements/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
