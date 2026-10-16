"""Focused execution trace regression tests, independent of non-Python toolchains."""
import json
import unittest
from runtime import run_code
from server import TRACE_SCRIPT


class TraceTests(unittest.TestCase):
    def run_python(self, code, input_text="", invocation=None):
        return run_code({"languageId": "python", "code": code, "input": input_text, "invocation": invocation}, TRACE_SCRIPT)

    def test_snapshots_are_before_each_line_and_keep_mutations(self):
        result = self.run_python("nums = [2, 7]\nseen = {}\nnums[1] = 9\nseen[2] = 0\ndel seen\nprint(nums)\n")
        self.assertEqual(result["exitCode"], 0, result)
        lines = {f["line"]: f for f in result["frames"] if f["event"] == "line"}
        self.assertNotIn("nums", lines[1]["locals"])
        self.assertEqual(lines[3]["locals"]["nums"]["items"][1]["value"], "7")
        self.assertEqual(lines[4]["locals"]["nums"]["items"][1]["value"], "9")
        self.assertEqual(lines[5]["locals"]["seen"]["entries"][0][1]["value"], "0")
        self.assertNotIn("seen", lines[6]["locals"])

    def test_recursive_and_repeated_calls_have_distinct_ids(self):
        result = self.run_python("def solve(n):\n    if n == 0:\n        return 0\n    return n + solve(n - 1)\nprint(solve(2))\nprint(solve(1))\n")
        self.assertEqual(result["exitCode"], 0, result)
        calls = [f for f in result["frames"] if f["event"] == "call" and f["function"] == "solve"]
        self.assertEqual(len(calls), 5)
        self.assertEqual(len({f["frameId"] for f in calls}), 5)
        outer = calls[0]["frameId"]
        returns = [f for f in result["frames"] if f["event"] == "return" and f["frameId"] == outer]
        self.assertEqual(returns[0]["returnValue"]["value"], "3")

    def test_core_return_and_only_user_source_lines(self):
        code = "class Solution:\n    def solve(self, nums):\n        return list(reversed(nums))\n"
        result = self.run_python(code, json.dumps({"nums": [2, 7]}), {"className": "Solution", "method": "solve", "arguments": ["nums"]})
        self.assertEqual(json.loads(result["stdout"]), [7, 2])
        returns = [f for f in result["frames"] if f["function"] == "solve" and f["event"] == "return"]
        self.assertEqual([item["value"] for item in returns[0]["returnValue"]["items"]], ["7", "2"])
        self.assertTrue(all(1 <= f["line"] <= len(code.splitlines()) for f in result["frames"]))

    def test_failure_keeps_partial_trace_without_a_fake_return(self):
        result = self.run_python("def solve():\n    x = 1\n    return x / 0\nsolve()\n")
        self.assertNotEqual(result["exitCode"], 0)
        self.assertTrue(any("ZeroDivisionError" in f.get("exception", "") for f in result["frames"]))
        final = [f for f in result["frames"] if f["function"] == "solve" and f["event"] == "return"][0]
        self.assertNotIn("returnValue", final)

    def test_caught_exception_can_still_return_normally(self):
        result = self.run_python("def solve():\n    try:\n        1 / 0\n    except ZeroDivisionError:\n        return 42\nprint(solve())\n")
        self.assertEqual(result["exitCode"], 0, result)
        final = [f for f in result["frames"] if f["function"] == "solve" and f["event"] == "return"][0]
        self.assertEqual(final["returnValue"]["value"], "42")
        self.assertNotIn("exception", final)

    def test_finally_during_unwinding_is_not_a_normal_return(self):
        result = self.run_python("def solve():\n    try:\n        1 / 0\n    finally:\n        x = 2\nsolve()\n")
        self.assertNotEqual(result["exitCode"], 0)
        final = [f for f in result["frames"] if f["function"] == "solve" and f["event"] == "return"][0]
        self.assertNotIn("returnValue", final)
        self.assertIn("ZeroDivisionError", final["exception"])

    def test_large_container_reports_its_actual_size(self):
        result = self.run_python("nums = list(range(50))\nprint(len(nums))\n")
        nums = result["frames"][-1]["locals"]["nums"]
        self.assertEqual(nums["total"], 50)
        self.assertEqual(len(nums["items"]), 30)

    def test_frame_limit_retains_collected_frames(self):
        result = self.run_python("while True:\n    pass\n")
        self.assertNotEqual(result["exitCode"], 0)
        self.assertEqual(len(result["frames"]), 1000)
        self.assertIn("Trace limit exceeded", result["stderr"])

    def test_syntax_error_has_no_fabricated_frames(self):
        result = self.run_python("x = @\n")
        self.assertEqual(result["frames"], [])
        self.assertEqual(result["error"], "Syntax error")


if __name__ == "__main__":
    unittest.main(verbosity=2)
