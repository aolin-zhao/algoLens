import { z } from 'zod';
import type { Bindings } from './types';
import { audit } from './repository';
import { executionLanguage } from './execution-languages';

const specs = {
  roles: { table: 'roles', fields: { name: z.string().regex(/^[a-z][a-z0-9_-]{1,50}$/) }, search: 'name' },
  permissions: { table: 'permissions', fields: { code: z.string().regex(/^[a-z][a-z0-9:._-]{1,100}$/) }, search: 'code' },
  tags: { table: 'tags', fields: { name: z.string().min(1).max(80) }, search: 'name' },
  languages: { table: 'languages', fields: { label: z.string().min(1).max(80), support_level: z.number().int().min(0).max(3), enabled: z.number().int().min(0).max(1) }, search: 'label' },
  'test-cases': { table: 'test_cases', fields: { problem_id: z.string().uuid(), input: z.string().max(20000), expected_output: z.string().max(20000), hidden: z.number().int().min(0).max(1) }, search: 'input' },
  'language-templates': { table: 'language_templates', fields: { problem_id: z.string().uuid(), language_id: z.string().min(1), mode: z.enum(['core', 'main']).default('main'), invocation: z.string().max(2000).nullable().default(null), code: z.string().max(50000) }, search: 'language_id' },
  'problem-examples': { table: 'problem_examples', fields: { problem_id: z.string().uuid(), input: z.string().max(20000), output: z.string().max(20000), explanation: z.string().max(10000).nullable(), sort_order: z.number().int().min(0) }, search: 'input' },
  'visualization-templates': { table: 'visualization_templates', fields: { name: z.string().min(1).max(100), kind: z.string().min(1).max(50), config: z.string().max(20000) }, search: 'name' },
  'system-settings': { table: 'system_settings', fields: { value: z.string().max(20000) }, search: 'key', key: true },
} as const;

export type ResourceName = keyof typeof specs;
export const resourceNames = Object.keys(specs) as ResourceName[];

function specFor(name: string) { return Object.hasOwn(specs, name) ? specs[name as ResourceName] : null; }
function safeId(id: string) { return /^[a-zA-Z0-9_.-]{1,100}$/.test(id); }
function inputFor(spec: NonNullable<ReturnType<typeof specFor>>) { return z.object(spec.fields as Record<string, z.ZodTypeAny>).strict(); }

export async function listResource(env: Bindings, name: string, query: { page?: string; size?: string; q?: string }) {
  const spec = specFor(name);
  if (!spec) return null;
  const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
  const size = Math.min(100, Math.max(1, parseInt(query.size ?? '20', 10) || 20));
  const term = (query.q ?? '').trim().slice(0, 100);
  const filter = term ? ` AND ${spec.search} LIKE ?` : '';
  const binds = term ? [`%${term}%`] : [];
  const items = await env.DB.prepare(`SELECT * FROM ${spec.table} WHERE deleted_at IS NULL${filter} ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(...binds, size, (page - 1) * size).all();
  const total = await env.DB.prepare(`SELECT count(*) AS count FROM ${spec.table} WHERE deleted_at IS NULL${filter}`).bind(...binds).first<{ count: number }>();
  return { items: items.results, total: total?.count ?? 0, page, size };
}

export async function createResource(env: Bindings, actorId: string, name: string, raw: unknown) {
  const spec = specFor(name);
  if (!spec) return { status: 404, body: { error: 'Resource not found' } };
  const parsed = ('key' in spec ? inputFor(spec).extend({ key: z.string().regex(/^[a-z0-9_.-]{2,100}$/) }) : inputFor(spec)).safeParse(raw);
  if (!parsed.success) return { status: 400, body: { error: parsed.error.flatten() } };
  if (name === 'languages' && (parsed.data.enabled !== 0 || parsed.data.support_level !== 0)) return { status: 400, body: { error: 'A runner must be implemented before enabling a language' } };
  const id = 'key' in spec ? String(parsed.data.key) : crypto.randomUUID();
  const columns = Object.keys(parsed.data).filter(x => x !== 'key');
  const now = Date.now();
  try {
    await env.DB.prepare(`INSERT INTO ${spec.table} (${'key' in spec ? 'key,' : 'id,'}${columns.join(',')},created_at,updated_at) VALUES (${Array(columns.length + 3).fill('?').join(',')})`)
      .bind(id, ...columns.map(column => parsed.data[column]), now, now).run();
    await audit(env, actorId, 'create', name, id);
    return { status: 201, body: { id } };
  } catch { return { status: 409, body: { error: 'Conflict or invalid reference' } }; }
}

export async function updateResource(env: Bindings, actorId: string, name: string, id: string, raw: unknown) {
  const spec = specFor(name);
  if (!spec || !safeId(id)) return { status: 404, body: { error: 'Resource not found' } };
  const parsed = inputFor(spec).safeParse(raw);
  if (!parsed.success) return { status: 400, body: { error: parsed.error.flatten() } };
  if (name === 'roles' && id === 'admin' && parsed.data.name !== 'admin') return { status: 403, body: { error: 'Core admin role cannot be renamed' } };
  if (name === 'languages' && (executionLanguage(id) ? parsed.data.support_level !== executionLanguage(id)!.supportLevel : parsed.data.enabled !== 0 || parsed.data.support_level !== 0)) return { status: 400, body: { error: 'Support level must match the deployed runner' } };
  const columns = Object.keys(parsed.data);
  try {
    const result = await env.DB.prepare(`UPDATE ${spec.table} SET ${columns.map(column => `${column}=?`).join(',')},updated_at=? WHERE ${'key' in spec ? 'key' : 'id'}=? AND deleted_at IS NULL`)
      .bind(...columns.map(column => parsed.data[column]), Date.now(), id).run();
    if (!result.meta.changes) return { status: 404, body: { error: 'Resource not found' } };
    await audit(env, actorId, 'update', name, id);
    return { status: 200, body: { ok: true } };
  } catch { return { status: 409, body: { error: 'Conflict or invalid reference' } }; }
}

export async function deleteResource(env: Bindings, actorId: string, name: string, id: string) {
  const spec = specFor(name);
  if (!spec || !safeId(id)) return { status: 404, body: { error: 'Resource not found' } };
  if (name === 'roles' && id === 'admin') return { status: 403, body: { error: 'Core admin role cannot be deleted' } };
  const now = Date.now();
  const result = await env.DB.prepare(`UPDATE ${spec.table} SET deleted_at=?,updated_at=? WHERE ${'key' in spec ? 'key' : 'id'}=? AND deleted_at IS NULL`).bind(now, now, id).run();
  if (!result.meta.changes) return { status: 404, body: { error: 'Resource not found' } };
  await audit(env, actorId, 'delete', name, id);
  return { status: 200, body: { ok: true } };
}
