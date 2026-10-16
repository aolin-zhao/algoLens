import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# -I excludes the script directory; add only this root-owned application path.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from runtime import run_code

TRACE_SCRIPT = r'''
import dis, json, sys, time
frames = []
frame_ids = {}
pending_exceptions = {}
next_frame_id = 0
started = time.monotonic()
def deny_unsafe(event, args):
    if event.startswith(('socket.', 'subprocess.', 'os.system', 'os.exec', 'os.spawn', 'ctypes.')):
        raise PermissionError('Operation blocked in runner')
sys.addaudithook(deny_unsafe)
def safe(value, depth=0):
    try:
        if isinstance(value, (list, tuple)) and depth < 2:
            return {'type': 'array', 'items': [safe(item, depth + 1) for item in value[:30]], 'total': len(value)}
        if isinstance(value, dict) and depth < 2:
            return {'type': 'map', 'entries': [[safe(key, depth + 1), safe(item, depth + 1)] for key, item in list(value.items())[:30]], 'total': len(value)}
        text = repr(value)
        return {'type': 'scalar', 'value': text[:120] + ('...' if len(text) > 120 else '')}
    except Exception:
        return {'type': 'scalar', 'value': '<unavailable>'}
def trace(frame, event, arg):
    global next_frame_id
    if frame.f_code.co_filename != '<user>' or event not in ('line', 'call', 'return', 'exception'):
        return trace
    if frame.f_lineno < 1:
        return trace
    if len(frames) >= 1000 or time.monotonic() - started > 4:
        raise TimeoutError('Trace limit exceeded')
    identity = id(frame)
    if identity not in frame_ids:
        next_frame_id += 1
        frame_ids[identity] = next_frame_id
    local_values = [(k, v) for k, v in list(frame.f_locals.items()) if not k.startswith('__')]
    snapshot = {'line': frame.f_lineno, 'event': event, 'function': frame.f_code.co_name,
                'frameId': frame_ids[identity], 'localsCount': len(local_values),
                'locals': {k: safe(v) for k, v in local_values[:15]}}
    if event == 'return':
        exception = pending_exceptions.pop(identity, None)
        # A return trace event also occurs during exception unwinding and yield.
        # Only an actual return instruction supplies a function return value.
        instruction = dis.opname[frame.f_code.co_code[frame.f_lasti]]
        if instruction in ('RETURN_VALUE', 'RETURN_CONST'):
            snapshot['returnValue'] = safe(arg)
        elif exception:
            snapshot['exception'] = exception
        del frame_ids[identity]
    elif event == 'exception':
        snapshot['exception'] = arg[0].__name__ + ': ' + safe(arg[1])['value']
        pending_exceptions[identity] = snapshot['exception']
    frames.append(snapshot)
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

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.reply(200, {'ok': True})
        else:
            self.send_error(404)

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
            if not isinstance(body, dict):
                raise ValueError("Expected a JSON object")
            self.reply(200, run_code(body, TRACE_SCRIPT))
        except (ValueError, TypeError) as error:
            self.reply(400, {'error': str(error)})
        except Exception as error:
            self.reply(500, {'error': str(error)})

    def reply(self, status, body):
        encoded = json.dumps(body).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

if __name__ == '__main__':
    ThreadingHTTPServer(('0.0.0.0', int(os.environ.get('PORT', '8080'))), Handler).serve_forever()
