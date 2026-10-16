INSERT OR IGNORE INTO roles (id,name,created_at,updated_at) VALUES ('admin','admin',unixepoch()*1000,unixepoch()*1000),('user','user',unixepoch()*1000,unixepoch()*1000);
INSERT OR IGNORE INTO languages (id,label,support_level,enabled,created_at,updated_at) VALUES
('python','Python',2,1,unixepoch()*1000,unixepoch()*1000),
('javascript','JavaScript',0,0,unixepoch()*1000,unixepoch()*1000),
('typescript','TypeScript',0,0,unixepoch()*1000,unixepoch()*1000),
('java','Java',0,0,unixepoch()*1000,unixepoch()*1000),
('c','C',0,0,unixepoch()*1000,unixepoch()*1000),
('cpp','C++',0,0,unixepoch()*1000,unixepoch()*1000),
('go','Go',0,0,unixepoch()*1000,unixepoch()*1000),
('rust','Rust',0,0,unixepoch()*1000,unixepoch()*1000);
INSERT INTO problems (id,slug,title,description,difficulty,status,created_at,updated_at) VALUES ('11111111-1111-4111-8111-111111111111','two-sum','1. 两数之和','给你一个整数数组 nums 和目标整数 target，找出相加等于 target 的两个元素，返回它们从 0 开始的下标。

每组输入保证恰有一个解；同一个元素不能重复使用，下标的返回顺序不限。

数据范围：2 ≤ nums.length ≤ 10⁴；nums[i] 和 target 均在 [-10⁹, 10⁹] 内。

进阶：尝试用优于 O(n²) 的算法求解。

支持 Python、JavaScript、TypeScript、Java、C、C++、Go、Rust：核心代码模式实现对应语言的 twoSum/two_sum 签名，由系统负责输入和输出；main 方法模式编写完整程序，自行读取标准输入的 JSON 并打印下标数组。

题目来源：https://leetcode.cn/problems/two-sum/','easy','published',unixepoch()*1000,unixepoch()*1000) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,title=excluded.title,description=excluded.description,difficulty=excluded.difficulty,status=excluded.status,deleted_at=NULL,updated_at=excluded.updated_at;
INSERT INTO language_templates (id,problem_id,language_id,mode,code,invocation,created_at,updated_at) VALUES ('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111','python','main','import json
import sys


def two_sum(nums, target):
    seen = {}
    for i, value in enumerate(nums):
        complement = target - value
        if complement in seen:
            return [seen[complement], i]
        seen[value] = i
    return []


def main():
    data = json.load(sys.stdin)
    answer = two_sum(data["nums"], data["target"])
    print(json.dumps(answer))


if __name__ == "__main__":
    main()
',NULL,unixepoch()*1000,unixepoch()*1000) ON CONFLICT(id) DO UPDATE SET problem_id=excluded.problem_id,language_id=excluded.language_id,mode=excluded.mode,code=excluded.code,invocation=excluded.invocation,deleted_at=NULL,updated_at=excluded.updated_at;
INSERT INTO language_templates (id,problem_id,language_id,mode,code,invocation,created_at,updated_at) VALUES ('22222222-2222-4222-8222-222222222223','11111111-1111-4111-8111-111111111111','python','core','from typing import List


class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, value in enumerate(nums):
            complement = target - value
            if complement in seen:
                return [seen[complement], i]
            seen[value] = i
        return []
','{"className": "Solution", "method": "twoSum", "arguments": ["nums", "target"]}',unixepoch()*1000,unixepoch()*1000) ON CONFLICT(id) DO UPDATE SET problem_id=excluded.problem_id,language_id=excluded.language_id,mode=excluded.mode,code=excluded.code,invocation=excluded.invocation,deleted_at=NULL,updated_at=excluded.updated_at;
INSERT INTO problem_examples (id,problem_id,input,output,explanation,sort_order,created_at,updated_at) VALUES ('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111','{"nums":[2,7,11,15],"target":9}','[0, 1]','下标 0 和 1 对应的值相加为 9。','0',unixepoch()*1000,unixepoch()*1000) ON CONFLICT(id) DO UPDATE SET problem_id=excluded.problem_id,input=excluded.input,output=excluded.output,explanation=excluded.explanation,sort_order=excluded.sort_order,deleted_at=NULL,updated_at=excluded.updated_at;
INSERT INTO test_cases (id,problem_id,input,expected_output,hidden,created_at,updated_at) VALUES ('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','{"nums":[2,7,11,15],"target":9}','[0, 1]','0',unixepoch()*1000,unixepoch()*1000) ON CONFLICT(id) DO UPDATE SET problem_id=excluded.problem_id,input=excluded.input,expected_output=excluded.expected_output,hidden=excluded.hidden,deleted_at=NULL,updated_at=excluded.updated_at;
INSERT INTO problem_examples (id,problem_id,input,output,explanation,sort_order,created_at,updated_at) VALUES ('33333333-3333-4333-8333-333333333334','11111111-1111-4111-8111-111111111111','{"nums":[3,2,4],"target":6}','[1, 2]','下标 1 和 2 对应的值相加为 6。','1',unixepoch()*1000,unixepoch()*1000) ON CONFLICT(id) DO UPDATE SET problem_id=excluded.problem_id,input=excluded.input,output=excluded.output,explanation=excluded.explanation,sort_order=excluded.sort_order,deleted_at=NULL,updated_at=excluded.updated_at;
INSERT INTO test_cases (id,problem_id,input,expected_output,hidden,created_at,updated_at) VALUES ('44444444-4444-4444-8444-444444444445','11111111-1111-4111-8111-111111111111','{"nums":[3,2,4],"target":6}','[1, 2]','0',unixepoch()*1000,unixepoch()*1000) ON CONFLICT(id) DO UPDATE SET problem_id=excluded.problem_id,input=excluded.input,expected_output=excluded.expected_output,hidden=excluded.hidden,deleted_at=NULL,updated_at=excluded.updated_at;
INSERT INTO problem_examples (id,problem_id,input,output,explanation,sort_order,created_at,updated_at) VALUES ('33333333-3333-4333-8333-333333333335','11111111-1111-4111-8111-111111111111','{"nums":[3,3],"target":6}','[0, 1]','下标 0 和 1 对应的值相加为 6。','2',unixepoch()*1000,unixepoch()*1000) ON CONFLICT(id) DO UPDATE SET problem_id=excluded.problem_id,input=excluded.input,output=excluded.output,explanation=excluded.explanation,sort_order=excluded.sort_order,deleted_at=NULL,updated_at=excluded.updated_at;
INSERT INTO test_cases (id,problem_id,input,expected_output,hidden,created_at,updated_at) VALUES ('44444444-4444-4444-8444-444444444446','11111111-1111-4111-8111-111111111111','{"nums":[3,3],"target":6}','[0, 1]','0',unixepoch()*1000,unixepoch()*1000) ON CONFLICT(id) DO UPDATE SET problem_id=excluded.problem_id,input=excluded.input,expected_output=excluded.expected_output,hidden=excluded.hidden,deleted_at=NULL,updated_at=excluded.updated_at;
INSERT INTO test_cases (id,problem_id,input,expected_output,hidden,created_at,updated_at) VALUES ('44444444-4444-4444-8444-444444444447','11111111-1111-4111-8111-111111111111','{"nums":[-3,4,3,90],"target":0}','[0, 2]','1',unixepoch()*1000,unixepoch()*1000) ON CONFLICT(id) DO UPDATE SET problem_id=excluded.problem_id,input=excluded.input,expected_output=excluded.expected_output,hidden=excluded.hidden,deleted_at=NULL,updated_at=excluded.updated_at;
INSERT INTO test_cases (id,problem_id,input,expected_output,hidden,created_at,updated_at) VALUES ('44444444-4444-4444-8444-444444444448','11111111-1111-4111-8111-111111111111','{"nums":[0,4,3,0],"target":0}','[0, 3]','1',unixepoch()*1000,unixepoch()*1000) ON CONFLICT(id) DO UPDATE SET problem_id=excluded.problem_id,input=excluded.input,expected_output=excluded.expected_output,hidden=excluded.hidden,deleted_at=NULL,updated_at=excluded.updated_at;
INSERT INTO test_cases (id,problem_id,input,expected_output,hidden,created_at,updated_at) VALUES ('44444444-4444-4444-8444-444444444449','11111111-1111-4111-8111-111111111111','{"nums":[1000000000,-1000000000],"target":0}','[0, 1]','1',unixepoch()*1000,unixepoch()*1000) ON CONFLICT(id) DO UPDATE SET problem_id=excluded.problem_id,input=excluded.input,expected_output=excluded.expected_output,hidden=excluded.hidden,deleted_at=NULL,updated_at=excluded.updated_at;
INSERT INTO tags (id,name,created_at,updated_at) VALUES ('array','数组',unixepoch()*1000,unixepoch()*1000) ON CONFLICT(id) DO UPDATE SET name=excluded.name,deleted_at=NULL,updated_at=excluded.updated_at;
INSERT OR IGNORE INTO problem_tags (problem_id,tag_id) VALUES ('11111111-1111-4111-8111-111111111111','array');
INSERT INTO tags (id,name,created_at,updated_at) VALUES ('hash-table','哈希表',unixepoch()*1000,unixepoch()*1000) ON CONFLICT(id) DO UPDATE SET name=excluded.name,deleted_at=NULL,updated_at=excluded.updated_at;
INSERT OR IGNORE INTO problem_tags (problem_id,tag_id) VALUES ('11111111-1111-4111-8111-111111111111','hash-table');

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
