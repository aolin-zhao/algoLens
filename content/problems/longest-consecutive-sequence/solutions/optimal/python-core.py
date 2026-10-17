from typing import List

class Solution:
    def longestConsecutive(self, nums: List[int]) -> int:
        seen = set(nums)
        best = 0
        for start in seen:
            if start - 1 in seen:
                continue
            end = start
            while end in seen:
                end += 1
            best = max(best, end - start)
        return best
