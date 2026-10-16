"""Multi-language program execution. Each request uses a fresh working directory.

The container remains the isolation boundary; resource limits are defense in depth.
The historical directory/binding names are retained for existing deployments.
"""
import ast
import functools
import json
import os
from pathlib import Path
import re
import resource
import signal
import subprocess
import sys
import tempfile
import time

EXTENSIONS = {"python": "py", "javascript": "js", "typescript": "ts", "java": "java",
              "c": "c", "cpp": "cpp", "go": "go", "rust": "rs"}
MAX_OUTPUT = 65536
RUN_TIMEOUT = 6
COMPILE_TIMEOUT = 30


def limits(language, compiling):
    resource.setrlimit(resource.RLIMIT_CPU, (25, 25) if compiling else (5, 5))
    # Managed runtimes and compilers reserve large virtual address spaces.
    # Their total memory must also be bounded by the container's memory limit.
    if sys.platform != "darwin" and not compiling and language in ("python", "c", "cpp", "rust"):
        resource.setrlimit(resource.RLIMIT_AS, (256 * 1024 * 1024,) * 2)
    resource.setrlimit(resource.RLIMIT_FSIZE, (32 * 1024 * 1024,) * 2)
    resource.setrlimit(resource.RLIMIT_NOFILE, (128, 128))
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))


def kill_group(process):
    try:
        os.killpg(process.pid, signal.SIGKILL)
    except ProcessLookupError:
        pass


def command(args, directory, input_text, language, compiling=False):
    """File-backed output avoids buffering an unbounded child output in memory."""
    env = {"PATH": os.environ.get("PATH", "/usr/local/bin:/usr/bin:/bin"),
           "HOME": str(directory), "TMPDIR": str(directory), "PYTHONNOUSERSITE": "1",
           "LANG": "C.UTF-8", "LC_ALL": "C.UTF-8",
           "GOCACHE": str(directory / "go-cache"), "GOPATH": str(directory / "go"),
           "GOTOOLCHAIN": "local", "GOPROXY": "off", "GO111MODULE": "off"}
    for key in ("RUSTUP_HOME", "CARGO_HOME", "JAVA_HOME"):
        if key in os.environ:
            env[key] = os.environ[key]
    timeout = COMPILE_TIMEOUT if compiling else RUN_TIMEOUT
    with tempfile.TemporaryFile() as stdin, tempfile.TemporaryFile() as stdout, tempfile.TemporaryFile() as stderr:
        stdin.write(input_text.encode())
        stdin.seek(0)
        process = subprocess.Popen(args, cwd=directory, env=env, stdin=stdin, stdout=stdout,
                                   stderr=stderr, start_new_session=True,
                                   preexec_fn=functools.partial(limits, language, compiling))
        deadline = time.monotonic() + timeout
        failure = None
        try:
            while process.poll() is None:
                if time.monotonic() >= deadline:
                    failure = "Compilation time limit exceeded" if compiling else "Time limit exceeded"
                elif max(os.fstat(stdout.fileno()).st_size, os.fstat(stderr.fileno()).st_size) > MAX_OUTPUT:
                    failure = "Output limit exceeded"
                if failure:
                    kill_group(process)
                    break
                time.sleep(0.01)
            process.wait()
        finally:
            # Also clean up descendants left behind by a program that has exited.
            kill_group(process)
        stdout.seek(0)
        stderr.seek(0)
        out = stdout.read(MAX_OUTPUT).decode(errors="replace")
        err = stderr.read(MAX_OUTPUT).decode(errors="replace")
        if not failure and max(os.fstat(stdout.fileno()).st_size, os.fstat(stderr.fileno()).st_size) > MAX_OUTPUT:
            failure = "Output limit exceeded"
        if failure:
            err = err[:MAX_OUTPUT - len(failure) - 1] + "\n" + failure
        return out, err, process.returncode if not failure else (process.returncode or 1)


def validate_invocation(invocation):
    if not isinstance(invocation, dict):
        raise ValueError("Invalid core invocation")
    for key in ("className", "method"):
        if not isinstance(invocation.get(key), str) or not re.fullmatch(r"[A-Za-z_]\w*", invocation[key], re.ASCII):
            raise ValueError("Invalid core invocation")
    arguments = invocation.get("arguments")
    if not isinstance(arguments, list) or len(arguments) > 20 or not all(isinstance(key, str) for key in arguments):
        raise ValueError("Invalid core arguments")


