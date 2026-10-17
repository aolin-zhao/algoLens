### 方法一：快速选择

> **思考**
>
> 全排序后取第 $k$ 大可行，但多做了对其余位置的排序。快速选择只关心第 $k$ 大所在的那一侧。
>
> 每次按基准划分后，仅递归包含目标名次的区间。实现上将第 $k$ 大转为第 $n-k$ 小。

快速选择算法是一种在未排序的数组中查找第 `k` 个最大元素或最小元素的算法。它的基本思想是每次选择一个基准元素，将数组分为两部分，一部分的元素都比基准元素小，另一部分的元素都比基准元素大，然后根据基准元素的位置，决定继续在左边还是右边查找，直到找到第 `k` 个最大元素。

时间复杂度 $O(n)$，空间复杂度 $O(\log n)$。其中 $n$ 为数组 $\textit{nums}$ 的长度。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0200-0299/0215.Kth%20Largest%20Element%20in%20an%20Array/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
