from typing import List

class Solution:
    def subarraySum(self, nums: List[int], k: int) -> int:
        counts = {0: 1}
        prefix = answer = 0
        for value in nums:
            prefix += value
            answer += counts.get(prefix - k, 0)
            counts[prefix] = counts.get(prefix, 0) + 1
        return answer
