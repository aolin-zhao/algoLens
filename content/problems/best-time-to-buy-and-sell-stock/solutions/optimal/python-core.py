from typing import List

class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        minimum = prices[0]
        best = 0
        for price in prices:
            best = max(best, price - minimum)
            minimum = min(minimum, price)
        return best
