### 方法一：哈希表

> **思考**
>
> 若两两判断是否字母异位，即使对每个串先排序再比较，时间仍为 $O(n^2 \cdot k \log k)$。 $n \le 10^4$、 $k \le 100$，平方比较容易超时。
>
> 一组异位词排序后得到同一个串，该串可以作为分组的键，不必再成对比较。
>
> 因此以排序后的字符串为键、原串列表为值，扫一遍放入哈希表。同一键自然聚到一起。

1. 遍历字符串，对每个字符串按照**字符字典序**排序，得到一个新的字符串。
2. 以新字符串为 `key`，`[str]` 为 `value`，存入哈希表当中（`HashMap<String, List<String>>`）。
3. 后续遍历得到相同 `key` 时，将其加入到对应的 `value` 当中即可。

以 `strs = ["eat", "tea", "tan", "ate", "nat", "bat"]` 为例，遍历结束时，哈希表的状况：

| key     | value                   |
| ------- | ----------------------- |
| `"aet"` | `["eat", "tea", "ate"]` |
| `"ant"` | `["tan", "nat"] `       |
| `"abt"` | `["bat"] `              |

最后返回哈希表的 `value` 列表即可。

时间复杂度 $O(n\times k\times \log k)$。其中 $n$ 和 $k$ 分别是字符串数组的长度和字符串的最大长度。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0000-0099/0049.Group%20Anagrams/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
