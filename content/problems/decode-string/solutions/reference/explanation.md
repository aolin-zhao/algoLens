### 方法一

> **思考**
>
> 解码 $k[encoded]$ 嵌套重复串。括号匹配可用递归，也可用栈同时记下倍数与外层已拼串。
>
> 数字累入 `num`，遇 `[` 把倍数与当前结果压栈并清空；遇 `]` 弹出外层，把当前段重复后接回；字母直接追加。栈保证由内向外展开。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0300-0399/0394.Decode%20String/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
