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

支持两种 Python 模式：核心代码模式实现 Solution.twoSum(nums, target)，由系统负责输入和输出；main 方法模式编写完整程序，自行读取标准输入的 JSON 并打印下标数组。

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
