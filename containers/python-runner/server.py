import ast
import json
import os
import resource
import subprocess
import sys
import tempfile
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

MAX_CODE = 50000
MAX_INPUT = 20000
MAX_OUTPUT = 65536
MAX_FRAMES = 1000

TRACE_SCRIPT = r'''
import json, sys, time
frames = []
started = time.monotonic()
def deny_unsafe(event, args):
    if event.startswith(('socket.', 'subprocess.', 'os.system', 'os.exec', 'os.spawn', 'ctypes.')):
        raise PermissionError('Operation blocked in runner')
sys.addaudithook(deny_unsafe)
def safe(value, depth=0):
    try:
        if isinstance(value, (list, tuple)) and depth < 2:
            return {'type': 'array', 'items': [safe(item, depth + 1) for item in value[:30]]}
        if isinstance(value, dict) and depth < 2:
            return {'type': 'map', 'entries': [[safe(key, depth + 1), safe(item, depth + 1)] for key, item in list(value.items())[:30]]}
        text = repr(value)
        return {'type': 'scalar', 'value': text[:120] + ('...' if len(text) > 120 else '')}
    except Exception:
        return {'type': 'scalar', 'value': '<unavailable>'}
def trace(frame, event, arg):
    if frame.f_code.co_filename != '<user>' or event not in ('line', 'call', 'return'):
        return trace
    if frame.f_lineno < 1:
        return trace
    if len(frames) >= 1000 or time.monotonic() - started > 4:
        raise TimeoutError('Trace limit exceeded')
    frames.append({'line': frame.f_lineno, 'event': event, 'function': frame.f_code.co_name,
                   'locals': {k: safe(v) for k, v in list(frame.f_locals.items())[:15] if not k.startswith('__')}})
    return trace
source = sys.argv[1]
trace_file = sys.argv[2]
try:
    sys.settrace(trace)
    invocation = json.loads(sys.argv[3])
    namespace = {'__name__': '__solution__' if invocation else '__main__'}
    if invocation:
        from typing import List, Optional
        namespace.update({'List': List, 'Optional': Optional})
    exec(compile(source, '<user>', 'exec'), namespace)
    if invocation:
        data = json.load(sys.stdin)
        solution = namespace[invocation['className']]()
        result = getattr(solution, invocation['method'])(*[data[key] for key in invocation['arguments']])
        print(json.dumps(result, ensure_ascii=False))
finally:
    sys.settrace(None)
    with open(trace_file, 'w') as out:
        json.dump(frames, out)
'''

def limits():
    resource.setrlimit(resource.RLIMIT_CPU, (5, 5))
    if sys.platform != 'darwin':
        resource.setrlimit(resource.RLIMIT_AS, (256 * 1024 * 1024, 256 * 1024 * 1024))
    resource.setrlimit(resource.RLIMIT_FSIZE, (2 * 1024 * 1024, 2 * 1024 * 1024))
    resource.setrlimit(resource.RLIMIT_NOFILE, (32, 32))
    resource.setrlimit(resource.RLIMIT_NPROC, (32, 32))

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != '/run':
            self.send_error(404)
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length <= 0 or length > 100000:
                self.send_error(413)
                return
            body = json.loads(self.rfile.read(length))
            code, input_text = body['code'], body['input']
            if not isinstance(code, str) or not isinstance(input_text, str) or len(code) > MAX_CODE or len(input_text) > MAX_INPUT:
                self.send_error(400)
                return
            ast.parse(code)
            started = time.monotonic()
            with tempfile.TemporaryDirectory() as temp:
                trace_file = os.path.join(temp, 'trace.json')
                process = subprocess.Popen([sys.executable, '-I', '-c', TRACE_SCRIPT, code, trace_file, json.dumps(body.get('invocation'))],
                    stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                    cwd=temp, env={'PATH': '/usr/local/bin:/usr/bin', 'HOME': temp, 'PYTHONNOUSERSITE': '1'}, preexec_fn=limits)
                try:
                    stdout, stderr = process.communicate(input_text.encode(), timeout=6)
                except subprocess.TimeoutExpired:
                    process.kill()
                    stdout, stderr = process.communicate()
                    stderr += b'\nTime limit exceeded'
                frames = []
                if os.path.exists(trace_file):
                    with open(trace_file) as file:
                        frames = json.load(file)[:MAX_FRAMES]
            result = {'stdout': stdout[:MAX_OUTPUT].decode(errors='replace'), 'stderr': stderr[:MAX_OUTPUT].decode(errors='replace'),
                      'exitCode': process.returncode, 'durationMs': int((time.monotonic() - started) * 1000), 'frames': frames,
                      'error': None if process.returncode == 0 else 'Execution failed'}
            self.reply(200, result)
        except SyntaxError as error:
            self.reply(200, {'stdout': '', 'stderr': str(error), 'exitCode': 1, 'durationMs': 0, 'frames': [], 'error': 'Syntax error'})
        except Exception as error:
            self.reply(500, {'error': str(error)})

    def reply(self, status, body):
        encoded = json.dumps(body).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

ThreadingHTTPServer(('0.0.0.0', int(os.environ.get('PORT', '8080'))), Handler).serve_forever()
