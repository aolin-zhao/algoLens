### 方法一：单调栈

> **思考**
>
> 若枚举左右边界 $[l, r]$，高度取区间最小值，面积为 $(r - l + 1) \times \min$，时间复杂度为 $O(n^2)$。 $n \le 10^5$，无法通过。
>
> 可以改换枚举对象：以第 $i$ 根柱作为矩形的最矮柱，宽度就是它向左右延伸到第一根更矮柱之间的距离。求每个位置「左右两侧最近的更小值」，适合用单调栈：栈中下标对应的高度单调递增，遇到更矮的柱便弹出，同时得到被弹柱的右边界，栈顶即为左边界。每根柱入栈、出栈各一次，线性即可扫完。

我们可以枚举每根柱子的高度 $h$ 作为矩形的高度，利用单调栈，向左右两边找第一个高度小于 $h$ 的下标 $left_i$, $right_i$。那么此时矩形面积为 $h \times (right_i-left_i-1)$，求最大值即可。

时间复杂度 $O(n)$，空间复杂度 $O(n)$。其中 $n$ 表示 $heights$ 的长度。

单调栈常见模型：找出每个数左/右边**离它最近的**且**比它大/小的数**。模板：

```python
stk = []
for i in range(n):
    while stk and check(stk[-1], i):
        stk.pop()
    stk.append(i)
```

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0000-0099/0084.Largest%20Rectangle%20in%20Histogram/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
