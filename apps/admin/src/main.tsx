import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, NavLink, Route, Routes } from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import {
  Activity,
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Settings,
  Trash2,
  Users,
  Pencil,
  Moon,
  Sun,
} from "lucide-react";
import { ThemeProvider, Select, TextArea, Badge, Button, Empty, Field, Input, Modal, AmbientBackground, useTheme, labelZh, errorZh } from "@algovision/ui";
import "@algovision/ui/styles.css";
import "./admin.css";
import "./responsive.css";
import { Resources } from "./Resources";

type Problem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  status: "draft" | "published";
};
type ProblemPage = {
  items: Problem[];
  total: number;
  page: number;
  size: number;
};
const API = import.meta.env.VITE_API_URL ?? "";
const client = new QueryClient();
async function api<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API}/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  const body = await response.json().catch(() => {
    throw new Error("服务暂时不可用，请稍后重试");
  });
  if (!response.ok)
    throw new Error(
      errorZh(typeof body.error === "string" ? body.error : "请求参数无效，请检查后重试"),
    );
  return body as T;
}
function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { token } = await api<{ token: string }>("/auth/login", "", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const me = await api<{ isAdmin: boolean }>("/auth/me", token);
      if (!me.isAdmin) throw new Error("需要管理员权限");
      onLogin(token);
    } catch (e) {
      setError(errorZh(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-wrap">
      <form className="login-form" onSubmit={submit}>
        <h1>管理员登录</h1>
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        {error && <p className="error">{error}</p>}
        <div className="form-footer">
          <Button type="submit" disabled={busy}>{busy ? "正在登录…" : "登录"}</Button>
        </div>
      </form>
    </main>
  );
}
function Dashboard({ token }: { token: string }) {
  const { data, error, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () =>
      api<{
        problems: number;
        languages: number;
        executions: number;
        failed: number;
      }>("/admin/dashboard", token),
  });
  return (
    <>
      <div className="page-head">
        <div>
          <h1>概览</h1>
          <p>平台运行概况</p>
        </div>
      </div>
      {error ? (
        <p className="error">{errorZh(error)}</p>
      ) : isLoading ? (
        <Empty text="正在加载概览…" />
      ) : (
        <div className="stat-grid">
          {Object.entries(data ?? {}).map(([label, value]) => (
            <div className="stat" key={label}>
              <strong>{value}</strong>
              <span>{labelZh(label)}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
function ProblemForm({
  initial,
  onSave,
  busy,
}: {
  initial?: Problem;
  onSave: (value: Omit<Problem, "id">) => void;
  busy: boolean;
}) {
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [difficulty, setDifficulty] = useState<Problem["difficulty"]>(
    initial?.difficulty ?? "easy",
  );
  const [status, setStatus] = useState<Problem["status"]>(
    initial?.status ?? "draft",
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ slug, title, description, difficulty, status });
      }}
    >
      <Field label="标题">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={2}
        />
      </Field>
      <Field label="题目标识">
        <Input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          pattern="[a-z0-9-]{2,100}"
        />
      </Field>
      <Field label="题目描述">
        <TextArea
          className="textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </Field>
      <Field label="难度">
        <Select
          className="select"
          value={difficulty}
          onChange={(value) => setDifficulty(value)} options={[{"value": "easy", "label": "简单"}, {"value": "medium", "label": "中等"}, {"value": "hard", "label": "困难"}]} />
      </Field>
      <Field label="发布状态">
        <Select
          className="select"
          value={status}
          onChange={(value) => setStatus(value)} options={[{"value": "draft", "label": "草稿"}, {"value": "published", "label": "已发布"}]} />
      </Field>
      <div className="form-footer">
        <Button type="submit" disabled={busy}>{busy ? "正在保存…" : "保存题目"}</Button>
      </div>
    </form>
  );
}
function Problems({ token }: { token: string }) {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [editing, setEditing] = useState<Problem | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Problem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-problems", page, q, difficulty],
    queryFn: () =>
      api<ProblemPage>(
        `/admin/problems?page=${page}&q=${encodeURIComponent(q)}&difficulty=${difficulty}`,
        token,
      ),
  });
  async function save(value: Omit<Problem, "id">) {
    setBusy(true);
    setError("");
    try {
      await api(`/admin/problems${editing ? `/${editing.id}` : ""}`, token, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(value),
      });
      setOpen(false);
      await refetch();
    } catch (e) {
      setError(errorZh(e));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setError("");
    try {
      await api(`/admin/problems/${deleting.id}`, token, { method: "DELETE" });
      setDeleting(null);
      await refetch();
    } catch (e) {
      setError(errorZh(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-head">
        <div>
          <h1>题目管理</h1>
          <p>共 {data?.total ?? 0} 条记录</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus size={16} /> 新建题目
        </Button>
      </div>
      <div className="admin-controls">
        <Input
          placeholder="搜索标题或题目标识"
          aria-label="搜索题目"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <Select
          className="select"
          aria-label="难度"
          value={difficulty}
          onChange={(value) => { setDifficulty(value); setPage(1); }} options={[{"value": "", "label": "全部难度"}, {"value": "easy", "label": "简单"}, {"value": "medium", "label": "中等"}, {"value": "hard", "label": "困难"}]} />
      </div>
      {error && <p className="error">{error}</p>}
      {isLoading ? (
        <Empty text="正在加载题目…" />
      ) : !data?.items.length ? (
        <Empty text="没有找到匹配的题目" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>标题</th>
                <th>题目标识</th>
                <th>难度</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.title}</strong>
                  </td>
                  <td>{row.slug}</td>
                  <td>
                    <Badge
                      tone={
                        row.difficulty === "easy"
                          ? "green"
                          : row.difficulty === "medium"
                            ? "amber"
                            : "red"
                      }
                    >
                      {labelZh(row.difficulty)}
                    </Badge>
                  </td>
                  <td>
                    <Badge
                      tone={row.status === "published" ? "green" : "neutral"}
                    >
                      {labelZh(row.status)}
                    </Badge>
                  </td>
                  <td>
                    <div className="actions">
                      <Button variant="ghost"
                        className="icon-button"
                        title="编辑"
                        aria-label="编辑"
                        onClick={() => {
                          setEditing(row);
                          setOpen(true);
                        }}
                      >
                        <Pencil size={15} />
                      </Button>
                      <Button variant="ghost"
                        className="icon-button"
                        title="删除"
                        aria-label="删除"
                        onClick={() => setDeleting(row)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="pagination">
        <Button
          variant="secondary"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          上一页
        </Button>
        <span>第 {page} 页</span>
        <Button
          variant="secondary"
          disabled={!data || page * data.size >= data.total}
          onClick={() => setPage(page + 1)}
        >
          下一页
        </Button>
      </div>
      <Modal
        title={editing ? "编辑题目" : "创建题目"}
        open={open}
        onOpenChange={setOpen}
      >
        <ProblemForm
          key={editing?.id ?? "new"}
          initial={editing ?? undefined}
          onSave={save}
          busy={busy}
        />
      </Modal>
      <Modal
        title="删除题目"
        open={!!deleting}
        onOpenChange={(value) => {
          if (!value) setDeleting(null);
        }}
      >
        <p>
          确定删除题目 <strong>{deleting?.title}</strong>？
        </p>
        <div className="form-footer">
          <Button variant="danger" onClick={remove} disabled={busy}>
            删除
          </Button>
          <Button variant="secondary" onClick={() => setDeleting(null)}>
            取消
          </Button>
        </div>
      </Modal>
    </>
  );
}
function Records({
  token,
  kind,
}: {
  token: string;
  kind: "users" | "executions" | "audit-logs" | "objects";
}) {
  const { data, error, isLoading } = useQuery({
    queryKey: [kind],
    queryFn: () => api<unknown>(`/admin/${kind}`, token),
  });
  const rows = Array.isArray(data)
    ? data
    : kind === "objects"
      ? ((data as { objects?: object[] })?.objects ?? [])
      : [];
  return (
    <>
      <div className="page-head">
        <h1>{labelZh(kind)}</h1>
      </div>
      {error ? (
        <p className="error">{errorZh(error)}</p>
      ) : isLoading ? (
        <Empty text="正在加载…" />
      ) : !rows.length ? (
        <Empty text="暂无记录" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {Object.keys(rows[0])
                  .slice(0, 7)
                  .map((key) => (
                    <th key={key}>{labelZh(key)}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row: Record<string, unknown>, i: number) => (
                <tr key={i}>
                  {Object.values(row)
                    .slice(0, 7)
                    .map((value, j) => (
                      <td key={j}>
                        {typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value ?? "")}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
function App() {
  const [token, setToken] = useState(
    localStorage.getItem("av_admin_token") ?? "",
  );
  const { dark, toggleTheme } = useTheme("av_admin_theme");
  function login(value: string) {
    localStorage.setItem("av_admin_token", value);
    setToken(value);
  }
  function logout() {
    localStorage.removeItem("av_admin_token");
    setToken("");
  }
  return (
    <BrowserRouter>
      <div className="app-shell">
        <AmbientBackground />
        <header className="topbar">
          <Link to="/" className="brand">
            AlgoVision <span style={{ fontWeight: 450 }}>管理后台</span>
          </Link>
          <div className="top-actions">
            <Button variant="ghost"
              className="icon-button"
              title="切换主题"
              aria-label="切换主题"
              onClick={toggleTheme}
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </Button>
            {token && (
              <Button variant="ghost" onClick={logout}>
                <LogOut size={16} /> 退出登录
              </Button>
            )}
          </div>
        </header>
        {!token ? (
          <Login onLogin={login} />
        ) : (
          <div className="admin-layout">
            <nav className="sidebar">
              <NavLink to="/" end>
                <LayoutDashboard size={16} /> 概览
              </NavLink>
              <NavLink to="/problems">
                <BookOpen size={16} /> 题目管理
              </NavLink>
              {[
                ["tags", "标签"],
                ["languages", "编程语言"],
                ["test-cases", "测试用例"],
                ["language-templates", "代码模板"],
                ["problem-examples", "示例"],
                ["visualization-templates", "可视化模板"],
                ["system-settings", "系统设置"],
                ["roles", "角色"],
                ["permissions", "权限"],
              ].map(([kind, label]) => (
                <NavLink key={kind} to={`/resources/${kind}`}>
                  <Settings size={16} /> {label}
                </NavLink>
              ))}
              <NavLink to="/users">
                <Users size={16} /> 用户
              </NavLink>
              <NavLink to="/executions">
                <Activity size={16} /> 执行记录
              </NavLink>
              <NavLink to="/audit-logs">
                <ClipboardList size={16} /> 审计日志
              </NavLink>
              <NavLink to="/objects">
                <Settings size={16} /> 存储对象
              </NavLink>
            </nav>
            <main className="admin-main">
              <Routes>
                <Route path="/" element={<Dashboard token={token} />} />
                <Route path="/problems" element={<Problems token={token} />} />
                <Route path="/resources/:kind" element={<Resources token={token} api={api} />} />
                <Route
                  path="/users"
                  element={<Records token={token} kind="users" />}
                />
                <Route
                  path="/executions"
                  element={<Records token={token} kind="executions" />}
                />
                <Route
                  path="/audit-logs"
                  element={<Records token={token} kind="audit-logs" />}
                />
                <Route
                  path="/objects"
                  element={<Records token={token} kind="objects" />}
                />
              </Routes>
            </main>
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <ThemeProvider><App /></ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
