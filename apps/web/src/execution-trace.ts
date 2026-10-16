export type TraceValue =
  | { type: "scalar"; value: string }
  | { type: "array"; items: TraceValue[]; total?: number }
  | { type: "map"; entries: [TraceValue, TraceValue][]; total?: number };

export type TraceFrame = {
  line: number;
  event: "line" | "call" | "return" | "exception";
  function: string;
  frameId?: number;
  locals: Record<string, TraceValue>;
  localsCount?: number;
  returnValue?: TraceValue;
  exception?: string;
};
export type ExecutionTrace = { version: 2; frames: TraceFrame[] };

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

function validValue(value: unknown, depth = 0): value is TraceValue {
  if (!record(value) || depth > 8) return false;
  if (value.type === "scalar") return typeof value.value === "string";
  if (value.total !== undefined && (!Number.isSafeInteger(value.total) || (value.total as number) < 0)) return false;
  if (value.type === "array")
    return Array.isArray(value.items) && value.items.length <= 30 && value.items.every(item => validValue(item, depth + 1));
  if (value.type === "map")
    return Array.isArray(value.entries) && value.entries.length <= 30 && value.entries.every(entry =>
      Array.isArray(entry) && entry.length === 2 && entry.every(item => validValue(item, depth + 1)));
  return false;
}

export function parseExecutionTrace(value: unknown): ExecutionTrace {
  if (!record(value) || value.version !== 2) throw new Error("暂不支持此执行轨迹版本");
  if (!Array.isArray(value.frames) || value.frames.length > 1000 || !value.frames.every(frame =>
    record(frame) && Number.isSafeInteger(frame.line) && (frame.line as number) > 0 &&
    ["line", "call", "return", "exception"].includes(frame.event as string) &&
    typeof frame.function === "string" && record(frame.locals) && Object.values(frame.locals).every(item => validValue(item)) &&
    (frame.frameId === undefined || (Number.isSafeInteger(frame.frameId) && (frame.frameId as number) > 0)) &&
    (frame.localsCount === undefined || (Number.isSafeInteger(frame.localsCount) && (frame.localsCount as number) >= 0)) &&
    (frame.returnValue === undefined || validValue(frame.returnValue)) &&
    (frame.exception === undefined || typeof frame.exception === "string")))
    throw new Error("执行轨迹数据格式无效，请重新运行代码");
  return value as ExecutionTrace;
}

export function sameValue(a: TraceValue | undefined, b: TraceValue | undefined) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// Compare a frame with the previous snapshot of the same invocation, not a callee
// or another invocation with the same function name. Infer scopes for old v2 traces.
export function previousScopeFrames(frames: TraceFrame[]): (TraceFrame | undefined)[] {
  const previous = new Map<string, TraceFrame>();
  const stack = [0];
  let nextScope = 0;
  return frames.map(frame => {
    if (frame.event === "call") stack.push(++nextScope);
    const key = frame.frameId === undefined ? `legacy:${stack.at(-1)}` : `frame:${frame.frameId}`;
    const last = previous.get(key);
    previous.set(key, frame);
    if (frame.event === "return" && stack.length > 1) stack.pop();
    return last;
  });
}

export function traceLineForEditor(frame: TraceFrame | undefined, draft: string, snapshot: string, sameContext: boolean) {
  if (!frame || !sameContext || draft !== snapshot || frame.line > snapshot.split("\n").length) return null;
  return frame.line;
}
