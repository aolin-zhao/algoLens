import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Badge, Button, Empty, Modal, Input, errorZh, labelZh } from '@algovision/ui';
import { SolutionDiagram } from './solution-diagram';
import { SolutionCode } from './solution-code';
import './content-browser.css';

export type ListProblem = { id: string; slug: string; title: string; difficulty: string; group: string; order: number };
type ProblemList = { id: string; slug: string; title: string; description: string; sourceUrl: string; count: number };
export type ProblemListDetail = ProblemList & { items: ListProblem[] };
export type Implementation = { id: string; languageId: string; mode: 'core' | 'main'; code: string };
type Solution = { id: string; title: string; explanation: string; timeComplexity: string; spaceComplexity: string; diagram: string | null; implementations: Implementation[] };
export async function contentRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/api${path}`);
  if (!response.ok) throw new Error(response.status === 404 ? '内容不存在或尚未发布' : '内容加载失败，请稍后重试');
  return response.json();
}

export function BuiltinLists() {
  const query = useQuery({ queryKey: ['problem-lists'], queryFn: () => contentRequest<{ items: ProblemList[] }>('/problem-lists') });
  return <section className="builtin-lists" aria-label="精选题单">
    <h2>精选题单</h2>
    {query.isPending ? <Empty text="正在加载题单…" /> : query.error ? <p role="alert">{errorZh(query.error)} <Button variant="ghost" onClick={() => void query.refetch()}>重试</Button></p> : !query.data?.items.length ? <Empty text="暂无已发布的题单" /> :
      <div className="builtin-list-cards">{query.data.items.map(list => <Link className="builtin-list-card" key={list.id} to={`/lists/${list.slug}`}>
        <Badge>精选题单</Badge><h3>{list.title}</h3><p>{list.description}</p><strong>已收录 {list.count} 题 →</strong>
      </Link>)}</div>}
  </section>;
}

export function ListDetail() {
  const { slug = '' } = useParams();
  const query = useQuery({ queryKey: ['problem-list', slug], queryFn: () => contentRequest<ProblemListDetail>(`/problem-lists/${encodeURIComponent(slug)}`) });
  const [search, setSearch] = useState('');
  if (query.isPending) return <Empty text="正在加载题单…" />;
  if (query.error || !query.data) return <main className="catalog"><Link to="/">返回题库</Link><p role="alert">{errorZh(query.error)}</p><Button onClick={() => void query.refetch()}>重试</Button></main>;
  const list = query.data;
  const filtered = list.items.filter(p => `${p.title} ${p.slug} ${p.group}`.toLowerCase().includes(search.toLowerCase()));
  const groups = [...new Set(filtered.map(p => p.group))];
  return <main className="catalog list-detail">
    <Link to="/">← 返回题库</Link>
    <h1>{list.title}</h1><p>{list.description}</p>
    <p>已收录 {list.items.length} 题 · <a href={list.sourceUrl} target="_blank" rel="noreferrer">查看来源题单</a></p>
    <Input aria-label="搜索题单" placeholder="搜索题目或分组" value={search} onChange={e => setSearch(e.target.value)} />
    {!filtered.length && <Empty text="没有找到匹配的题目" />}
    {groups.map(group => <section key={group}><h2>{group}</h2><div className="problem-list">
      {filtered.filter(p => p.group === group).map(p => <Link className="problem-row" key={p.id} to={`/problems/${p.id}?list=${encodeURIComponent(list.slug)}`}>
        <span className="row-index">{list.items.findIndex(item => item.id === p.id) + 1}</span>
        <span className="row-title">{p.title}<small>{p.slug}</small></span>
        <Badge tone={p.difficulty === 'easy' ? 'green' : p.difficulty === 'medium' ? 'amber' : 'red'}>{labelZh(p.difficulty)}</Badge><span>→</span>
      </Link>)}
    </div></section>)}
  </main>;
}

export function SolutionBrowser({ problemId, slug, input, templates, onLoad }: { problemId: string; slug: string; input: string; templates: { languageId: string; mode: 'core' | 'main' }[]; onLoad: (implementation: Implementation) => void }) {
  const query = useQuery({ queryKey: ['solutions', problemId], queryFn: () => contentRequest<{ items: Solution[] }>(`/problems/${problemId}/solutions`) });
  const [selected, setSelected] = useState('');
  const [implementationId, setImplementationId] = useState('');
  const [pending, setPending] = useState<Implementation | null>(null);
  if (query.isPending) return <Empty text="正在加载题解…" />;
  if (query.error) return <div className="solution-browser"><p role="alert">{errorZh(query.error)}</p><Button onClick={() => void query.refetch()}>重试</Button></div>;
  const items = query.data?.items ?? [];
  const solution = items.find(s => s.id === selected) ?? items[0];
  if (!solution) return <Empty text="这道题暂未发布题解" />;
  const languageOrder = ['java', 'cpp', 'c', 'python', 'go', 'javascript', 'typescript', 'rust'];
  const implementations = [...solution.implementations].sort((a, b) => languageOrder.indexOf(a.languageId) - languageOrder.indexOf(b.languageId));
  const implementation = implementations.find(i => i.id === implementationId)
    ?? implementations.find(i => templates.some(template => template.languageId === i.languageId && template.mode === i.mode))
    ?? implementations[0];
  return <div className="solution-browser">
    <div className="solution-switcher" role="group" aria-label="选择解法">{items.map(s => <Button key={s.id} variant={s.id === solution.id ? 'primary' : 'secondary'} aria-pressed={s.id === solution.id} onClick={() => { setSelected(s.id); setImplementationId(''); }}>{s.title}</Button>)}</div>
    <h2>{solution.title}</h2>
    <div className="solution-complexity"><Badge>时间 {solution.timeComplexity}</Badge><Badge>空间 {solution.spaceComplexity}</Badge></div>
    <div className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{solution.explanation}</ReactMarkdown></div>
    {implementation ? <>
      <SolutionCode implementations={implementations} selected={implementation} onSelect={setImplementationId} onLoad={() => setPending(implementation)} canLoad={templates.some(template => template.languageId === implementation.languageId && template.mode === implementation.mode)} />
    </> : <Empty text="暂无代码实现" />}
    {solution.diagram === 'two-sum-hash-map' && <section className="solution-diagram-section"><h3>哈希表图解</h3><SolutionDiagram slug={slug} input={input} /></section>}
    <Modal title="载入解法代码" open={!!pending} onOpenChange={open => { if (!open) setPending(null); }}>
      <p>将切换到对应语言和代码模式，并替换该编辑器草稿。原草稿会保留在当前浏览器的备份中，已保存到账号的代码不受影响。</p>
      <div className="modal-actions"><Button variant="secondary" onClick={() => setPending(null)}>取消</Button><Button onClick={() => { if (pending) onLoad(pending); setPending(null); }}>备份并载入</Button></div>
    </Modal>
  </div>;
}
