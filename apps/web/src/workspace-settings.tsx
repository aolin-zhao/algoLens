import { useEffect, useState } from "react";
import { SettingsModal as Modal, Switch } from "@algovision/ui";
import { Code2, Keyboard, LayoutGrid, FlaskConical, Settings, Sparkles, Timer } from "lucide-react";
import { Button, Select } from "@algovision/ui";

export const defaultPreferences = {
  font: "default", fontSize: 13, ligatures: false, tabSize: 4,
  wordWrap: true, relativeLines: false, autocomplete: true,
  runPosition: "toolbar", realtimeResize: true, runShortcut: true,
  timerAutoReset: false, timerAlert: false,
};
export type EditorPreferences = typeof defaultPreferences;
export function useEditorPreferences() {
  const [preferences, setPreferences] = useState<EditorPreferences>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("av_editor_preferences") ?? "{}");
      const result = { ...defaultPreferences };
      for (const key of Object.keys(result) as (keyof EditorPreferences)[]) {
        if (typeof saved[key] === typeof result[key]) Object.assign(result, { [key]: saved[key] });
      }
      if (![12, 13, 14, 16, 18, 20].includes(result.fontSize)) result.fontSize = 13;
      if (![2, 4, 8].includes(result.tabSize)) result.tabSize = 4;
      if (!["toolbar", "editor"].includes(result.runPosition)) result.runPosition = "toolbar";
      if (!["default", "monospace", "consolas"].includes(result.font)) result.font = "default";
      return result;
    } catch { return defaultPreferences; }
  });
  useEffect(() => { localStorage.setItem("av_editor_preferences", JSON.stringify(preferences)); }, [preferences]);
  return [preferences, setPreferences] as const;
}
const sections = [
  ["layout", "灵动布局", LayoutGrid], ["editor", "代码编辑器", Code2],
  ["keyboard", "键盘快捷键", Keyboard], ["advanced", "高级设置", FlaskConical],
  ["leet", "Leet", Sparkles], ["timer", "计时器", Timer],
] as const;
export function WorkspaceSettings({ preferences, onChange, onReset }: {
  preferences: EditorPreferences; onChange: (value: EditorPreferences) => void; onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<string>("layout");
  const update = <K extends keyof EditorPreferences>(key: K, value: EditorPreferences[K]) => onChange({ ...preferences, [key]: value });
  const toggle = (key: keyof EditorPreferences, label: string, description?: string) => (
    <div className="setting-row"><div><strong>{label}</strong>{description && <p>{description}</p>}</div>
      <Switch aria-label={label} checked={!!preferences[key]} onChange={value => update(key, value)} size="small" />
    </div>
  );
  const select = (key: "font" | "fontSize" | "tabSize", label: string, options: {value: string | number; label: string}[]) => (
    <div className="setting-row"><strong>{label}</strong><Select size="small" variant="filled" aria-label={label} value={preferences[key]} options={options} onChange={value => update(key, value)} /></div>
  );
  return <>
    <Button variant="ghost" title="设置" aria-label="设置" onClick={() => setOpen(true)}><Settings size={17} /></Button>
    <Modal open={open} onCancel={() => setOpen(false)} footer={null} title={null} width={780} centered className="workspace-settings-modal" styles={{body:{padding:0}}}>
      <div className="settings-shell">
        <aside className="settings-sidebar"><h2>设置</h2><nav aria-label="设置分类">
          {sections.map(([key, label, Icon]) => <button key={key} className={section === key ? "active" : ""} onClick={() => setSection(key)}><Icon size={15} />{label}</button>)}
        </nav></aside>
        <section className="settings-content" aria-label={sections.find(([key]) => key === section)?.[1]}>
          {section === "layout" && <>
            <div className="setting-row"><strong>重置为默认布局</strong><Button variant="secondary" onClick={onReset}>重置</Button></div>
            <div className="setting-row position-setting"><strong>运行按钮位置</strong><div className="position-choices">
              {[["toolbar", "顶部工具栏"], ["editor", "代码编辑器"]].map(([value,label]) => <button key={value} aria-pressed={preferences.runPosition === value} onClick={() => update("runPosition", value)}><span className={`position-preview position-${value}`}><i /><i /><b /></span>{label}</button>)}
            </div></div>
          </>}
          {section === "editor" && <>
            {select("font", "字体", [{value:"default",label:"Default"},{value:"monospace",label:"Monospace"},{value:"consolas",label:"Consolas"}])}
            {select("fontSize", "字体大小", [12,13,14,16,18,20].map(value => ({value,label:`${value}px`})))}
            {toggle("ligatures", "字体连字")}
            <div className="setting-row"><strong>键位绑定</strong><span className="setting-value">Standard</span></div>
            {select("tabSize", "Tab 长度", [2,4,8].map(value => ({value,label:`${value} 个空格`})))}
            {toggle("wordWrap", "自动换行")}{toggle("relativeLines", "显示相对行号")}{toggle("autocomplete", "基础代码补全")}
          </>}
          {section === "keyboard" && <>
            <h3>常规</h3>{toggle("runShortcut", "执行代码快捷键")}
            {[["执行代码", "⌘ / Ctrl + ’"],["放大 / 退出放大面板", "Alt + +"],["关闭当前标签", "Alt + W"],["进入 / 退出全屏", "Alt + F"]].map(([label,key]) => <div className="setting-row" key={label}><span>{label}</span><kbd>{key}</kbd></div>)}
            <h3>代码编辑器</h3>{[["行缩进", "Tab"],["行减少缩进", "Shift + Tab"],["切换行注释", "⌘ / Ctrl + /"],["撤销", "⌘ / Ctrl + Z"]].map(([label,key]) => <div className="setting-row" key={label}><span>{label}</span><kbd>{key}</kbd></div>)}
          </>}
          {section === "advanced" && <>{toggle("realtimeResize", "布局实时变化", "拖动调整窗口尺寸时，布局实时变化。")}
            <div className="setting-row"><div><strong>保存自定义布局</strong><p>在布局菜单中保存，存储在当前浏览器。</p></div></div>
          </>}
          {section === "leet" && <div className="settings-unavailable"><Sparkles size={25} /><h3>AI 编程助手</h3><p>尚未接入 AI 服务。你可以使用图解题解查看算法思路。</p></div>}
          {section === "timer" && <>{toggle("timerAutoReset", "自动重置", "切换题目时重置计时器。")}{toggle("timerAlert", "结束提醒", "倒计时结束时显示提醒。")}</>}
        </section>
      </div>
    </Modal>
  </>;
}
