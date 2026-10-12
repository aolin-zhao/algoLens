import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useParams,
  useNavigate,
} from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import Editor from "@monaco-editor/react";
import { Drawer } from "@algovision/ui";
import { WorkspaceSettings, useEditorPreferences } from "./workspace-settings";
import { WorkspaceTimer } from "./workspace-timer";
import { create } from "zustand";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { IslandLayout } from "./workspace-layout";
import { SolutionDiagram } from "./solution-diagram";
import { editorLanguages, starterCode } from "./editor-languages";
import {
  ChevronRight,
  Code2,
  PanelLeft,
  ChevronLeft,
  Shuffle,
  Plus,
  X,
  WrapText,
  ListFilter,
  LogIn,
  Moon,
  Play,
  RotateCcw,
  Save,
  Sun,
  Zap,
} from "lucide-react";
import {
  ThemeProvider,
  Select,
  TextArea,
  Badge,
  Button,
  Empty,
  Field,
  Input,
  Modal,
  AmbientBackground,
  useTheme,
  labelZh,
  errorZh,
} from "@algovision/ui";
import "@algovision/ui/styles.css";
import "./web.css";
import "./responsive.css";
import "./workspace.css";
import "./leetcode-layout.css";

type Problem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  examples?: { input: string; output: string; explanation?: string }[];
  templates?: { languageId: string; code: string; mode: "core" | "main" }[];
};
type Language = { id: string; label: string; supportLevel: number };
type Execution = {
  id: string;
  status: string;
  error: string | null;
  result: {
    stdout: string;
    stderr: string;
    exitCode: number;
    frameCount: number;
    durationMs: number;
  } | null;
};
const API = import.meta.env.VITE_API_URL ?? "";
const useSession = create<{ token: string; setToken: (token: string) => void }>(
  (set) => ({
    token: localStorage.getItem("av_token") ?? "",
    setToken: (token) => {
      localStorage.setItem("av_token", token);
      set({ token });
    },
  }),
);
async function request<T>(
  path: string,
  token?: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API}/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  const body = await response.json().catch(() => {
    throw new Error("服务暂时不可用，请稍后重试");
  });
  if (!response.ok)
    throw new Error(
      errorZh(
        typeof body.error === "string"
          ? body.error
          : "请求参数无效，请检查后重试",
      ),
    );
  return body as T;
}
const queryClient = new QueryClient();

