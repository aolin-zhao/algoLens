### 方法一：单调栈

> **思考**
>
> 对每个位置求右侧下一个更高温度的距离。 $n\le 10^5$，对每个下标向右扫描是 $O(n^2)$。
>
> 这是「右侧下一个更大元」：用单调栈保存尚未找到答案、温度递减的下标。从右往左扫时，弹出所有不大于当前温度的栈顶，新的栈顶即是下一个更暖的一天。
>
> 栈中下标对应温度从顶到底递增。每个下标进出一次，时间 $O(n)$。

本题需要我们找出每个元素右边第一个比它大的元素的位置，这是一个典型的单调栈应用场景。

我们从右往左遍历数组 $\textit{temperatures}$，维护一个从栈顶到栈底温度单调递增的栈 $\textit{stk}$，栈中存储的是数组元素的下标。对于每个元素 $\textit{temperatures}[i]$，我们不断将其与栈顶元素进行比较，如果栈顶元素对应的温度小于等于 $\textit{temperatures}[i]$，那么循环将栈顶元素弹出，直到栈为空或者栈顶元素对应的温度大于 $\textit{temperatures}[i]$。此时，栈顶元素就是右边第一个比 $\textit{temperatures}[i]$ 大的元素，距离为 $\textit{stk.top()} - i$，我们更新答案数组。然后将 $\textit{temperatures}[i]$ 入栈，继续遍历。

遍历结束后，返回答案数组即可。

时间复杂度 $O(n)$，空间复杂度 $O(n)$。其中 $n$ 为数组 $\textit{temperatures}$ 的长度。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0700-0799/0739.Daily%20Temperatures/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
