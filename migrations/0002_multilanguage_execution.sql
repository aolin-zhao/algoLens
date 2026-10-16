-- Output-only runtimes use level 1; Python retains level 2 tracing.
INSERT INTO languages (id,label,support_level,enabled,created_at,updated_at) VALUES
('javascript','JavaScript',1,1,unixepoch()*1000,unixepoch()*1000),
('typescript','TypeScript',1,1,unixepoch()*1000,unixepoch()*1000),
('java','Java',1,1,unixepoch()*1000,unixepoch()*1000),
('c','C',1,1,unixepoch()*1000,unixepoch()*1000),
('cpp','C++',1,1,unixepoch()*1000,unixepoch()*1000),
('go','Go',1,1,unixepoch()*1000,unixepoch()*1000),
('rust','Rust',1,1,unixepoch()*1000,unixepoch()*1000)
ON CONFLICT(id) DO UPDATE SET support_level=1,enabled=1,updated_at=excluded.updated_at;
-- Do not overwrite templates an administrator already customized.
INSERT INTO language_templates (id,problem_id,language_id,mode,code,invocation,created_at,updated_at) SELECT '55555555-5555-4555-8555-000000000001','11111111-1111-4111-8111-111111111111','javascript','core','function twoSum(nums, target) {
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (seen.has(complement)) return [seen.get(complement), i];
        seen.set(nums[i], i);
    }
    return [];
}
','{"className":"Solution","method":"twoSum","arguments":["nums","target"],"adapter":"two-sum"}',unixepoch()*1000,unixepoch()*1000 WHERE EXISTS (SELECT 1 FROM problems WHERE id='11111111-1111-4111-8111-111111111111') ON CONFLICT(problem_id,language_id,mode) DO NOTHING;
INSERT INTO language_templates (id,problem_id,language_id,mode,code,invocation,created_at,updated_at) SELECT '55555555-5555-4555-8555-000000000002','11111111-1111-4111-8111-111111111111','javascript','main','const fs = require(''fs'');
const data = JSON.parse(fs.readFileSync(0, ''utf8''));
// 在这里处理输入并输出结果
',NULL,unixepoch()*1000,unixepoch()*1000 WHERE EXISTS (SELECT 1 FROM problems WHERE id='11111111-1111-4111-8111-111111111111') ON CONFLICT(problem_id,language_id,mode) DO NOTHING;
INSERT INTO language_templates (id,problem_id,language_id,mode,code,invocation,created_at,updated_at) SELECT '55555555-5555-4555-8555-000000000003','11111111-1111-4111-8111-111111111111','typescript','core','function twoSum(nums: number[], target: number): number[] {
    const seen = new Map<number, number>();
    for (let i = 0; i < nums.length; i++) {
        const previous = seen.get(target - nums[i]);
        if (previous !== undefined) return [previous, i];
        seen.set(nums[i], i);
    }
    return [];
}
','{"className":"Solution","method":"twoSum","arguments":["nums","target"],"adapter":"two-sum"}',unixepoch()*1000,unixepoch()*1000 WHERE EXISTS (SELECT 1 FROM problems WHERE id='11111111-1111-4111-8111-111111111111') ON CONFLICT(problem_id,language_id,mode) DO NOTHING;
INSERT INTO language_templates (id,problem_id,language_id,mode,code,invocation,created_at,updated_at) SELECT '55555555-5555-4555-8555-000000000004','11111111-1111-4111-8111-111111111111','typescript','main','import * as fs from ''fs'';
const data = JSON.parse(fs.readFileSync(0, ''utf8''));
// 在这里处理输入并输出结果
',NULL,unixepoch()*1000,unixepoch()*1000 WHERE EXISTS (SELECT 1 FROM problems WHERE id='11111111-1111-4111-8111-111111111111') ON CONFLICT(problem_id,language_id,mode) DO NOTHING;
INSERT INTO language_templates (id,problem_id,language_id,mode,code,invocation,created_at,updated_at) SELECT '55555555-5555-4555-8555-000000000005','11111111-1111-4111-8111-111111111111','java','core','class Solution {
    public int[] twoSum(int[] nums, int target) {
        java.util.Map<Integer, Integer> seen = new java.util.HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            Integer previous = seen.get(target - nums[i]);
            if (previous != null) return new int[]{previous, i};
            seen.put(nums[i], i);
        }
        return new int[]{};
    }
}
','{"className":"Solution","method":"twoSum","arguments":["nums","target"],"adapter":"two-sum"}',unixepoch()*1000,unixepoch()*1000 WHERE EXISTS (SELECT 1 FROM problems WHERE id='11111111-1111-4111-8111-111111111111') ON CONFLICT(problem_id,language_id,mode) DO NOTHING;
INSERT INTO language_templates (id,problem_id,language_id,mode,code,invocation,created_at,updated_at) SELECT '55555555-5555-4555-8555-000000000006','11111111-1111-4111-8111-111111111111','java','main','import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // 在这里读取输入并输出结果
    }
}
',NULL,unixepoch()*1000,unixepoch()*1000 WHERE EXISTS (SELECT 1 FROM problems WHERE id='11111111-1111-4111-8111-111111111111') ON CONFLICT(problem_id,language_id,mode) DO NOTHING;
INSERT INTO language_templates (id,problem_id,language_id,mode,code,invocation,created_at,updated_at) SELECT '55555555-5555-4555-8555-000000000007','11111111-1111-4111-8111-111111111111','cpp','core','#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < (int)nums.size(); i++) {
            auto previous = seen.find(target - nums[i]);
            if (previous != seen.end()) return {previous->second, i};
            seen[nums[i]] = i;
        }
        return {};
    }
};
','{"className":"Solution","method":"twoSum","arguments":["nums","target"],"adapter":"two-sum"}',unixepoch()*1000,unixepoch()*1000 WHERE EXISTS (SELECT 1 FROM problems WHERE id='11111111-1111-4111-8111-111111111111') ON CONFLICT(problem_id,language_id,mode) DO NOTHING;
INSERT INTO language_templates (id,problem_id,language_id,mode,code,invocation,created_at,updated_at) SELECT '55555555-5555-4555-8555-000000000008','11111111-1111-4111-8111-111111111111','cpp','main','#include <iostream>
using namespace std;