function Header({
  dark,
  toggleTheme,
}: {
  dark: boolean;
  toggleTheme: () => void;
}) {
  const { token, setToken } = useSession();
  const [loginOpen, setLoginOpen] = useState(false);
  useEffect(() => { const open = () => setLoginOpen(true); window.addEventListener("av:login", open); return () => window.removeEventListener("av:login", open); }, []);
  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand" aria-label="AlgoVision 首页">
          <Code2 size={24} className="brand-mark" />
          <span>AlgoVision</span>
        </Link>
        <nav className="site-nav" aria-label="主导航">
          <Link to="/">题库</Link>
          <span>算法可视化</span>
        </nav>
        <div className="top-actions">
          <Button
            variant="ghost"
            className="icon-button"
            title="切换主题"
            aria-label="切换主题"
            onClick={toggleTheme}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </Button>
          {token ? (
            <Button variant="secondary" onClick={() => setToken("")}>
              退出登录
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setLoginOpen(true)}>
              <LogIn size={16} /> 登录
            </Button>
          )}
        </div>
      </header>
      <AuthModal open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  );
}
function AuthModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const setToken = useSession((s) => s.setToken);
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await request<{ token: string }>(
        register ? "/auth/register" : "/auth/login",
        undefined,
        {
          method: "POST",
          body: JSON.stringify({ email, password, displayName: name }),
        },
      );
      setToken(result.token);
      onOpenChange(false);
    } catch (e) {
      setError(errorZh(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={register ? "注册账号" : "登录"}
      open={open}
      onOpenChange={onOpenChange}
    >
      <form onSubmit={submit}>
        {register && (
          <Field label="昵称">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
        )}
        <Field label="邮箱">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="密码">
          <Input
            type="password"
            minLength={10}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        {error && <p className="error">{error}</p>}
        <div className="modal-actions">
          <Button type="submit" disabled={busy}>
            {busy ? "处理中…" : register ? "注册账号" : "登录"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setRegister(!register)}
          >
            {register ? "已有账号，去登录" : "注册账号"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function ProblemList() {
  const [q, setQ] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["problems", q, difficulty],
    queryFn: () =>
      request<{ items: Problem[]; total: number }>(
        `/problems?q=${encodeURIComponent(q)}&difficulty=${difficulty}`,
      ),
  });
  return (
    <main className="catalog">
      <section className="catalog-intro">
        <div>
          <span className="catalog-kicker"><Code2 size={16} /> ALGORITHM WORKSPACE</span>
          <h1>从一道题，开始思考。</h1>
          <p>编写代码，验证思路，用图解看懂算法的每一步。</p>
          <a className="button button-secondary" href="#problem-catalog">
            浏览题库 <ChevronRight size={15} />
          </a>
        </div>
        <div className="catalog-feature spotlight">
          <Zap size={22} />
          <strong>让解题思路清晰可见</strong>
          <p>题目、代码、测试与图解，在同一个工作区里。</p>
          <div><span>在线编码</span><span>图解题解</span><span>自由布局</span></div>
        </div>
      </section>
      <div className="catalog-head" id="problem-catalog">
        <div>
          <h2><ListFilter size={19} /> 全部题目</h2>
          <p>共 {data?.total ?? 0} 道题目 · 从题目到解题思路</p>
        </div>
        <div className="catalog-filters">
          <Input
            aria-label="搜索题目"
            placeholder="搜索题目"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Select
            className="select"
            aria-label="难度"
            value={difficulty}
            onChange={(value) => setDifficulty(value)}
            options={[
              { value: "", label: "全部难度" },
              { value: "easy", label: "简单" },
              { value: "medium", label: "中等" },
              { value: "hard", label: "困难" },
            ]}
          />
        </div>
      </div>
      {error ? (
        <p className="error">{errorZh(error)}</p>
      ) : isLoading ? (
        <Empty text="正在加载题目…" />
      ) : !data?.items.length ? (
        <Empty text="没有找到匹配的题目" />
      ) : (
        <div className="problem-list">
          <div className="problem-list-heading" aria-hidden="true">
            <span>编号</span><span>题目</span><span>难度</span><span />
          </div>
          {data.items.map((problem, i) => (
            <Link
              className="problem-row"
              key={problem.id}
              style={{ animationDelay: `${Math.min(i, 8) * 80}ms` }}
              to={`/problems/${problem.id}`}
            >
              <span className="row-index">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="row-title">
                {problem.title}
                <small>{problem.slug}</small>
              </span>
              <Badge
                tone={
                  problem.difficulty === "easy"
                    ? "green"
                    : problem.difficulty === "medium"
                      ? "amber"
                      : "red"
                }
              >
                {labelZh(problem.difficulty)}
              </Badge>
              <ChevronRight size={17} />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
function problemMarkdown(description: string) {
  const text = description.replaceAll("\\n", "\n");
  if (!text.includes("数据范围：") || /^#{1,6} /m.test(text))
    return { body: text, details: "" };
  const paragraphs = text.split("\n\n");
  return {
    body: paragraphs
      .filter(
        (p) =>
          !p.startsWith("数据范围：") &&
          !p.startsWith("进阶：") &&
          !p.startsWith("支持两种 Python 模式：") &&
          !p.startsWith("题目来源："),
      )
      .join("\n\n")
      .replace(/\b(nums|target)\b/g, "`$1`"),
    details: paragraphs
      .filter(
        (p) =>
          p.startsWith("数据范围：") ||
          p.startsWith("进阶：") ||
          p.startsWith("题目来源："),
      )
      .map((p) =>
        p
          .replace("数据范围：", "### 提示\n\n")
          .replace("进阶：", "**进阶：** "),
      )
      .join("\n\n"),
  };
}
function formatExampleInput(input: string) {
  try {
    const value = JSON.parse(input);
    if (value && typeof value === "object" && !Array.isArray(value))
      return Object.entries(value)
        .map(([key, v]) => `${key} = ${JSON.stringify(v)}`)
        .join(", ");
  } catch {}
  return input;
}
function ProblemNavigator({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ["workspace-catalog"], queryFn: () => request<{items: Problem[]}>("/problems?size=100") });
  const items = data?.items ?? [];
  const index = items.findIndex(problem => problem.id === id);
  const go = (problem?: Problem) => { if (problem) { navigate(`/problems/${problem.id}`); setOpen(false); } };
  return <><div className="problem-navigation">
    <Button variant="ghost" aria-label="展开题库" onClick={() => setOpen(true)}><PanelLeft size={16}/><span>题库</span></Button>
    <Button variant="ghost" aria-label="上一题" title="上一题" disabled={index <= 0} onClick={() => go(items[index - 1])}><ChevronLeft size={17}/></Button>
    <Button variant="ghost" aria-label="下一题" title="下一题" disabled={index < 0 || index >= items.length - 1} onClick={() => go(items[index + 1])}><ChevronRight size={17}/></Button>
    <Button variant="ghost" aria-label="随机一题" title="随机一题" disabled={items.length < 2} onClick={() => { const other = items.filter(problem => problem.id !== id); go(other[Math.floor(Math.random() * other.length)]); }}><Shuffle size={16}/></Button>
  </div><Drawer title="题库" placement="left" open={open} onClose={() => setOpen(false)} width={380} className="problem-drawer">
    <Input aria-label="在题库中搜索" placeholder="搜索题目" value={search} onChange={event => setSearch(event.target.value)} />
    <div className="drawer-problems">{items.filter(problem => `${problem.title} ${problem.slug}`.toLowerCase().includes(search.toLowerCase())).map(problem => <button key={problem.id} className={problem.id === id ? "active" : ""} onClick={() => go(problem)}><span>{problem.title}</span><Badge tone={problem.difficulty === "easy" ? "green" : problem.difficulty === "medium" ? "amber" : "red"}>{labelZh(problem.difficulty)}</Badge></button>)}</div>
    <Link to="/" onClick={() => setOpen(false)} className="drawer-catalog-link">查看全部题目 <ChevronRight size={14}/></Link>
  </Drawer></>;
}
function ProblemNotes({ id }: { id: string }) {
  const [notes, setNotes] = useState(() => localStorage.getItem(`av_notes:${id}`) ?? "");
  return <div className="notes-document"><div><strong>我的笔记</strong><span>本地自动保存</span></div><TextArea aria-label="题目笔记" placeholder="记录你的解题思路…" value={notes} onChange={event => {setNotes(event.target.value);localStorage.setItem(`av_notes:${id}`,event.target.value);}} /></div>;
}
function TestInput({ input, onChange, onValidity }: { input: string; onChange: (input: string) => void; onValidity: (valid: boolean) => void }) {
  let values: Record<string, unknown> | null = null;
  try { const parsed = JSON.parse(input); if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) values = parsed; } catch {}
  const [raw, setRaw] = useState(false);
  const [fields, setFields] = useState<Record<string,string>>({});
  const [invalid, setInvalid] = useState<string[]>([]);
  useEffect(() => { setFields(Object.fromEntries(Object.entries(values ?? {}).map(([key,value]) => [key,JSON.stringify(value)]))); setInvalid([]); onValidity(true); }, [input, onValidity]);
  return <><button className="input-mode-toggle" onClick={() => {setRaw(!raw);setInvalid([]);onValidity(true);setFields(Object.fromEntries(Object.entries(values ?? {}).map(([key,value]) => [key,JSON.stringify(value)])));}}>{raw ? "参数模式" : "原始输入"}</button>
    {raw || !values ? <><label htmlFor="test-input">测试输入</label><TextArea id="test-input" value={input} onChange={event => onChange(event.target.value)} className="textarea" /></> : Object.entries(fields).map(([key,value]) => <div className="test-argument" key={key}><label htmlFor={`argument-${key}`}>{key} =</label><TextArea id={`argument-${key}`} aria-invalid={invalid.includes(key)} value={value} autoSize={{minRows:1,maxRows:6}} onChange={event => { const next = {...fields,[key]:event.target.value}; setFields(next); const result:Record<string,unknown> = {}; const errors:string[] = []; for (const [name,text] of Object.entries(next)) { try { result[name] = JSON.parse(text); } catch { errors.push(name); } } setInvalid(errors); onValidity(!errors.length); if (!errors.length) onChange(JSON.stringify(result)); }} />{invalid.includes(key) && <small role="alert">请输入有效的 JSON 值</small>}</div>)}
  </>;
}
function Workspace() {
  const { id = "" } = useParams();
  const token = useSession((s) => s.token);
  const [preferences, setPreferences] = useEditorPreferences();
  const [resetKey, setResetKey] = useState(0);
  const [cursor, setCursor] = useState({lineNumber:1,column:1});
  const [customCases, setCustomCases] = useState<{input:string;output:string}[]>([]);
  const [activeCase, setActiveCase] = useState(0);
  const [caseDrafts, setCaseDrafts] = useState<Record<number,string>>({});
  const [validInput, setValidInput] = useState(true);
  const editorRef = useRef<
    | Parameters<NonNullable<React.ComponentProps<typeof Editor>["onMount"]>>[0]
    | null
  >(null);
  const monacoRef = useRef<
    | Parameters<NonNullable<React.ComponentProps<typeof Editor>["onMount"]>>[1]
    | null
  >(null);
  function syncEditorTheme(monaco = monacoRef.current) {
    if (!monaco) return;
    const css = getComputedStyle(document.body);
    const token = (name: string) => css.getPropertyValue(name).trim();
    monaco.editor.defineTheme("algovision", {
      base: document.body.classList.contains("dark") ? "vs-dark" : "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": token("--editor-background"),
        "editor.foreground": token("--editor-foreground"),
        "editorLineNumber.foreground": token("--editor-line-number"),
        "editor.lineHighlightBackground": token("--editor-line-highlight"),
        "editor.selectionBackground": token("--editor-selection"),
      },
    });
    monaco.editor.setTheme("algovision");
  }
  useEffect(() => {
    const observer = new MutationObserver(() => syncEditorTheme());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "style"],
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    return () => observer.disconnect();
  }, []);
  const { data: problem, error } = useQuery({
    queryKey: ["problem", id],
    queryFn: () => request<Problem>(`/problems/${id}`),
  });
  const { data: languages } = useQuery({
    queryKey: ["languages"],
    queryFn: () => request<Language[]>("/languages"),
  });
  const [language, setLanguage] = useState("python");
  const [mode, setMode] = useState<"core" | "main">("core");
  const drafts = useRef<Record<string, string>>({});
  const draftKey = `${id}:${language}:${mode}`;
  const [code, setCode] = useState("");
  const [input, setInput] = useState("");
  const [jobId, setJobId] = useState("");
  const [runSnapshot, setRunSnapshot] = useState({input:"",output:""});

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const template = useMemo(
    () =>
      problem?.templates
        ?.find((t) => t.languageId === language && t.mode === mode)
        ?.code.replaceAll("\\n", "\n") ??
      starterCode(language, mode, problem?.slug),
    [problem, language, mode],
  );
  useEffect(() => {
    setCode(
      drafts.current[draftKey] ??
        localStorage.getItem(`av_draft:${draftKey}`) ??
        template,
    );
    setJobId("");
  }, [template, draftKey]);
  useEffect(() => {
    setInput(problem?.examples?.[0]?.input ?? "");
  }, [problem]);
  useEffect(() => {
    if (
      problem?.templates?.length &&
      !problem.templates.some(
        (t) => t.languageId === language && t.mode === mode,
      )
    ) {
      const available = problem.templates.find(
        (t) => t.languageId === language,
      );
      if (available) setMode(available.mode);
    }
  }, [problem, language, mode]);
  const { data: job } = useQuery({
    queryKey: ["execution", jobId],
    queryFn: () => request<Execution>(`/executions/${jobId}`, token),
    enabled: !!jobId && !!token,
    refetchInterval: (query) =>
      ["queued", "running"].includes(query.state.data?.status ?? "")
        ? 1500
        : false,
  });
  async function run() {
    if (!problem) return;
    if (!token) { window.dispatchEvent(new Event("av:login")); return; }
    setRunSnapshot({input,output:problem.examples?.find(example => example.input === input)?.output ?? ""});
    setBusy(true);
    setMessage("");
    setJobId("");
    try {
      const result = await request<{ id: string }>("/executions", token, {
        method: "POST",
        body: JSON.stringify({
          problemId: problem.id,
          languageId: language,
          mode,
          code,
          input,
        }),
      });
      setJobId(result.id);
    } catch (e) {
      setMessage(errorZh(e));
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!problem) return;
    try {
      await request(`/saved-codes/${problem.id}/${language}`, token, {
        method: "PUT",
        body: JSON.stringify({ code, mode }),
      });
      setMessage("代码已保存");
    } catch (e) {
      setMessage(errorZh(e));
    }
  }
  const runnable =
    language === "python" &&
    !!languages?.some((l) => l.id === language && l.supportLevel >= 2) &&
    (mode === "main" ||
      !!problem?.templates?.some(
        (t) => t.languageId === language && t.mode === mode,
      ));
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (preferences.runShortcut && (event.metaKey || event.ctrlKey) && event.key === "'") {
        event.preventDefault(); if (runnable && validInput && !busy && !["queued","running"].includes(job?.status ?? "")) void run();
      }
    };
    window.addEventListener("keydown",handle); return () => window.removeEventListener("keydown",handle);
  }, [preferences.runShortcut, runnable, validInput, busy, job?.status, code, input, language, mode, token, problem]);
  useEffect(() => { setCustomCases([]); setActiveCase(0); setCaseDrafts({}); }, [id]);
  if (error) return <p className="error">{errorZh(error)}</p>;
  if (!problem) return <Empty text="正在加载工作区…" />;
  const runControl = <Button variant="ghost" className="workspace-run-button" title={!runnable ? "此语言暂未接入运行" : !token ? "登录后运行" : "运行（⌘ / Ctrl + ’）"} aria-label="运行" onClick={run} disabled={busy || !runnable || !validInput || ["queued", "running"].includes(job?.status ?? "")}><Play size={15} fill="currentColor"/>{busy || ["queued", "running"].includes(job?.status ?? "") ? "运行中…" : null}</Button>;
  const cases = [...(problem.examples ?? []), ...customCases];
  const updateCode = (next: string) => {
    drafts.current[draftKey] = next;
    localStorage.setItem(`av_draft:${draftKey}`, next);
    setCode(next);
  };
  return (
    <IslandLayout
      resultKey={jobId || message}
      runControl={runControl}
      navigationControl={<ProblemNavigator id={id}/>}
      settingsControl={<WorkspaceSettings preferences={preferences} onChange={setPreferences} onReset={() => setResetKey(value => value + 1)}/>}
      timerControl={<WorkspaceTimer problemId={id} autoReset={preferences.timerAutoReset} alert={preferences.timerAlert}/>}
      resetKey={resetKey}
      realtimeResize={preferences.realtimeResize}
      toolbarRun={preferences.runPosition === "toolbar"}
      panels={{
        notes: <ProblemNotes key={id} id={id}/>,
        problem: (
          <div className="problem-document">
            <div className="problem-title">
              <h1>{problem.title}</h1>
            </div>
            <div className="problem-tags">
              <Badge
                tone={
                  problem.difficulty === "easy"
                    ? "green"
                    : problem.difficulty === "medium"
                      ? "amber"
                      : "red"
                }
              >
                {labelZh(problem.difficulty)}
              </Badge>
              {problem.slug === "two-sum" && (
                <>
                  <Badge>数组</Badge>
                  <Badge>哈希表</Badge>
                </>
              )}
            </div>
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {problemMarkdown(problem.description).body}
              </ReactMarkdown>
            </div>
            {problem.examples?.map((example, index) => (
              <section className="problem-example" key={index}>
                <h3>示例 {index + 1}：</h3>
                <div className="example-body">
                  <p>
                    <strong>输入：</strong>
                    <code>{formatExampleInput(example.input)}</code>
                  </p>
                  <p>
                    <strong>输出：</strong>
                    <code>{example.output}</code>
                  </p>
                  {example.explanation && (
                    <p>
                      <strong>解释：</strong>
                      {example.explanation}
                    </p>
                  )}
                </div>
                <Button variant="ghost" onClick={() => {setInput(example.input);setActiveCase(index);}}>
                  用此示例测试
                </Button>
              </section>
            ))}
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {problemMarkdown(problem.description).details}
              </ReactMarkdown>
            </div>
          </div>
        ),
        editor: (
          <>
            <div className="editor-controls">
              <Select
                className="select language-select"
                size="small" variant="borderless"
                aria-label="编程语言"
                value={language}
                onChange={setLanguage}
                options={editorLanguages.map((l) => ({
                  value: l.id,
                  label: l.label,
                }))}
              />
              <Select
                className="select mode-select"
                size="small" variant="borderless"
                aria-label="代码模式"
                value={mode}
                onChange={(v) => setMode(v as "core" | "main")}
                options={[
                  { value: "core", label: "核心代码" },
                  { value: "main", label: "完整程序" },
                ]}
              />
              <span className="editor-autosave" />
              <Button variant="ghost" aria-label="自动换行" title="自动换行" onClick={() => setPreferences({...preferences,wordWrap:!preferences.wordWrap})}><WrapText size={14}/></Button>
              <Button
                variant="ghost"
                aria-label="重置当前代码"
                title="重置当前代码"
                onClick={() => {
                  if (
                    window.confirm("恢复当前语言的初始代码？当前草稿将被覆盖。")
                  )
                    updateCode(template);
                }}
              >
                <RotateCcw size={14} />
              </Button>
              <Button
                variant="ghost"
                onClick={save}
                disabled={!token || !languages?.some((l) => l.id === language)}
                aria-label="保存代码到账号"
                title="保存代码到账号"
              >
                <Save size={14} />
              </Button>
            </div>
            <div className="monaco-wrap">
              <Editor
                path={`${id}/${mode}/solution.${editorLanguages.find((l) => l.id === language)?.extension}`}
                language={language}
                theme="algovision"
                beforeMount={(monaco) => syncEditorTheme(monaco)}
                value={code}
                onMount={(editor, monaco) => {
                  editorRef.current = editor;
                  editor.onDidChangeCursorPosition(event => setCursor(event.position));
                  monacoRef.current = monaco;
                  syncEditorTheme(monaco);
                }}
                onChange={(v) => updateCode(v ?? "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: preferences.fontSize,
                  fontLigatures: preferences.ligatures,
                  lineNumbers: preferences.relativeLines ? "relative" : "on",
                  quickSuggestions: preferences.autocomplete,
                  suggestOnTriggerCharacters: preferences.autocomplete,
                  lineNumbersMinChars: 3,
                  automaticLayout: true,
                  padding: { top: 16 },
                  fontFamily: preferences.font === "consolas" ? "Consolas, monospace" : preferences.font === "monospace" ? "monospace" : "ui-monospace, SFMono-Regular, Consolas, monospace",
                  scrollBeyondLastLine: false,
                  tabSize: preferences.tabSize,
                  insertSpaces: true,
                  detectIndentation: false,
                  wordWrap: preferences.wordWrap ? "on" : "off",
                  bracketPairColorization: { enabled: true },
                }}
              />
            </div>
            {preferences.runPosition === "editor" && <div className="editor-run-actions">{runControl}</div>}
            <footer className="editor-footer">
              <span title="代码已自动保存到当前浏览器">已存储</span>
              <span>行 {cursor.lineNumber}，列 {cursor.column}</span>
            </footer>
          </>
        ),
        solution: <SolutionDiagram slug={problem.slug} input={input} />,
        tests: (
          <div className="test-document">
            <div className="test-tabs">
              {cases.map((example, index) => <div className="test-case-tab" key={index}><button className={activeCase === index ? "active" : ""} onClick={() => {setActiveCase(index);setInput(caseDrafts[index] ?? example.input);}}>Case {index + 1}</button>{index >= (problem.examples?.length ?? 0) && <button className="remove-case" aria-label={`删除 Case ${index+1}`} onClick={() => {setCustomCases(customCases.filter((_,i) => i !== index - (problem.examples?.length ?? 0)));setCaseDrafts({});setActiveCase(0);setInput(problem.examples?.[0]?.input ?? "");}}><X size={11}/></button>}</div>)}
              <button aria-label="添加测试用例" title="添加测试用例" onClick={() => {setCustomCases([...customCases,{input,output:""}]);setActiveCase(cases.length);}}><Plus size={15}/></button>
            </div>
            <TestInput input={input} onValidity={setValidInput} onChange={value => {setInput(value); setCaseDrafts(prev => ({...prev,[activeCase]:value})); if (activeCase >= (problem.examples?.length ?? 0)) setCustomCases(prev => prev.map((item,index) => index === activeCase - (problem.examples?.length ?? 0) ? {...item,input:value} : item));}} />
            <p className="run-note">
              {!runnable
                ? "此语言支持编辑，暂未接入运行"
                : !token
                  ? "登录后可运行代码"
                  : mode === "core"
                    ? "输入 JSON 参数，系统调用题目函数。"
                    : "程序从标准输入读取 JSON，自行输出结果。"}
            </p>
          </div>
        ),
        result: (
          <div className="test-document">
            {message && (
              <p role="status" className="inline-note">
                {message}
              </p>
            )}
            <div className="test-result">
              <strong>
                运行结果{" "}
                {job && (
                  <Badge
                    tone={
                      job.status === "completed"
                        ? "green"
                        : job.status === "failed"
                          ? "red"
                          : "neutral"
                    }
                  >
                    {labelZh(job.status)}
                  </Badge>
                )}
              </strong>
              <pre>
                {job?.result?.stdout ||
                  job?.result?.stderr ||
                  job?.error ||
                  (["queued", "running"].includes(job?.status ?? "") ? "正在执行，请稍候…" : "运行代码后，结果会显示在这里。")}
              </pre>
              {job?.result && <div className="result-details"><label>输入</label><pre>{runSnapshot.input}</pre>{runSnapshot.output && <><label>预期结果</label><pre>{runSnapshot.output}</pre></>}</div>}
              {job?.result && (
                <small>
                  耗时 {job.result.durationMs} ms · 退出码 {job.result.exitCode}
                </small>
              )}
            </div>
          </div>
        ),
      }}
    />
  );
}

function App() {
  const { dark, toggleTheme } = useTheme("av_theme");
  return (
    <BrowserRouter>
      <div className="app-shell">
        <AmbientBackground />
        <Header dark={dark} toggleTheme={toggleTheme} />
        <Routes>
          <Route path="/" element={<ProblemList />} />
          <Route path="/problems/:id" element={<Workspace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
