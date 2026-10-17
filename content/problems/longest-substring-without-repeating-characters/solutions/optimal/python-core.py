from typing import List

class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        last = {}
        left = best = 0
        for right, char in enumerate(s):
            left = max(left, last.get(char, -1) + 1)
            last[char] = right
            best = max(best, right - left + 1)
        return best
