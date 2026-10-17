from __future__ import annotations
from typing import *
from collections import *
from functools import *
from itertools import *
from heapq import *
from math import *
from bisect import *
from operator import *

class Solution:
    def moveZeroes(self, nums: List[int]) -> None:
        k = 0
        for i, x in enumerate(nums):
            if x:
                nums[k], nums[i] = nums[i], nums[k]
                k += 1
