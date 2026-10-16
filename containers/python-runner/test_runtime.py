"""Run locally or against a container: RUNNER_URL=http://localhost:8082 python3 ..."""
import json
import os
from pathlib import Path
import sqlite3
import time
import unittest
import uuid
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from runtime import EXTENSIONS, run_code
from server import TRACE_SCRIPT

ROOT = Path(__file__).resolve().parents[2]
MAIN = {
    "python": 'import sys\nprint(sys.stdin.read().strip())',
    "javascript": "console.log(require('fs').readFileSync(0, 'utf8').trim());",
    "typescript": "import * as fs from 'fs';\nconst input: string = fs.readFileSync(0, 'utf8');\nconsole.log(input.trim());",
    "java": 'public class Main { public static void main(String[] args) { System.out.println(new java.util.Scanner(System.in).nextLine()); } }',
    "c": '#include <stdio.h>\nint main(void) { char text[200]; if (fgets(text, sizeof(text), stdin)) printf("%s", text); return 0; }',
    "cpp": '#include <iostream>\n#include <string>\nint main() { std::string text; std::getline(std::cin,text); std::cout << text << std::endl; }',
    "go": 'package main\nimport("fmt";"os";"io")\nfunc main() { data,_ := io.ReadAll(os.Stdin); fmt.Print(string(data)) }',
    "rust": 'use std::io::{self, Read};\nfn main() { let mut data = String::new(); io::stdin().read_to_string(&mut data).unwrap(); print!("{}", data); }',
}


def database():
    db = sqlite3.connect(":memory:")
    db.execute("PRAGMA foreign_keys=ON")
    for file in sorted((ROOT / "migrations").glob("*.sql")):
        db.executescript(file.read_text())
    db.executescript((ROOT / "scripts/seed.sql").read_text())
    return db


class RuntimeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = database()
        cls.token = None
        if os.environ.get("RUNNER_URL"):
            with urlopen(os.environ["RUNNER_URL"] + "/health", timeout=10) as response:
                assert json.load(response)["ok"]
        if os.environ.get("API_URL"):
            body = {"email": f"runner-test-{uuid.uuid4()}@example.com", "password": uuid.uuid4().hex, "displayName": "Runner test"}
            request = Request(os.environ["API_URL"] + "/api/auth/register", json.dumps(body).encode(), {"Content-Type": "application/json"})
            with urlopen(request, timeout=10) as response:
                cls.token = json.load(response)["token"]

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def run_program(self, language, code, input_text="", invocation=None):
        body = {"languageId": language, "code": code, "input": input_text, "invocation": invocation}
        if os.environ.get("API_URL"):
            base = os.environ["API_URL"] + "/api"
            headers = {"Content-Type": "application/json", "Authorization": "Bearer " + self.token}
            body = {"problemId": "11111111-1111-4111-8111-111111111111", "languageId": language,
                    "code": code, "input": input_text, "mode": "core" if invocation else "main"}
            with urlopen(Request(base + "/executions", json.dumps(body).encode(), headers), timeout=10) as response:
                job_id = json.load(response)["id"]
            deadline = time.monotonic() + 90
            while time.monotonic() < deadline:
                with urlopen(Request(base + "/executions/" + job_id, headers=headers), timeout=10) as response:
                    job = json.load(response)
                if job["status"] in ("completed", "failed"):
                    self.assertIsNotNone(job["result"], job)
                    result = job["result"]
                    frames = []
                    if language == "python" and result.get("traceKey"):
                        with urlopen(Request(base + "/executions/" + job_id + "/trace", headers=headers), timeout=10) as response:
                            frames = json.load(response)["frames"]
                    return {**result, "frames": frames, "error": job["error"]}
                time.sleep(0.2)
            self.fail(f"Execution {job_id} did not finish: {job}")
        if os.environ.get("RUNNER_URL"):
            request = Request(os.environ["RUNNER_URL"] + "/run", json.dumps(body).encode(), {"Content-Type": "application/json"})
            with urlopen(request, timeout=60) as response:
                return json.load(response)
        return run_code(body, TRACE_SCRIPT)

    def test_main_stdin_all_languages(self):
        for language, code in MAIN.items():
            with self.subTest(language=language):
                result = self.run_program(language, code, '{"hello":"世界"}\n')
                self.assertEqual(result["exitCode"], 0, result)
                self.assertEqual(result["stdout"].strip(), '{"hello":"世界"}', result)
                self.assertIsNone(result["error"])
                self.assertGreaterEqual(result["durationMs"], 0)
                if language != "python":
                    self.assertEqual(result["frames"], [])

    def test_core_all_languages_and_cases(self):
        cases = self.db.execute("SELECT input,expected_output FROM test_cases ORDER BY id").fetchall()
        templates = self.db.execute("SELECT language_id,code,invocation FROM language_templates WHERE mode='core'").fetchall()
        self.assertEqual({row[0] for row in templates}, set(EXTENSIONS))
        for language, code, invocation in templates:
            for input_text, expected in cases:
                with self.subTest(language=language, input=input_text):
                    result = self.run_program(language, code, input_text, json.loads(invocation))
                    self.assertEqual(result["exitCode"], 0, result)
                    self.assertEqual(json.loads(result["stdout"]), json.loads(expected), result)
                    if language == "python":
                        self.assertTrue(result["frames"])

    def test_compile_and_syntax_errors(self):
        for language in EXTENSIONS:
            with self.subTest(language=language):
                result = self.run_program(language, "this is not valid code @@@")
                self.assertNotEqual(result["exitCode"], 0, result)
                self.assertTrue(result["stderr"], result)
                self.assertTrue(result["error"], result)

    def test_typescript_type_errors(self):
        result = self.run_program("typescript", 'const value: number = "wrong"; console.log(value);')
        self.assertNotEqual(result["exitCode"], 0)
        self.assertEqual(result["error"], "Compilation failed")
        self.assertIn("not assignable", result["stdout"] + result["stderr"])

    def test_runtime_error(self):
        result = self.run_program("javascript", 'throw new Error("expected runtime failure");')
        self.assertNotEqual(result["exitCode"], 0)
        self.assertIn("expected runtime failure", result["stderr"])

    def test_timeout(self):
        # A timer verifies wall time enforcement without relying on a CPU signal.
        result = self.run_program("javascript", "setInterval(() => {}, 1000);")
        self.assertNotEqual(result["exitCode"], 0)
        self.assertIn("Time limit exceeded", result["stderr"])

    def test_output_limit(self):
        result = self.run_program("javascript", 'while(true) process.stdout.write("x".repeat(10000));')
        self.assertNotEqual(result["exitCode"], 0)
        self.assertLessEqual(len(result["stdout"].encode()), 65536)
        self.assertIn("Output limit exceeded", result["stderr"])

    def test_invalid_core_input(self):
        invocation = {"className": "Solution", "method": "twoSum", "arguments": ["nums", "target"], "adapter": "two-sum"}
        for input_text in ['{"nums":["bad"],"target":9}', '{"nums":[2,7]}', '{"nums":[2147483648],"target":9}']:
            with self.subTest(input=input_text):
                if os.environ.get("RUNNER_URL") or os.environ.get("API_URL"):
                    with self.assertRaises(HTTPError) as error:
                        self.run_program("cpp", "int dummy;", input_text, invocation)
                    self.assertEqual(error.exception.code, 400)
                else:
                    with self.assertRaises(ValueError):
                        self.run_program("cpp", "int dummy;", input_text, invocation)

    def test_fresh_and_existing_database_upgrade(self):
        self.assertEqual(self.db.execute("SELECT count(*) FROM languages WHERE enabled=1").fetchone()[0], 8)
        upgraded = sqlite3.connect(":memory:")
        try:
            for file in sorted((ROOT / "migrations").glob("000[01]*.sql")):
                upgraded.executescript(file.read_text())
            # Simulate the old installation's seed without the appended upgrade.
            old_seed = (ROOT / "scripts/seed.sql").read_text().split("-- Output-only runtimes")[0]
            upgraded.executescript(old_seed)
            upgraded.executescript((ROOT / "migrations/0002_multilanguage_execution.sql").read_text())
            self.assertEqual(upgraded.execute("SELECT count(*) FROM languages WHERE enabled=1").fetchone()[0], 8)
            self.assertEqual(upgraded.execute("SELECT count(*) FROM language_templates").fetchone()[0], 16)
            # Reapplying the data upgrade keeps administrator changes intact.
            upgraded.execute("UPDATE language_templates SET code='custom' WHERE language_id='java' AND mode='core'")
            upgraded.executescript((ROOT / "migrations/0002_multilanguage_execution.sql").read_text())
            self.assertEqual(upgraded.execute("SELECT code FROM language_templates WHERE language_id='java' AND mode='core'").fetchone()[0], "custom")
        finally:
            upgraded.close()


if __name__ == "__main__":
    unittest.main(verbosity=2)
