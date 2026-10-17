import { Pagination, usePageBounds } from './Pagination';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Select, TextArea, Button, Empty, Field, Input, Modal, errorZh } from '@algovision/ui';

type FieldSpec = { key: string; label: string; kind?: 'text' | 'textarea' | 'number' | 'boolean'; required?: boolean };
type ResourceSpec = { title: string; fields: FieldSpec[] };
const specs: Record<string, ResourceSpec> = {
  roles: { title: '角色', fields: [{ key: 'name', label: '名称', required: true }] },
  permissions: { title: '权限', fields: [{ key: 'code', label: '代码', required: true }] },
  tags: { title: '标签', fields: [{ key: 'name', label: '名称', required: true }] },
  languages: { title: '编程语言', fields: [{ key: 'label', label: '显示名称', required: true }, { key: 'support_level', label: '支持级别', kind: 'number', required: true }, { key: 'enabled', label: '启用', kind: 'boolean', required: true }] },
  'test-cases': { title: '测试用例', fields: [{ key: 'problem_id', label: '题目标识', required: true }, { key: 'input', label: '输入', kind: 'textarea' }, { key: 'expected_output', label: '预期输出', kind: 'textarea' }, { key: 'hidden', label: '隐藏', kind: 'boolean' }] },
  'language-templates': { title: '代码模板', fields: [{ key: 'problem_id', label: '题目标识', required: true }, { key: 'language_id', label: '语言标识', required: true }, { key: 'mode', label: '代码模式（core / main）', required: true }, { key: 'invocation', label: '核心代码调用配置（JSON）', kind: 'textarea' }, { key: 'code', label: '代码', kind: 'textarea' }] },
  'problem-examples': { title: '示例', fields: [{ key: 'problem_id', label: '题目标识', required: true }, { key: 'input', label: '输入', kind: 'textarea' }, { key: 'output', label: '输出', kind: 'textarea' }, { key: 'explanation', label: '说明', kind: 'textarea' }, { key: 'sort_order', label: '排序', kind: 'number' }] },
  'visualization-templates': { title: '可视化模板', fields: [{ key: 'name', label: '名称', required: true }, { key: 'kind', label: '类型', required: true }, { key: 'config', label: 'JSON 配置', kind: 'textarea' }] },
  'system-settings': { title: '系统设置', fields: [{ key: 'key', label: '键', required: true }, { key: 'value', label: '值', kind: 'textarea' }] },
};
type Row = Record<string, string | number | null>;
type Page = { items: Row[]; total: number; page: number; size: number };

export function Resources({ token, api }: { token: string; api: <T>(path: string, token: string, init?: RequestInit) => Promise<T> }) {
  const { kind = '' } = useParams();
  return <ResourceList key={kind} kind={kind} token={token} api={api} />;
}

