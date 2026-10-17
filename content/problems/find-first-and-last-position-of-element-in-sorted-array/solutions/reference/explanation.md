### 方法一：二分查找

> **思考**
>
> 扫描一遍记下 $target$ 的首次与末次出现，时间复杂度为 $O(n)$。 $n \le 10^5$ 且题目要求 $O(\log n)$；即便先找到一个命中再向两侧扩展，最坏仍是线性。
>
> 数组非递减，左右边界各自是一个二分问题，不必在同一轮里同时寻找两端。左边界即第一个不小于 $target$ 的位置，右边界即第一个不小于 $target+1$ 的位置减一。两次下界查找即可；若两次结果相同，说明 $target$ 不存在。

我们可以进行两次二分查找，分别查找出左边界和右边界。

时间复杂度 $O(\log n)$，其中 $n$ 是数组 $\textit{nums}$ 的长度。空间复杂度 $O(1)$。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0000-0099/0034.Find%20First%20and%20Last%20Position%20of%20Element%20in%20Sorted%20Array/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
