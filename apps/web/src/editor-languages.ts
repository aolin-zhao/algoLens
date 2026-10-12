export const editorLanguages = [
  { id: "python", label: "Python 3", extension: "py" },
  { id: "javascript", label: "JavaScript", extension: "js" },
  { id: "typescript", label: "TypeScript", extension: "ts" },
  { id: "java", label: "Java", extension: "java" },
  { id: "cpp", label: "C++", extension: "cpp" },
  { id: "c", label: "C", extension: "c" },
  { id: "go", label: "Go", extension: "go" },
  { id: "rust", label: "Rust", extension: "rs" },
];
const core: Record<string, string> = {
  python: `from typing import List

class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        pass
`,
  javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    
};
`,
  typescript: `function twoSum(nums: number[], target: number): number[] {
    return [];
}
`,
  java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        return new int[]{};
    }
}
`,
  cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        return {};
    }
};
`,
  c: `#include <stdlib.h>

int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    *returnSize = 0;
    return NULL;
}
`,
  go: `func twoSum(nums []int, target int) []int {
    return nil
}
`,
  rust: `impl Solution {
    pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {
        vec![]
    }
}
`,
};
const main: Record<string, string> = {
  python: `import json
import sys

def main():
    data = json.load(sys.stdin)
    # 在这里处理输入并输出结果

if __name__ == "__main__":
    main()
`,
  javascript: `const fs = require('fs');
const data = JSON.parse(fs.readFileSync(0, 'utf8'));
// 在这里处理输入并输出结果
`,
  typescript: `import * as fs from 'fs';
const data = JSON.parse(fs.readFileSync(0, 'utf8'));
// 在这里处理输入并输出结果
`,
  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // 在这里读取输入并输出结果
    }
}
`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    // 在这里读取输入并输出结果
    return 0;
}
`,
  c: `#include <stdio.h>

int main(void) {
    // 在这里读取输入并输出结果
    return 0;
}
`,
  go: `package main

func main() {
    // 在这里读取输入并输出结果
}
`,
  rust: `fn main() {
    // 在这里读取输入并输出结果
}
`,
};
export function starterCode(
  language: string,
  mode: "core" | "main",
  slug?: string,
) {
  if (mode === "main") return main[language] ?? "";
  if (slug === "two-sum") return core[language] ?? "";
  return language === "python"
    ? "# 请根据题目定义实现函数\n"
    : "// 请根据题目定义实现函数\n";
}
