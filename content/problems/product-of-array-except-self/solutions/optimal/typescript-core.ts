function productExceptSelf(nums: number[]): number[] {
  const answer = Array(nums.length).fill(1);
  let left = 1;
  for (let i = 0; i < nums.length; i++) {
    answer[i] = left;
    left *= nums[i];
  }
  let right = 1;
  for (let i = nums.length - 1; i >= 0; i--) {
    answer[i] *= right;
    right *= nums[i];
  }
  return answer;
}
