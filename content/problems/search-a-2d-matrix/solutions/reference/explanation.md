### 方法一：二分查找

> **思考**
>
> 逐格扫描需要 $O(mn)$ 时间。 $m, n \le 100$ 可以接受，但题目要求 $O(\log(mn))$。
>
> 二维矩阵本身不便直接二分，但每一行递增，且上一行末尾小于下一行开头，因此按行拼接后是长度为 $mn$ 的有序序列。将逻辑下标 $mid$ 映射为 $matrix[\lfloor mid/n\rfloor][mid \bmod n]$，即可在 $[0, mn-1]$ 上做一次二分，不必真正展开数组。

我们将二维矩阵逻辑展开，然后二分查找即可。

时间复杂度 $O(\log (m \times n))$。其中 $m$ 和 $n$ 分别是矩阵的行数和列数。空间复杂度 $O(1)$。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0000-0099/0074.Search%20a%202D%20Matrix/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
