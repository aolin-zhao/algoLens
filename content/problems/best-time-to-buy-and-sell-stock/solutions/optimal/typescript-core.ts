function maxProfit(prices: number[]): number {
  let minimum = prices[0], best = 0;
  for (const price of prices) {
    best = Math.max(best, price - minimum);
    minimum = Math.min(minimum, price);
  }
  return best;
}
