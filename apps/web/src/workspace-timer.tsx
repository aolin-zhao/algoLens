import { useEffect, useRef, useState } from "react";
import { Timer, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@algovision/ui";
export function WorkspaceTimer({ problemId, autoReset, alert }: {problemId: string; autoReset: boolean; alert: boolean}) {
  const [initial] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("av_timer") ?? "null");
      if (!saved || !["stopwatch", "countdown"].includes(saved.mode) || !Number.isFinite(saved.elapsed) || !Number.isFinite(saved.minutes)) return null;
      if (autoReset && saved.problemId !== problemId) return null;
      const elapsed = Math.max(0, saved.elapsed + (saved.running ? Math.floor((Date.now() - saved.savedAt) / 1000) : 0));
      return {...saved, elapsed: saved.mode === "countdown" ? Math.min(elapsed, saved.minutes * 60) : elapsed};
    } catch { return null; }
  });
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(initial?.running ?? false);
  const [mode, setMode] = useState<string>(initial?.mode ?? "stopwatch");
  const [minutes, setMinutes] = useState<number>(initial?.minutes ?? 30);
  const [elapsed, setElapsed] = useState<number>(initial?.elapsed ?? 0);
  const [finished, setFinished] = useState(false);
  const alertRef = useRef(alert);
  alertRef.current = alert;
  const started = useRef(0);
  const accumulated = useRef<number>(initial?.elapsed ?? 0);
  const previousProblem = useRef(problemId);
  const anchor = useRef<HTMLDivElement>(null);
  function reset() { setRunning(false); accumulated.current = 0; setElapsed(0); setFinished(false); }
  useEffect(() => { if (autoReset && previousProblem.current !== problemId) reset(); previousProblem.current = problemId; }, [problemId, autoReset]);
  useEffect(() => { localStorage.setItem("av_timer", JSON.stringify({mode,minutes,elapsed,running,problemId,savedAt:Date.now()})); }, [mode,minutes,elapsed,running,problemId]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!anchor.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("pointerdown", outside); window.addEventListener("keydown", escape);
    return () => { window.removeEventListener("pointerdown", outside); window.removeEventListener("keydown", escape); };
  }, [open]);
  useEffect(() => {
    if (!running) return;
    started.current = Date.now();
    const tick = () => {
      const value = accumulated.current + Math.floor((Date.now() - started.current) / 1000);
      if (mode === "countdown" && value >= minutes * 60) { setElapsed(minutes * 60); accumulated.current = minutes * 60; setRunning(false); setFinished(true); if (alertRef.current) setOpen(true); }
      else setElapsed(value);
    };
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [running, mode, minutes]);
  const seconds = mode === "countdown" ? Math.max(0, minutes * 60 - elapsed) : elapsed;
  const time = `${Math.floor(seconds / 3600).toString().padStart(2,"0")}:${Math.floor(seconds / 60 % 60).toString().padStart(2,"0")}:${(seconds % 60).toString().padStart(2,"0")}`;
  function toggle() { if (running) accumulated.current = elapsed; setRunning(!running); }
  return <div className="timer-anchor" ref={anchor}>
    <Button variant="ghost" title="计时器" aria-label="计时器" aria-expanded={open} onClick={() => setOpen(!open)}><Timer size={17} />{(running || elapsed > 0) && <span className="toolbar-time">{time}</span>}</Button>
    {open && <div className="timer-popover"><div className="timer-modes">{[["stopwatch","计时"],["countdown","倒计时"]].map(([value,label]) => <button key={value} className={mode === value ? "active" : ""} onClick={() => {reset();setMode(value);}}>{label}</button>)}</div>
      <output className="timer-display">{time}</output>
      {mode === "countdown" && <label className="timer-duration">时长（分钟）<input aria-label="倒计时时长" type="number" min={1} max={180} value={minutes} disabled={running} onChange={event => {reset();setMinutes(Math.max(1,Math.min(180,Number(event.target.value) || 1)));}} /></label>}
      {finished && <p role="status">倒计时结束</p>}
      <div className="timer-actions"><Button variant="secondary" disabled={finished} onClick={toggle}>{running ? <Pause size={14}/> : <Play size={14}/>} {running ? "暂停" : "开始"}</Button><Button variant="ghost" onClick={reset}><RotateCcw size={14}/> 重置</Button></div>
    </div>}
  </div>;
}
