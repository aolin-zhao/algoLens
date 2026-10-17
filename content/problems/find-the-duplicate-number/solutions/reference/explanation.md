### 方法一：二分查找

> **思考**
>
> 不能改数组且只用常数空间，排序或哈希都不符合。抽屉原理： $[1,x]$ 中若出现次数大于 $x$，则重复值落在该段。
>
> 对值域二分，统计 $\le mid$ 的个数，大于 $mid$ 则答案在左侧，否则在右侧。

我们可以发现，如果 $[1,..x]$ 中的数字个数大于 $x$，那么重复的数字一定在 $[1,..x]$ 中，否则重复的数字一定在 $[x+1,..n]$ 中。

因此，我们可以二分枚举 $x$，每次判断 $[1,..x]$ 中的数字个数是否大于 $x$，从而确定重复的数字在哪个区间中，进而缩小区间范围，直到找到重复的数字。

时间复杂度 $O(n \times \log n)$，其中 $n$ 是数组 $nums$ 的长度。空间复杂度 $O(1)$。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0200-0299/0287.Find%20the%20Duplicate%20Number/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
