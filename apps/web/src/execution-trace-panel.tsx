import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { Button, Empty, Select } from "@algovision/ui";
import { sameValue, type TraceFrame, type TraceValue } from "./execution-trace";
import "./execution-trace.css";

function ValueView({ value, previous }: { value: TraceValue; previous?: TraceValue }) {
  const changed = !sameValue(value, previous);
  const reduced = useReducedMotion();
  const animate = reduced ? {} : { scale: changed ? [1, 1.04, 1] : 1 };
  const count = value.type === "array" ? value.items.length : value.type === "map" ? value.entries.length : 0;
  return (
    <motion.div key={JSON.stringify(value)} className={`runtime-value ${changed ? "runtime-changed" : ""}`} animate={animate} transition={{ duration: .3 }}>
      {value.type === "scalar" ? <code>{value.value}</code> : value.type === "array" ? (
        <div className="runtime-array">
          {value.items.map((item, index) => (
            <div className="runtime-cell" key={index}>
              <ValueView value={item} previous={previous?.type === "array" ? previous.items[index] : undefined} />
              <small>{index}</small>
            </div>
          ))}
          {!count && <span className="runtime-empty">空数组 / 元组</span>}
        </div>
      ) : (
        <div className="runtime-map">
          {value.entries.map(([key, item]) => {
            const identity = JSON.stringify(key);
            const old = previous?.type === "map" ? previous.entries.find(([candidate]) => sameValue(candidate, key)) : undefined;
            return <div className="runtime-entry" key={identity}><ValueView value={key} previous={old?.[0]} /><span>→</span><ValueView value={item} previous={old?.[1]} /></div>;
          })}
          {!count && <span className="runtime-empty">空字典</span>}
        </div>
      )}
      {value.type !== "scalar" && value.total !== undefined && value.total > count && <small className="runtime-truncated">展示前 {count} 项，共 {value.total} 项</small>}
    </motion.div>
  );
}

const eventNames = { line: "即将执行", call: "进入函数", return: "离开函数", exception: "发生异常" };

