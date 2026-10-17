function lengthOfLongestSubstring(s) {
  const last = new Map();
  let left = 0, best = 0;
  for (let right = 0; right < s.length; right++) {
    left = Math.max(left, (last.get(s[right]) ?? -1) + 1);
    last.set(s[right], right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
