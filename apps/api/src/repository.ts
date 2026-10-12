import { and, count, desc, eq, isNull, like, or, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { auditLogs, executionJobs, executionRecords, languages, problems, savedCodes, testCases } from '@algovision/db';
import type { Bindings } from './types';

export const dbFor = (env: Bindings) => drizzle(env.DB);
export const page = (raw: string | undefined) => Math.max(1, Number.parseInt(raw ?? '1', 10) || 1);
export const size = (raw: string | undefined) => Math.min(100, Math.max(1, Number.parseInt(raw ?? '20', 10) || 20));

export async function listProblems(env: Bindings, params: { page?: string; size?: string; q?: string; difficulty?: string; admin?: boolean }) {
  const db = dbFor(env);
  const term = params.q?.trim().slice(0, 100);
  const where = and(isNull(problems.deletedAt), params.admin ? undefined : eq(problems.status, 'published'),
    params.difficulty ? eq(problems.difficulty, params.difficulty) : undefined,
    term ? or(like(problems.title, `%${term}%`), like(problems.slug, `%${term}%`)) : undefined);
  const current = page(params.page), limit = size(params.size);
  const [items, total] = await Promise.all([
    db.select().from(problems).where(where).orderBy(desc(problems.createdAt)).limit(limit).offset((current - 1) * limit),
    db.select({ value: count() }).from(problems).where(where).get(),
  ]);
  return { items, total: total?.value ?? 0, page: current, size: limit };
}

export async function audit(env: Bindings, actorId: string, action: string, entity: string, entityId: string, detail: object = {}) {
  await dbFor(env).insert(auditLogs).values({ id: crypto.randomUUID(), actorId, action, entity, entityId, detail: JSON.stringify(detail) });
}

export async function getExecution(env: Bindings, jobId: string, userId: string, admin = false) {
  const db = dbFor(env);
  const job = await db.select().from(executionJobs).where(and(eq(executionJobs.id, jobId), admin ? undefined : eq(executionJobs.userId, userId))).get();
  if (!job) return null;
  const result = await db.select().from(executionRecords).where(eq(executionRecords.jobId, jobId)).get();
  return { ...job, result: result ?? null };
}

export async function dashboard(env: Bindings) {
  const db = dbFor(env);
  const [p, l, j, failed] = await Promise.all([
    db.select({ value: count() }).from(problems).where(isNull(problems.deletedAt)).get(),
    db.select({ value: count() }).from(languages).where(isNull(languages.deletedAt)).get(),
    db.select({ value: count() }).from(executionJobs).get(),
    db.select({ value: count() }).from(executionJobs).where(eq(executionJobs.status, 'failed')).get(),
  ]);
  return { problems: p?.value ?? 0, languages: l?.value ?? 0, executions: j?.value ?? 0, failed: failed?.value ?? 0 };
}

export { executionJobs, executionRecords, languages, problems, savedCodes, testCases, auditLogs, sql };
