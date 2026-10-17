function trap(height: number[]): number {
  let left = 0, right = height.length - 1;
  let leftMax = 0, rightMax = 0, answer = 0;
  while (left < right) {
    if (height[left] <= height[right]) {
      leftMax = Math.max(leftMax, height[left]);
      answer += leftMax - height[left++];
    } else {
      rightMax = Math.max(rightMax, height[right]);
      answer += rightMax - height[right--];
    }
  }
  return answer;
}
