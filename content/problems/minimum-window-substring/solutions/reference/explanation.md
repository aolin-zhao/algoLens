### 方法一：计数 + 双指针

> **思考**
>
> 若枚举 $s$ 的所有子串再检查是否覆盖 $t$，窗口有 $O(m^2)$ 个， $m \le 10^5$ 无法通过。进阶要求 $O(m+n)$。
>
> 覆盖一旦成立，左端多余字符可以移出窗口；尚未覆盖则只能继续右扩。因此维护 $t$ 的字符配额 $\textit{need}$、窗口计数 $\textit{window}$，并用 $\textit{cnt}$ 记录已经凑齐的必要出现次数，判断覆盖只需常数时间。右指针扫描 $s$，窗口合法时尽量收缩左端并记录最短区间。

我们用一个哈希表或数组 $\textit{need}$ 统计字符串 $t$ 中每个字符出现的次数，用另一个哈希表或数组 $\textit{window}$ 统计滑动窗口中每个字符出现的次数。另外，定义两个指针 $l$ 和 $r$ 分别指向窗口的左右边界，变量 $\textit{cnt}$ 表示窗口中已经包含了 $t$ 中的多少个字符，变量 $k$ 和 $\textit{mi}$ 分别表示最小覆盖子串的起始位置和长度。

我们从左到右遍历字符串 $s$，对于当前遍历到的字符 $s[r]$：

- 我们将其加入窗口中，即 $\textit{window}[s[r]] = \textit{window}[s[r]] + 1$，如果此时 $\textit{need}[s[r]] \geq \textit{window}[s[r]]$，则说明 $s[r]$ 是一个「必要的字符」，我们将 $\textit{cnt}$ 加一。
- 如果 $\textit{cnt}$ 等于 $t$ 的长度，说明此时窗口中已经包含了 $t$ 中的所有字符，我们就可以尝试更新最小覆盖子串的起始位置和长度了。如果 $r - l + 1 < \textit{mi}$，说明当前窗口表示的子串更短，我们就更新 $\textit{mi} = r - l + 1$ 和 $k = l$。
- 然后，我们尝试移动左边界 $l$，如果此时 $\textit{need}[s[l]] \geq \textit{window}[s[l]]$，则说明 $s[l]$ 是一个「必要的字符」，移动左边界时会把 $s[l]$ 这个字符从窗口中移除，因此我们需要将 $\textit{cnt}$ 减一，然后更新 $\textit{window}[s[l]] = \textit{window}[s[l]] - 1$，并将 $l$ 右移一位。
- 如果 $\textit{cnt}$ 与 $t$ 的长度不相等，说明此时窗口中还没有包含 $t$ 中的所有字符，我们就不需要移动左边界了，直接将 $r$ 右移一位，继续遍历即可。

遍历结束，如果没有找到最小覆盖子串，返回空字符串，否则返回 $s[k:k+\textit{mi}]$ 即可。

时间复杂度 $O(m + n)$，空间复杂度 $O(|\Sigma|)$。其中 $m$ 和 $n$ 分别是字符串 $s$ 和 $t$ 的长度；而 $|\Sigma|$ 是字符集的大小，本题中 $|\Sigma| = 128$。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0000-0099/0076.Minimum%20Window%20Substring/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
