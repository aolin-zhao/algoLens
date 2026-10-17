### 方法一：二分查找

> **思考**
>
> 每行、每列均递增，可对每一行二分查找 $target$。行数为 $m$、列为 $n$ 时时间为 $O(m\log n)$，无需额外空间。

由于每一行的所有元素升序排列，因此，对于每一行，我们可以使用二分查找找到第一个大于等于 $\textit{target}$ 的元素，然后判断该元素是否等于 $\textit{target}$。如果等于 $\textit{target}$，说明找到了目标值，直接返回 $\text{true}$。如果不等于 $\textit{target}$，说明这一行的所有元素都小于 $\textit{target}$，应该继续搜索下一行。

如果所有行都搜索完了，都没有找到目标值，说明目标值不存在，返回 $\text{false}$。

时间复杂度 $O(m \times \log n)$，其中 $m$ 和 $n$ 分别为矩阵的行数和列数。空间复杂度 $O(1)$。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0200-0299/0240.Search%20a%202D%20Matrix%20II/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