def core_source(language, code, input_text, invocation):
    validate_invocation(invocation)
    data = json.loads(input_text)
    if not isinstance(data, dict) or any(key not in data for key in invocation["arguments"]):
        raise ValueError("Core mode requires a JSON object with the problem arguments")
    method, class_name = invocation["method"], invocation["className"]
    if language == "javascript":
        # The source and harness share module scope so function/const declarations work.
        config = json.dumps(invocation, ensure_ascii=True)
        return code + "\n;\n" + f"""
async function __avMain() {{
    const __avConfig = {config};
    const __avData = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    const __avArgs = __avConfig.arguments.map(key => __avData[key]);
    const __avResult = await {method}(...__avArgs);
    console.log(JSON.stringify(__avResult));
}}
__avMain().catch((error) => {{ console.error(error); process.exitCode = 1; }});
"""
    if language == "typescript":
        config = json.dumps(invocation, ensure_ascii=True)
        return code + "\n;\n" + f"""
const __avConfig = {config};
const __avData = JSON.parse(require('fs').readFileSync(0, 'utf8'));
Promise.resolve(({method} as (...args: any[]) => any)(...__avConfig.arguments.map(key => __avData[key])))
    .then(result => console.log(JSON.stringify(result)))
    .catch(error => {{ console.error(error); process.exitCode = 1; }});
"""
    if language == "python":
        return code
    # Native/JVM core adapters require a known typed signature. Main mode is generic.
    if invocation.get("adapter") != "two-sum" or invocation["arguments"] != ["nums", "target"]:
        raise ValueError("Unsupported core adapter for this language; use main mode")
    nums, target = data.get("nums"), data.get("target")
    if not isinstance(nums, list) or not nums or len(nums) > 10000 or any(type(n) is not int or not -2147483648 <= n <= 2147483647 for n in nums) or type(target) is not int or not -2147483648 <= target <= 2147483647:
        raise ValueError("Two Sum requires a nonempty int32 array nums and int32 target")
    values = ",".join(map(str, nums))
    if language == "java":
        return code + f"""
class Main {{
    public static void main(String[] args) {{
        int[] result = new {class_name}().{method}(new int[]{{{values}}}, {target});
        System.out.println(java.util.Arrays.toString(result));
    }}
}}
"""
    if language == "cpp":
        return "#include <iostream>\n#include <vector>\n" + code + f"""
int main() {{
    std::vector<int> nums = {{{values}}};
    auto result = {class_name}().{method}(nums, {target});
    std::cout << '[';
    for (size_t i = 0; i < result.size(); ++i) {{ if(i) std::cout << ','; std::cout << result[i]; }}
    std::cout << ']' << std::endl;
}}
"""
    if language == "c":
        return "#include <stdio.h>\n#include <stdlib.h>\n" + code + f"""
int main(void) {{
    int nums[] = {{{values}}};
    int size = 0;
    int* result = {method}(nums, {len(nums)}, {target}, &size);
    if (size < 0 || size > {len(nums)} || (size && !result)) return 1;
    printf("[");
    for (int i = 0; i < size; ++i) {{ if(i) printf(","); printf("%d", result[i]); }}
    printf("]\\n");
    free(result);
    return 0;
}}
"""
    if language == "go":
        return 'package main\nimport "encoding/json"\nimport "os"\n' + code + f"""
func main() {{
    result := {method}([]int{{{values}}}, {target})
    if err := json.NewEncoder(os.Stdout).Encode(result); err != nil {{ panic(err) }}
}}
"""
    if language == "rust":
        return "struct Solution;\n" + code + f"""
fn main() {{
    let result = {class_name}::{method}(vec![{values}], {target});
    println!("{{:?}}", result);
}}
"""
    raise ValueError("Unsupported language")


def run_code(body, trace_script):
    language = body.get("languageId", "python")  # Old queued Python jobs remain valid.
    code, input_text = body.get("code"), body.get("input", "")
    if language not in EXTENSIONS:
        raise ValueError("Unsupported language")
    if not isinstance(code, str) or not code or len(code) > 50000 or not isinstance(input_text, str) or len(input_text) > 20000:
        raise ValueError("Invalid code or input size")
    invocation = body.get("invocation")
    started = time.monotonic()
    result = {"stdout": "", "stderr": "", "exitCode": 0, "durationMs": 0, "frames": [], "error": None}
    try:
        with tempfile.TemporaryDirectory(prefix="algovision-") as temp:
            directory = Path(temp)
            source = core_source(language, code, input_text, invocation) if invocation is not None else code
            trace_file = directory / "trace.json"
            file = directory / ("Main.java" if language == "java" else "solution." + EXTENSIONS[language])
            file.write_text(source, encoding="utf-8")
            binary = str(directory / "program")
            compile_args = None
            if language == "python":
                ast.parse(code)
                run_args = [sys.executable, "-I", "-c", trace_script, code, str(trace_file), json.dumps(invocation)]
            elif language == "javascript":
                run_args = ["node", "--max-old-space-size=128", str(file)]
            elif language == "typescript":
                compile_args = ["tsc", str(file), "--target", "ES2022", "--module", "commonjs", "--strict", "--skipLibCheck", "--types", "node"]
                if os.environ.get("NODE_TYPE_ROOTS"):
                    compile_args += ["--typeRoots", os.environ["NODE_TYPE_ROOTS"]]
                run_args = ["node", "--max-old-space-size=128", str(directory / "solution.js")]
            elif language == "java":
                compile_args = ["javac", "-J-Xmx256m", "-encoding", "UTF-8", str(file)]
                run_args = ["java", "-Dfile.encoding=UTF-8", "-Xmx128m", "-XX:MaxMetaspaceSize=128m", "-XX:ReservedCodeCacheSize=32m", "-cp", temp, "Main"]
            elif language in ("c", "cpp"):
                compile_args = ["gcc" if language == "c" else "g++", "-std=c17" if language == "c" else "-std=c++17", "-O2", str(file), "-o", binary]
                if language == "c":
                    compile_args.append("-lm")
                run_args = [binary]
            elif language == "go":
                compile_args = ["go", "build", "-o", binary, str(file)]
                run_args = [binary]
            else:
                compile_args = ["rustc", "--edition=2021", "-O", str(file), "-o", binary]
                run_args = [binary]
            if compile_args:
                out, err, status = command(compile_args, directory, "", language, compiling=True)
                if status:
                    result.update(stderr=(out + err)[:MAX_OUTPUT], exitCode=status, error="Compilation failed")
                    return result
            out, err, status = command(run_args, directory, input_text, language)
            result.update(stdout=out, stderr=err, exitCode=status, error="Execution failed" if status else None)
            if language == "python" and trace_file.exists() and trace_file.stat().st_size <= 4_000_000:
                result["frames"] = json.loads(trace_file.read_text())[:1000]
    except SyntaxError as error:
        result.update(stderr=str(error), exitCode=1, error="Syntax error")
    finally:
        result["durationMs"] = int((time.monotonic() - started) * 1000)
    return result
