import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Actions,
  DockLocation,
  Layout,
  Model,
  TabNode,
  TabSetNode,
  I18nLabelDefaults,
  type IJsonModel,
  type IJsonTabSetNode,
} from "flexlayout-react";
import {
  PanelLeft,
  BookOpen,
  Check,
  Code2,
  FlaskConical,
  LayoutGrid,
  Maximize2,
  RotateCcw,
  Sparkles,
  SquareTerminal,
} from "lucide-react";
import { Button } from "@algovision/ui";
import "flexlayout-react/style/light.css";
const keys = ["problem", "solution", "editor", "tests", "result"] as const;
type Panel = (typeof keys)[number];
const names: Record<Panel, string> = {
  problem: "题目描述",
  solution: "图解题解",
  editor: "代码",
  tests: "测试用例",
  result: "测试结果",
};
const icons = {
  problem: BookOpen,
  solution: Sparkles,
  editor: Code2,
  tests: FlaskConical,
  result: SquareTerminal,
};
const storageKey = "av_docking_layout_v2";
const global = {
  splitterSize: 8,
  tabSetTabStripHeight: 36,
  tabEnableClose: true,
  tabEnableRename: false,
  tabEnablePopout: false,
  tabEnableFloat: false,
  tabSetEnableCloseButton: false,
  tabSetEnableMaximize: true,
  tabSetMinWidth: 220,
  tabSetMinHeight: 100,
  tabEnableRenderOnDemand: false,
};
const tab = (key: Panel) => ({
  type: "tab",
  id: key,
  name: names[key],
  component: key,
});
const group = (id: string, panels: Panel[], weight = 50): IJsonTabSetNode => ({
  type: "tabset",
  id,
  weight,
  children: panels.map(tab),
});
function preset(
  kind: "default" | "solution" | "mobile" = "default",
): IJsonModel {
  if (kind === "mobile")
    return {
      global: { ...global, tabSetMinWidth: 0 },
      layout: { type: "row", children: [group("mobile", [...keys])] },
    };
  const right = {
    type: "row",
    weight: 50,
    children: [
      group("code", ["editor"], 64),
      group("test", ["tests", "result"], 36),
    ],
  };
  return {
    global,
    layout: {
      type: "row",
      children:
        kind === "solution"
          ? [
              group("description", ["problem"], 28),
              group("explanation", ["solution"], 36),
              { ...right, weight: 36 },
            ]
          : [group("description", ["problem", "solution"]), right],
    },
  };
}
function loadLayout(json: IJsonModel) {
  const model = Model.fromJson(json);
  const removed: string[] = [];
  let panelCount = 0;
  model.visitNodes((node) => {
    if (node instanceof TabNode) {
      if (keys.includes(node.getComponent() as Panel)) panelCount++;
      else removed.push(node.getId());
    }
  });
  if (!panelCount) return Model.fromJson(preset());
  removed.forEach(id => model.doAction(Actions.deleteTab(id)));
  return model;
}
function restore() {
  try {
    const json = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    if (json) return loadLayout(json);
  } catch {}
  return Model.fromJson(preset());
}
const translations: Record<string, string> = {
  "flexlayout.ui.close.tab": "关闭标签",
  "flexlayout.ui.maximize.tabset": "放大面板",
  "flexlayout.ui.restore.tabset": "还原面板",
  "flexlayout.ui.active.tabset": "当前面板",
  "flexlayout.ui.move.tabset": "移动面板",
  "flexlayout.ui.splitter": "调整面板尺寸",
  "flexlayout.ui.overflow.menu.tooltip": "更多标签",
  "flexlayout.ui.error.rendering.component": "面板加载失败",
  "flexlayout.ui.error.rendering.component.retry": "重试",
  "flexlayout.ui.menu.maximize": "放大面板",
  "flexlayout.ui.menu.restore": "还原面板",
  "flexlayout.ui.menu.close.all": "关闭全部",
  "flexlayout.ui.menu.close.others": "关闭其他标签",
  "flexlayout.ui.menu.close.right": "关闭右侧标签",
};
export function IslandLayout({
  panels,
  runControl,
  resultKey,
  navigationControl,
  settingsControl,
  resetKey,
  realtimeResize = true,
  toolbarRun = true,
}: {
  panels: Record<Panel, ReactNode>;
  runControl: ReactNode;
  resultKey: string;
  navigationControl?: ReactNode;
  settingsControl?: ReactNode;
  resetKey?: number;
  realtimeResize?: boolean;
  toolbarRun?: boolean;
}) {
  const [desktopModel, setDesktopModel] = useState(restore);
  const [mobileModel] = useState(() => Model.fromJson(preset("mobile")));
  const [mobile, setMobile] = useState(
    () => window.matchMedia("(max-width: 640px)").matches,
  );
  const [settings, setSettings] = useState(false);
  const [custom, setCustom] = useState(() => !!localStorage.getItem("av_custom_layout"));
  const [selected, setSelected] = useState<"default" | "solution">("default");
  const [, setRevision] = useState(0);
  const menu = useRef<HTMLDivElement>(null);
  const model = mobile ? mobileModel : desktopModel;
  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const update = () => setMobile(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSettings(false);
        const maximized = model.getMaximizedTabset();
        if (maximized)
          model.doAction(Actions.maximizeToggle(maximized.getId()));
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [model]);
  useEffect(() => {
    if (!settings) return;
    const outside = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node)) setSettings(false);
    };
    window.addEventListener("pointerdown", outside);
    return () => window.removeEventListener("pointerdown", outside);
  }, [settings]);
  useEffect(() => {
    if (resultKey) open("result");
  }, [resultKey, model]);
  useEffect(() => { if (resetKey) reset("default"); }, [resetKey]);
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (!event.altKey) return;
      const active = model.getActiveTabset();
      if (event.key === "+" || event.key === "=") { event.preventDefault(); if (active) { model.doAction(Actions.maximizeToggle(active.getId())); persist(model); } }
      if (event.key.toLowerCase() === "w" && active) { const node = active.getSelectedNode(); let count = 0; model.visitNodes(n => { if (n instanceof TabNode) count++; }); if (node && count > 1) { event.preventDefault(); model.doAction(Actions.deleteTab(node.getId())); persist(model); } }
      if (event.key.toLowerCase() === "f") { event.preventDefault(); if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen().catch(() => {}); }
    };
    window.addEventListener("keydown", handle); return () => window.removeEventListener("keydown", handle);
  }, [model, mobile]);
  function persist(next: Model) {
    if (!mobile)
      localStorage.setItem(storageKey, JSON.stringify(next.toJson()));
    setRevision((v) => v + 1);
  }
  function reset(kind: "default" | "solution") {
    const next = Model.fromJson(preset(kind));
    setDesktopModel(next);
    localStorage.setItem(storageKey, JSON.stringify(next.toJson()));
    setSettings(false);
  }
  function open(key: Panel) {
    const node = model.getNodeById(key);
    if (node) model.doAction(Actions.selectTab(key));
    else {
      let target = model.getActiveTabset();
      if (!target)
        model.visitNodes((n) => {
          if (!target && n instanceof TabSetNode) target = n;
        });
      if (target)
        model.doAction(
          Actions.addNode(
            tab(key),
            target.getId(),
            DockLocation.CENTER,
            -1,
            true,
          ),
        );
    }
    persist(model);
  }
  function focus() {
    open("editor");
    const parent = model.getNodeById("editor")?.getParent();
    if (parent instanceof TabSetNode) {
      model.doAction(Actions.maximizeToggle(parent.getId()));
      persist(model);
    }
    setSettings(false);
  }
  return (
    <main className="island-workspace docking-workspace">
      <div className="workspace-bar">
        {navigationControl ?? <Link className="workspace-back" to="/" aria-label="返回题目列表"><PanelLeft size={17} /> <span>题库</span></Link>}
        <div className="workspace-run">{toolbarRun && runControl}</div>
        <div className="workspace-utilities">
        <div className="layout-menu-anchor" ref={menu}>
          <Button
            variant="ghost"
            aria-label="布局"
            title="布局"
            onClick={() => setSettings(!settings)}
            aria-expanded={settings}
          >
            <LayoutGrid size={17} />
          </Button>
          {settings && (
            <div className="docking-settings">
              <div className="layout-menu-title">
                <strong>布局</strong>
                <span>拖动标签，自由组合面板</span>
              </div>
              <div className="docking-presets">
                {(
                  [
                    ["default", "预设"],
                    ["solution", "题解"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    className={selected === key ? "selected" : ""}
                    onClick={() => setSelected(key)}
                  >
                    <span className={`layout-thumbnail thumbnail-${key}`}>
                      <i />
                      <i />
                      <i />
                      {key !== "default" && <i />}
                    </span>
                    <span>
                      {label}
                      {selected === key && <Check size={13} />}
                    </span>
                  </button>
                ))}
              </div>
              <Button className="apply-layout" onClick={() => reset(selected)}>
                应用布局
              </Button>
              <div className="restore-panels">
                <span>显示面板</span>
                {keys.map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      open(key);
                      setSettings(false);
                    }}
                  >
                    {names[key]}
                    {model.getNodeById(key) && <Check size={12} />}
                  </button>
                ))}
              </div>
              <div className="custom-layout-row"><strong>自定义布局</strong><Button variant="ghost" onClick={() => { localStorage.setItem("av_custom_layout", JSON.stringify(desktopModel.toJson())); setCustom(true); }}>保存当前布局</Button>{custom && <Button variant="secondary" onClick={() => { try { const next = loadLayout(JSON.parse(localStorage.getItem("av_custom_layout")!)); setDesktopModel(next); localStorage.setItem(storageKey, JSON.stringify(next.toJson())); setSettings(false); } catch { localStorage.removeItem("av_custom_layout"); setCustom(false); } }}>应用</Button>}</div>
              <div className="layout-menu-footer">
                <Button variant="ghost" onClick={() => reset("default")}>
                  <RotateCcw size={13} /> 恢复默认
                </Button>
                <Button variant="secondary" onClick={focus}>
                  <Maximize2 size={13} /> 专注模式
                </Button>
              </div>
            </div>
          )}
        </div>
        {settingsControl}
        </div>
      </div>
      <div className="dock-surface">
        <Layout
          model={model}
          factory={(node) => (
            <div className={`dock-panel dock-panel-${node.getComponent()}`}>
              {panels[node.getComponent() as Panel]}
            </div>
          )}
          realtimeResize={realtimeResize}
          supportsPopout={false}
          i18nTranslator={(key) =>
            translations[key] ?? I18nLabelDefaults[key] ?? key
          }
          onRenderTab={(node, values) => {
            const Icon = icons[node.getComponent() as Panel];
            values.leading = <Icon size={14} className={`panel-icon panel-icon-${node.getComponent()}`} />;
          }}
          onModelChange={persist}
          onAction={(action) => {
            if (action.type === Actions.DELETE_TAB) {
              let count = 0;
              model.visitNodes((n) => {
                if (n instanceof TabNode) count++;
              });
              if (count <= 1) return undefined;
            }
            return action;
          }}
          onTabSetPlaceHolder={() => (
            <div className="dock-empty">
              <p>从布局菜单重新打开面板</p>
              <Button onClick={() => open("problem")}>打开题目描述</Button>
            </div>
          )}
        />
      </div>
    </main>
  );
}