int main() {
    // 在这里读取输入并输出结果
    return 0;
}
',NULL,unixepoch()*1000,unixepoch()*1000 WHERE EXISTS (SELECT 1 FROM problems WHERE id='11111111-1111-4111-8111-111111111111') ON CONFLICT(problem_id,language_id,mode) DO NOTHING;
INSERT INTO language_templates (id,problem_id,language_id,mode,code,invocation,created_at,updated_at) SELECT '55555555-5555-4555-8555-000000000009','11111111-1111-4111-8111-111111111111','c','core','#include <stdlib.h>

int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    *returnSize = 0;
    for (int i = 0; i < numsSize; i++) {
        for (int j = i + 1; j < numsSize; j++) {
            if ((long long)nums[i] + nums[j] == target) {
                int* result = malloc(2 * sizeof(int));
                if (!result) return NULL;
                result[0] = i;
                result[1] = j;
                *returnSize = 2;
                return result;
            }
        }
    }
    return NULL;
}
','{"className":"Solution","method":"twoSum","arguments":["nums","target"],"adapter":"two-sum"}',unixepoch()*1000,unixepoch()*1000 WHERE EXISTS (SELECT 1 FROM problems WHERE id='11111111-1111-4111-8111-111111111111') ON CONFLICT(problem_id,language_id,mode) DO NOTHING;
INSERT INTO language_templates (id,problem_id,language_id,mode,code,invocation,created_at,updated_at) SELECT '55555555-5555-4555-8555-000000000010','11111111-1111-4111-8111-111111111111','c','main','#include <stdio.h>

int main(void) {
    // 在这里读取输入并输出结果
    return 0;
}
',NULL,unixepoch()*1000,unixepoch()*1000 WHERE EXISTS (SELECT 1 FROM problems WHERE id='11111111-1111-4111-8111-111111111111') ON CONFLICT(problem_id,language_id,mode) DO NOTHING;
INSERT INTO language_templates (id,problem_id,language_id,mode,code,invocation,created_at,updated_at) SELECT '55555555-5555-4555-8555-000000000011','11111111-1111-4111-8111-111111111111','go','core','func twoSum(nums []int, target int) []int {
    seen := make(map[int]int)
    for i, value := range nums {
        if previous, ok := seen[target-value]; ok {
            return []int{previous, i}
        }
        seen[value] = i
    }
    return []int{}
}
','{"className":"Solution","method":"twoSum","arguments":["nums","target"],"adapter":"two-sum"}',unixepoch()*1000,unixepoch()*1000 WHERE EXISTS (SELECT 1 FROM problems WHERE id='11111111-1111-4111-8111-111111111111') ON CONFLICT(problem_id,language_id,mode) DO NOTHING;
INSERT INTO language_templates (id,problem_id,language_id,mode,code,invocation,created_at,updated_at) SELECT '55555555-5555-4555-8555-000000000012','11111111-1111-4111-8111-111111111111','go','main','package main

func main() {
    // 在这里读取输入并输出结果
}
',NULL,unixepoch()*1000,unixepoch()*1000 WHERE EXISTS (SELECT 1 FROM problems WHERE id='11111111-1111-4111-8111-111111111111') ON CONFLICT(problem_id,language_id,mode) DO NOTHING;
INSERT INTO language_templates (id,problem_id,language_id,mode,code,invocation,created_at,updated_at) SELECT '55555555-5555-4555-8555-000000000013','11111111-1111-4111-8111-111111111111','rust','core','impl Solution {
    pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {
        let mut seen = std::collections::HashMap::new();
        for (i, value) in nums.into_iter().enumerate() {
            if let Some(&previous) = seen.get(&(target - value)) {
                return vec![previous, i as i32];
            }
            seen.insert(value, i as i32);
        }
        vec![]
    }
}
','{"className":"Solution","method":"two_sum","arguments":["nums","target"],"adapter":"two-sum"}',unixepoch()*1000,unixepoch()*1000 WHERE EXISTS (SELECT 1 FROM problems WHERE id='11111111-1111-4111-8111-111111111111') ON CONFLICT(problem_id,language_id,mode) DO NOTHING;
INSERT INTO language_templates (id,problem_id,language_id,mode,code,invocation,created_at,updated_at) SELECT '55555555-5555-4555-8555-000000000014','11111111-1111-4111-8111-111111111111','rust','main','fn main() {
    // 在这里读取输入并输出结果
}
',NULL,unixepoch()*1000,unixepoch()*1000 WHERE EXISTS (SELECT 1 FROM problems WHERE id='11111111-1111-4111-8111-111111111111') ON CONFLICT(problem_id,language_id,mode) DO NOTHING;
