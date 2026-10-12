import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { Button, Empty, Select } from "@algovision/ui";

import { buildTwoSumScenes } from "./solution-scenes";
export function SolutionDiagram({
  slug,
  input,
}: {
  slug: string;
  input: string;
}) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const data = useMemo(() => {
    try {
      const value = JSON.parse(input);
      if (
        !Array.isArray(value.nums) ||
        value.nums.length < 2 ||
        value.nums.length > 200 ||
        !value.nums.every(
          (n: unknown) =>
            typeof n === "number" &&
            Number.isSafeInteger(n) &&
            Math.abs(n) <= 1e9,
        ) ||
        !Number.isSafeInteger(value.target) ||
        Math.abs(value.target) > 1e9
      )
        return null;
      return { nums: value.nums as number[], target: value.target as number };
    } catch {
      return null;
    }
  }, [input]);
  const scenes = useMemo(
    () =>
      data && slug === "two-sum"
        ? buildTwoSumScenes(data.nums, data.target)
        : [],
    [data, slug],
  );
  useEffect(() => {
    setStep(0);
    setPlaying(false);
  }, [input, slug]);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () =>
        setStep((s) => {
          if (s >= scenes.length - 1) {
            setPlaying(false);
            return s;
          }
          return s + 1;
        }),
      1600 / speed,
    );
    return () => clearInterval(timer);
  }, [playing, scenes.length, speed]);
  const scene = scenes[Math.min(step, scenes.length - 1)];
  if (slug !== "two-sum")
    return (
      <div className="solution-document">
        <Empty text="这道题暂未配置专属题解图示" />
        <p className="inline-note">图解需要针对题目的数据结构和解法设计。</p>
      </div>
    );
  return (
    <div className="solution-document">
      <div className="solution-heading">
        <span className="eyebrow">思路图解 · 01</span>
        <h2>用哈希表，记住另一半</h2>
        <p>边遍历，边查找。把两层循环中的“寻找”变成一次查询。</p>
        <div className="complexity">
          <span>
            时间 <code>O(n)</code>
          </span>
          <span>
            空间 <code>O(n)</code>
          </span>
        </div>
      </div>
      <div className="strategy-flow">
        <span>读取当前值</span>
        <ArrowRight size={13} />
        <span>查找互补值</span>
        <ArrowRight size={13} />
        <span>配对 / 记录</span>
      </div>
      <p className="diagram-source">
        根据测试输入演示哈希表解法 · 与编辑器代码独立
      </p>
      {!data || !scene ? (
        <Empty text='输入有效的 {"nums": [2,7,11,15], "target": 9} 即可生成图解（最多 200 个元素）' />
      ) : (
        <>
          <div className="diagram-scene">
            <div className="diagram-topline">
              <span>数组 nums</span>
              <span>
                目标 <strong>{data.target}</strong>
              </span>
            </div>
            <div className="diagram-array">
              {data.nums.map((n, i) => (
                <div
                  key={i}
                  className={`diagram-cell ${scene.index === i ? "current" : ""} ${scene.match === i ? "matched" : ""} ${i < scene.index ? "visited" : ""}`}
                >
                  <span className="pointer">
                    {scene.index === i
                      ? "当前 ↓"
                      : scene.match === i
                        ? "配对 ↓"
                        : ""}
                  </span>
                  <strong>{n}</strong>
                  <small>{i}</small>
                </div>
              ))}
            </div>
            {scene.index < data.nums.length && (
              <div
                className={`complement-equation ${scene.match !== undefined ? "found" : ""}`}
              >
                <span>{data.target}</span>
                <span>−</span>
                <span>{data.nums[scene.index]}</span>
                <span>=</span>
                <strong>{scene.complement}</strong>
                <small>
                  {scene.match !== undefined ? (
                    <>
                      <Check size={13} /> 已找到
                    </>
                  ) : (
                    "查找这个数"
                  )}
                </small>
              </div>
            )}
            <div className="hash-heading">
              <span>已见过的数字</span>
              <small>数值 → 下标</small>
            </div>
            <div className="hash-table">
              {scene.seen.length ? (
                scene.seen.map(([value, index]) => (
                  <div
                    key={value}
                    className={scene.match === index ? "hash-hit" : ""}
                  >
                    <strong>{value}</strong>
                    <ArrowRight size={12} />
                    <span>{index}</span>
                  </div>
                ))
              ) : (
                <p>空表 · 尚未记录数字</p>
              )}
            </div>
          </div>
          <div
            className={`scene-explanation ${scene.match !== undefined ? "success" : ""}`}
            aria-live="polite"
          >
            <span className="scene-number">
              {String(step + 1).padStart(2, "0")}
            </span>
            <div>
              <h3>{scene.title}</h3>
              <p>{scene.explanation}</p>
            </div>
          </div>
          <div className="diagram-playback">
            <Button
              variant="ghost"
              aria-label="重新演示"
              onClick={() => {
                setStep(0);
                setPlaying(false);
              }}
            >
              <RotateCcw size={15} />
            </Button>
            <Button
              variant="ghost"
              aria-label="上一步图解"
              disabled={step === 0}
              onClick={() => {
                setPlaying(false);
                setStep((s) => s - 1);
              }}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              aria-label={playing ? "暂停图解" : "播放图解"}
              onClick={() => {
                if (step === scenes.length - 1) setStep(0);
                setPlaying(!playing);
              }}
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </Button>
            <Button
              variant="ghost"
              aria-label="下一步图解"
              disabled={step >= scenes.length - 1}
              onClick={() => {
                setPlaying(false);
                setStep((s) => s + 1);
              }}
            >
              <ChevronRight size={16} />
            </Button>
            <span>
              {step + 1} / {scenes.length}
            </span>
            <Select
              aria-label="图解播放速度"
              value={String(speed)}
              onChange={(v) => setSpeed(Number(v))}
              options={[
                { value: "0.5", label: "0.5×" },
                { value: "1", label: "1×" },
                { value: "2", label: "2×" },
              ]}
            />
          </div>
          <input
            className="step-slider"
            aria-label="跳转图解步骤"
            type="range"
            min={0}
            max={scenes.length - 1}
            value={Math.min(step, scenes.length - 1)}
            onChange={(e) => {
              setPlaying(false);
              setStep(Number(e.target.value));
            }}
          />
        </>
      )}
      <div className="solution-takeaway">
        <h3>为什么先查找，再记录？</h3>
        <p>
          避免把当前元素与自己配对。例如 <code>[3, 3]</code>
          ，寻找的是之前出现的另一个 3，才能返回两个不同的下标。
        </p>
      </div>
    </div>
  );
}
