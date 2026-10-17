### 方法一：位运算

> **思考**
>
> 其余数出现两次、一个出现一次，要求线性时间、常数空间。哈希计数空间是 $O(n)$。异或满足 $x\oplus x=0$、 $x\oplus 0=x$ 且可交换，全部异或后成对的数消掉，剩下即只出现一次的那个。

异或运算的性质：

- 任何数和 $0$ 做异或运算，结果仍然是原来的数，即 $x \oplus 0 = x$；
- 任何数和其自身做异或运算，结果是 $0$，即 $x \oplus x = 0$；

我们对该数组所有元素进行异或运算，结果就是那个只出现一次的数字。

时间复杂度 $O(n)$，空间复杂度 $O(1)$。其中 $n$ 是数组 $nums$ 的长度。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0100-0199/0136.Single%20Number/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
