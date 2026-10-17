### 方法一：哈希表 + 模拟

> **思考**
>
> 复制带随机指针的链表。随机指针可能指向任意节点或空，先复制 $\textit{next}$ 再复制 $\textit{random}$ 时，目标节点可能尚未建出。 $n\le 1000$。
>
> 第一遍沿 $\textit{next}$ 建新链，并用哈希表记下原节点到副本的映射；第二遍按映射接好 $\textit{random}$。

我们可以定义一个虚拟头节点 $\textit{dummy}$，用一个指针 $\textit{tail}$ 指向虚拟头节点，然后遍历链表，将链表中的每个节点都复制一份，并将每个节点及其复制节点的对应关系存储在哈希表 $\textit{d}$ 中，同时连接好复制节点的 $\textit{next}$ 指针。

接下来再遍历链表，根据哈希表中存储的对应关系，将复制节点的 $\textit{random}$ 指针连接好。

时间复杂度 $O(n)$，空间复杂度 $O(n)$。其中 $n$ 为链表的长度。

参考题解：[Doocs LeetCode](https://github.com/doocs/leetcode/blob/main/solution/0100-0199/0138.Copy%20List%20with%20Random%20Pointer/README.md)。本节引文及所附参考代码按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 署名共享。
