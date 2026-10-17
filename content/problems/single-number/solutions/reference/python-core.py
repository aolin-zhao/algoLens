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
    def singleNumber(self, nums: List[int]) -> int:
        return reduce(xor, nums)
