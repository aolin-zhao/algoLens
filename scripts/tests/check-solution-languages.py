"""Compile curated non-Python implementations with the actual core adapter and sample cases."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "containers/python-runner"))
from runtime import core_source

problem = ROOT / "content/problems/two-sum"
cases = json.loads((problem / "tests.json").read_text())
invocation = {"className": "Solution", "method": "twoSum", "arguments": ["nums", "target"], "adapter": "two-sum"}
env = {**os.environ, "GOCACHE": "/tmp/algovision-go-cache"}
for slug in ["brute-force", "hash-map"]:
    folder = problem / "solutions" / slug
    meta = json.loads((folder / "solution.json").read_text())
    for implementation in meta["implementations"]:
        language = implementation["languageId"]
        if language == "python":
            continue
        code = (folder / implementation["code"]).read_text()
        with tempfile.TemporaryDirectory(prefix="algovision-solution-check-") as temp:
            directory = Path(temp)
            extension = {"c": "c", "cpp": "cpp", "java": "java", "go": "go"}[language]
            file = directory / ("Main.java" if language == "java" else "solution." + extension)
            for case in cases:
                file.write_text(core_source(language, code, case["input"], invocation))
                if language == "java":
                    compile_args = ["javac", "-encoding", "UTF-8", str(file)]
                    run_args = ["java", "-cp", temp, "Main"]
                elif language == "go":
                    compile_args = ["go", "build", "-o", str(directory / "run"), str(file)]
                    run_args = [str(directory / "run")]
                else:
                    compile_args = ["clang" if language == "c" else "clang++", "-std=c17" if language == "c" else "-std=c++17", str(file), "-o", str(directory / "run")]
                    run_args = [str(directory / "run")]
                subprocess.run(compile_args, check=True, capture_output=True, timeout=60, env=env)
                result = subprocess.run(run_args, check=True, capture_output=True, text=True, timeout=10, env=env)
                assert sorted(json.loads(result.stdout)) == sorted(json.loads(case["expected_output"])), (slug, language, case, result.stdout)
        print(f"{slug}/{language}: {len(cases)} cases passed", flush=True)
