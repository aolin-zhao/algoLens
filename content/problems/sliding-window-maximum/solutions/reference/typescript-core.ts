function maxSlidingWindow(nums: number[], k: number): number[] {
    const ans: number[] = [];
    const q: number[] = [];
    let head = 0;
    for (let i = 0; i < nums.length; ++i) {
        if (head < q.length && i - q[head] >= k) {
            head++;
        }
        while (head < q.length && nums[q[q.length - 1]] <= nums[i]) {
            q.pop();
        }
        q.push(i);
        if (i >= k - 1) {
            ans.push(nums[q[head]]);
        }
    }
    return ans;
}