export function ExecutionTracePanel({
  frames, previous, step, playing, speed, onStep, onPlaying, onSpeed,
  source, input, edited, status, language, loading, error, onRetry, failed,
}: {
  frames: TraceFrame[];
  previous?: TraceFrame;
  step: number;
  playing: boolean;
  speed: number;
  onStep: (step: number) => void;
  onPlaying: (playing: boolean) => void;
  onSpeed: (speed: number) => void;
  source: string;
  input: string;
  edited: boolean;
  status?: string;
  language: string;
  loading: boolean;
  error?: string;
  onRetry: () => void;
  failed: boolean;
}) {
  const frame = frames[step];
  const activeLine = useRef<HTMLDivElement>(null);
  const sourceDetails = useRef<HTMLDetailsElement>(null);
  useEffect(() => { if (edited && sourceDetails.current) sourceDetails.current.open = true; }, [edited]);
  useEffect(() => { activeLine.current?.scrollIntoView({ block: "nearest" }); }, [frame?.line, edited]);
  const removed = Object.keys(previous?.locals ?? {}).filter(name => frame && !(name in frame.locals));
  const move = (next: number) => { onPlaying(false); onStep(next); };
  return <div className="runtime-trace">
    <div className="runtime-heading"><strong>实际运行轨迹</strong><span>本次代码 · 本次输入</span></div>
    {language !== "python" ? <Empty text="此语言目前仅提供运行结果，暂不支持逐行轨迹" />
      : !status ? <Empty text="运行 Python 代码后，可回放真实执行过程" />
      : ["queued", "running"].includes(status) ? <Empty text="代码执行中，完成后可回放轨迹…" />
      : loading ? <Empty text="正在读取执行轨迹…" />
      : error ? <div role="alert"><p className="inline-note">{error}</p><Button variant="secondary" onClick={onRetry}>重试读取轨迹</Button></div>
      : !frame ? <Empty text={failed ? "本次运行未产生可回放轨迹，请查看测试结果中的错误" : "本次运行没有可回放的轨迹"} />
      : <>
        <div className="runtime-controls">
          <Button variant="ghost" aria-label="重播执行轨迹" onClick={() => move(0)}><RotateCcw size={15}/></Button>
          <Button variant="ghost" aria-label="上一步执行轨迹" disabled={step === 0} onClick={() => move(step - 1)}><ChevronLeft size={16}/></Button>
          <Button aria-label={playing ? "暂停执行轨迹" : "播放执行轨迹"} onClick={() => { if (step === frames.length - 1) onStep(0); onPlaying(!playing); }}>{playing ? <Pause size={14}/> : <Play size={14}/>}</Button>
          <Button variant="ghost" aria-label="下一步执行轨迹" disabled={step === frames.length - 1} onClick={() => move(step + 1)}><ChevronRight size={16}/></Button>
          <span className="runtime-step">{step + 1} / {frames.length}</span>
          <Select aria-label="执行轨迹播放速度" value={speed} onChange={onSpeed} options={[.5, 1, 2, 4].map(value => ({ value, label: `${value}×` }))}/>
        </div>
        <input className="runtime-slider" aria-label="跳转执行轨迹步骤" type="range" min={0} max={frames.length - 1} value={step} onChange={event => move(Number(event.target.value))}/>
        <div className="runtime-scroll">
          {failed && <p className="inline-note">本次执行失败，以下为中止前采集到的轨迹。错误详情见测试结果。</p>}
          {edited && <p className="inline-note">草稿已变化。轨迹对应下方的运行代码快照；重新运行可更新轨迹。</p>}
          <div className="runtime-event" aria-live="polite"><span>{eventNames[frame.event]} · 第 {frame.line} 行</span><code>{frame.function}{frame.frameId === undefined ? "" : ` · 调用 #${frame.frameId}`}</code></div>
          <p className="runtime-note">行事件显示执行该行之前的变量；变化会出现在后续快照中。着色表示相对同一次函数调用的上一快照发生变化。</p>
          <pre className="runtime-current-source">{source.split("\n")[frame.line - 1] ?? ""}</pre>
          {frame.exception && <p className="runtime-exception" role="status">{frame.exception}</p>}
          {frame.returnValue && <div className="runtime-variable"><strong>返回值</strong><ValueView value={frame.returnValue}/></div>}
          <div className="runtime-variables">
            {Object.entries(frame.locals).map(([name, value]) => {
              const old = previous?.locals[name];
              return <section className="runtime-variable" key={name}><div className="runtime-variable-label"><strong>{name}</strong>{!sameValue(value, old) && <small>{old ? "已变化" : "新出现"}</small>}</div><ValueView value={value} previous={old}/></section>;
            })}
            {removed.map(name => <div className="runtime-variable runtime-removed" key={name}><strong>{name}</strong><span>本帧未出现</span></div>)}
            {!Object.keys(frame.locals).length && <p className="runtime-note">当前作用域暂无局部变量</p>}
          </div>
          <p className="runtime-note">最多采集 1000 帧、15 个局部变量；容器最多展开 30 项、2 层，其他值以文本显示。</p>
          {frame.localsCount !== undefined && frame.localsCount > Object.keys(frame.locals).length && <p className="inline-note">当前作用域有 {frame.localsCount} 个变量，仅展示前 {Object.keys(frame.locals).length} 个。</p>}
          <details className="runtime-source" ref={sourceDetails} key={source}><summary>本次运行代码快照</summary><div className="runtime-source-lines">{source.split("\n").map((line, index) => <div key={index} ref={frame.line === index + 1 ? activeLine : undefined} className={frame.line === index + 1 ? "runtime-source-active" : ""}><span>{index + 1}</span><code>{line || " "}</code></div>)}</div></details>
          <details className="runtime-source"><summary>本次运行输入</summary><pre>{input}</pre></details>
        </div>
      </>}
  </div>;
}
