### 方法一：二分查找

> **思考**
>
> 从左扫描到第一个不小于 $target$ 的位置，时间复杂度为 $O(n)$。在 $n \le 10^4$ 的数据范围下可以接受，但数组已升序且无重复，线性遍历没有利用有序性。
>
> 插入位置恰好是第一个不小于 $target$ 的下标，即有序数组上的下界。为此维护半开区间 $[l, r)$：若 $nums[mid] \ge target$，则答案位于左半（含 $mid$）；否则位于 $mid$ 右侧。收缩至 $l = r$ 时， $l$ 即为插入点。

由于 $nums$ 数组已经有序，因此我们可以使用二分查找的方法找到目标值 $target$ 的插入位置。

时间复杂度 $O(\log n)$，空间复杂度 $O(1)$。其中 $n$ 为数组 $nums$ 的长度。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0000-0099/0035.Search%20Insert%20Position/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
