from typing import List

class Solution:
    def isValid(self, s: str) -> bool:
        stack = []
        pairs = {'(': ')', '[': ']', '{': '}'}
        for char in s:
            if char in pairs:
                stack.append(pairs[char])
            elif not stack or stack.pop() != char:
                return False
        return not stack