function ResourceList({ kind, token, api }: { kind: string; token: string; api: <T>(path: string, token: string, init?: RequestInit) => Promise<T> }) {
  const spec = specs[kind];
  const client = useQueryClient();
  const [size, setSize] = useState(20);
  const [page, setPage] = useState(1); const [q, setQ] = useState(''); const [editing, setEditing] = useState<Row | null>(null); const [open, setOpen] = useState(false); const [deleting, setDeleting] = useState<Row | null>(null); const [form, setForm] = useState<Row>({}); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const { data, isLoading, isFetching, error: queryError, refetch } = useQuery({ queryKey: ['resource', kind, page, size, q], queryFn: () => api<Page>(`/admin/resources/${kind}?page=${page}&size=${size}&q=${encodeURIComponent(q)}`, token), enabled: !!spec });
  usePageBounds(page, size, data?.total, setPage);
  if (!spec) return <Empty text="资源不可用" />;
  function begin(row?: Row) { setEditing(row ?? null); setForm(row ?? {}); setOpen(true); setError(''); }
  function valueFor(field: FieldSpec) { const value = form[field.key] ?? (field.key === 'mode' ? 'main' : null); return value == null ? field.kind === 'number' || field.kind === 'boolean' ? '0' : '' : String(value); }
  function update(key: string, value: string) { setForm(current => ({ ...current, [key]: value })); }
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    const body: Row = {};
    for (const field of spec.fields) {
      if (editing && field.key === 'key') continue;
      const value = valueFor(field);
      body[field.key] = field.kind === 'number' || field.kind === 'boolean' ? Number(value) : ['explanation', 'invocation'].includes(field.key) && !value ? null : value;
    }
    const id = editing ? String(editing.key ?? editing.id) : '';
    try { await api(`/admin/resources/${kind}${editing ? `/${encodeURIComponent(id)}` : ''}`, token, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(body) }); setOpen(false); await client.invalidateQueries({ queryKey: ['dashboard'] }); await refetch(); }
    catch (e) { setError(errorZh(e)); } finally { setBusy(false); }
  }
  async function remove() { if (!deleting) return; const id = String(deleting.key ?? deleting.id); setBusy(true); setError(''); try { await api(`/admin/resources/${kind}/${encodeURIComponent(id)}`, token, { method: 'DELETE' }); setDeleting(null); await client.invalidateQueries({ queryKey: ['dashboard'] }); await refetch(); } catch (e) { setError(errorZh(e)); } finally { setBusy(false); } }
  return <><div className="page-head"><div><h1>{spec.title}</h1><p>共 {data?.total ?? 0} 条记录</p></div><Button onClick={() => begin()}><Plus size={16} /> 新建</Button></div><div className="admin-controls"><Input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder={`搜索${spec.title}`} aria-label={`搜索${spec.title}`} /></div>{error && <p className="error">{error}</p>}{queryError ? <p className="error" role="alert">{errorZh(queryError)} <Button variant="secondary" onClick={() => refetch()}>重试</Button></p> : isLoading ? <Empty text="正在加载记录…" /> : !data?.items.length ? <Empty text="暂无记录" /> : <div className="table-wrap"><table className="table"><thead><tr>{[kind === 'system-settings' ? 'key' : 'id', ...spec.fields.filter(f => f.key !== 'key').slice(0, 3).map(f => f.key)].map(key => <th key={key}>{key === 'id' ? '标识' : spec.fields.find(field => field.key === key)?.label ?? key}</th>)}<th>操作</th></tr></thead><tbody>{data.items.map(row => <tr key={String(row.id ?? row.key)}><td><code>{String(row.id ?? row.key)}</code></td>{spec.fields.filter(f => f.key !== 'key').slice(0, 3).map(f => <td key={f.key}>{String(row[f.key] ?? '').slice(0, 100)}</td>)}<td><div className="actions"><Button variant="ghost" className="icon-button" title="编辑" aria-label="编辑" onClick={() => begin(row)}><Pencil size={15} /></Button><Button variant="ghost" className="icon-button" title="删除" aria-label="删除" onClick={() => { setError(''); setDeleting(row); }}><Trash2 size={15} /></Button></div></td></tr>)}</tbody></table></div>}<Pagination page={page} size={size} total={data?.total} busy={isFetching || !!queryError} onPage={setPage} onSize={value => { setSize(value); setPage(1); }} /><Modal title={`${editing ? '编辑' : '新建'} ${spec.title.toLowerCase()}`} open={open} onOpenChange={value => { if (!busy) setOpen(value); }}><form onSubmit={save}>{spec.fields.map(field => <Field label={field.label} key={field.key}>{field.kind === 'textarea' ? <TextArea className="textarea" value={valueFor(field)} onChange={e => update(field.key, e.target.value)} required={field.required} /> : field.kind === 'boolean' ? <Select className="select" value={valueFor(field)} onChange={value => update(field.key, value)} options={[{"value": "1", "label": "是"}, {"value": "0", "label": "否"}]} /> : <Input type={field.kind === 'number' ? 'number' : 'text'} value={valueFor(field)} onChange={e => update(field.key, e.target.value)} required={field.required} disabled={!!editing && field.key === 'key'} />}</Field>)}{error && <p className="error">{error}</p>}<div className="form-footer"><Button type="submit" disabled={busy}>{busy ? '正在保存…' : '保存'}</Button></div></form></Modal><Modal title={`删除${spec.title}`} open={!!deleting} onOpenChange={value => { if (!busy && !value) setDeleting(null); }}><p>确定删除这条记录？</p>{error && <p className="error" role="alert">{error}</p>}<div className="form-footer"><Button variant="danger" onClick={remove} disabled={busy}>删除</Button><Button variant="secondary" onClick={() => setDeleting(null)}>取消</Button></div></Modal></>;
}
