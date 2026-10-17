### 方法一：前缀树

> **思考**
>
> 多次查询公共前缀时，若对每个单词扫描全部已插入词，则会重复比较相同前缀。字符均为小写，可用 $26$ 叉树按字符分层。
>
> 插入时沿路径创建结点并在末尾置 $isEnd$；查询前缀走同一路径，search 再检查终点是否为词尾。

前缀树每个节点包括两部分：

1. 指向子节点的指针数组 $children$，对于本题而言，数组长度为 $26$，即小写英文字母的数量。 $children[0]$ 对应小写字母 $a$，...， $children[25]$ 对应小写字母 $z$。
1. 布尔字段 $isEnd$，表示该节点是否为字符串的结尾。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0200-0299/0208.Implement%20Trie%20(Prefix%20Tree)/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
