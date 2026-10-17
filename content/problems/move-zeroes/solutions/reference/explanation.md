### 方法一：双指针

> **思考**
>
> 要把 $0$ 移到末尾且保持非零相对次序，可用双指针： $k$ 指向下一个非零应放的位置。
>
> 遇到非零就与 $nums[k]$ 交换并右移 $k$，则前 $k$ 位为原相对顺序的非零。

我们用一个指针 $k$ 记录当前待插入的位置，初始时 $k = 0$。

然后我们遍历数组 $\textit{nums}$，每次遇到一个非零数，就将其与 $\textit{nums}[k]$ 交换，同时将 $k$ 的值加 $1$。

这样我们就可以保证 $\textit{nums}$ 的前 $k$ 个元素都是非零的，且它们的相对顺序与原数组一致。

时间复杂度 $O(n)$，其中 $n$ 是数组 $\textit{nums}$ 的长度。空间复杂度 $O(1)$。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0200-0299/0283.Move%20Zeroes/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
