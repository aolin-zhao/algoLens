function longestConsecutive(nums) {
  const seen = new Set(nums);
  let best = 0;
  for (const start of seen) {
    if (seen.has(start - 1)) continue;
    let end = start;
    while (seen.has(end)) end++;
    best = Math.max(best, end - start);
  }
  return best;
}
