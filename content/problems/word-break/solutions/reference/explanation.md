### 方法一：哈希表 + 动态规划

> **思考**
>
> 判断 $s$ 能否拆成词典中的词。 $|s|\le 300$，回溯所有切分会重复计算同一后缀。 $f[i]$ 表示前缀 $s[0..i)$ 能否拆分：枚举切点 $j$，若 $f[j]$ 为真且 $s[j..i)$ 在词典中则成功。词典放进哈希集合，判断子串是否成词为期望 $O(1)$。

我们定义 $f[i]$ 表示字符串 $s$ 的前 $i$ 个字符能否拆分成 $wordDict$ 中的单词，初始时 $f[0]=true$，其余为 $false$。答案为 $f[n]$。

考虑 $f[i]$，如果存在 $j \in [0, i)$ 使得 $f[j] \land s[j:i] \in wordDict$，则 $f[i]=true$。为了优化效率，我们可以使用哈希表存储 $wordDict$ 中的单词，这样可以快速判断 $s[j:i]$ 是否在 $wordDict$ 中。

时间复杂度 $O(n^3)$，空间复杂度 $O(n)$。其中 $n$ 为字符串 $s$ 的长度。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0100-0199/0139.Word%20Break/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
