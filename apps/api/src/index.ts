import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { and, count, desc, eq, isNull, like, or } from 'drizzle-orm';
import { roles, userRoles, users, problemExamples, languageTemplates, visualizationTemplates, tags, problemTags, systemSettings } from '@algovision/db';
import { createSession, getUser, hashPassword, revokeSession, verifyPassword } from './auth';
import { audit, auditLogs, dashboard, dbFor, executionJobs, getExecution, languages, listProblems, page, problems, savedCodes, size, testCases } from './repository';
import { PythonRunner } from './runner';
import { createResource, deleteResource, listResource, updateResource } from './admin-resources';
import type { Bindings, Variables, ExecutionMessage } from './types';

export { PythonRunner };

const app = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>();
app.use('*', cors({ origin: origin => origin ?? '', allowHeaders: ['Content-Type', 'Authorization'], allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] }));
app.use('/api/*', async (c, next) => {
  const origin = c.req.header('Origin');
  if (origin && ![c.env.APP_ORIGIN, c.env.ADMIN_ORIGIN].includes(origin)) return c.json({ error: 'Origin forbidden' }, 403);
  await next();
});

const credentials = z.object({ email: z.email(), password: z.string().min(10).max(200) });
const problemInput = z.object({ slug: z.string().regex(/^[a-z0-9-]{2,100}$/), title: z.string().min(2).max(200), description: z.string().min(1).max(50000), difficulty: z.enum(['easy', 'medium', 'hard']), status: z.enum(['draft', 'published']).default('draft') });
const codeMode = z.enum(['core', 'main']);
const invocationSchema = z.object({ className: z.string().regex(/^[A-Za-z_]\w*$/), method: z.string().regex(/^[A-Za-z_]\w*$/), arguments: z.array(z.string()).max(20) });
const executionInput = z.object({ mode: codeMode.default('main'), problemId: z.string().uuid(), languageId: z.string(), code: z.string().min(1).max(50000), input: z.string().max(20000).default('') });
const jsonError = (error: unknown) => ({ error: error instanceof Error ? error.message : String(error) });

app.openapi(createRoute({ method: 'get', path: '/api/health', responses: { 200: { content: { 'application/json': { schema: z.object({ ok: z.boolean() }) } }, description: 'Health' } } }), c => c.json({ ok: true }));
app.get('/openapi.json', c => c.json(app.getOpenAPI31Document({ openapi: '3.1.0', info: { title: 'AlgoVision API', version: '0.1.0' } })));

app.post('/api/auth/register', async c => {
  const parsed = credentials.extend({ displayName: z.string().min(1).max(80) }).safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  const db = dbFor(c.env), id = crypto.randomUUID();
  try {
    await db.insert(users).values({ id, email: parsed.data.email.toLowerCase(), displayName: parsed.data.displayName, passwordHash: await hashPassword(parsed.data.password) });
    return c.json({ token: await createSession(c.env, id) }, 201);
  } catch { return c.json({ error: 'Email unavailable' }, 409); }
});
app.post('/api/auth/login', async c => {
  const parsed = credentials.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: 'Invalid credentials' }, 400);
  const row = await dbFor(c.env).select().from(users).where(and(eq(users.email, parsed.data.email.toLowerCase()), isNull(users.deletedAt), eq(users.status, 'active'))).get();
  if (!row || !(await verifyPassword(parsed.data.password, row.passwordHash))) return c.json({ error: 'Invalid credentials' }, 401);
  return c.json({ token: await createSession(c.env, row.id) });
});
app.post('/api/auth/bootstrap', async c => {
  const parsed = credentials.extend({ token: z.string().min(32), displayName: z.string().min(1).max(80) }).safeParse(await c.req.json());
  if (!parsed.success || !c.env.ADMIN_BOOTSTRAP_TOKEN || parsed.data.token !== c.env.ADMIN_BOOTSTRAP_TOKEN) return c.json({ error: 'Forbidden' }, 403);
  const db = dbFor(c.env);
  const adminRole = await db.select().from(roles).where(eq(roles.name, 'admin')).get();
  if (!adminRole) return c.json({ error: 'Run migrations and seed first' }, 503);
  const existing = await db.select({ value: count() }).from(userRoles).where(eq(userRoles.roleId, adminRole.id)).get();
  if ((existing?.value ?? 0) > 0) return c.json({ error: 'Bootstrap already completed' }, 409);
  const id = crypto.randomUUID();
  try {
    await c.env.DB.batch([
      c.env.DB.prepare('INSERT INTO users (id,email,password_hash,display_name,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?)').bind(id, parsed.data.email.toLowerCase(), await hashPassword(parsed.data.password), parsed.data.displayName, 'active', Date.now(), Date.now()),
      c.env.DB.prepare('INSERT INTO user_roles (user_id,role_id) VALUES (?,?)').bind(id, adminRole.id),
    ]);
    return c.json({ token: await createSession(c.env, id) }, 201);
  } catch { return c.json({ error: 'Bootstrap failed' }, 409); }
});
app.get('/api/auth/me', async c => { const user = await getUser(c.env, c.req.header('Authorization')); return user ? c.json(user) : c.json({ error: 'Unauthorized' }, 401); });
app.post('/api/auth/logout', async c => { await revokeSession(c.env, c.req.header('Authorization')); return c.json({ ok: true }); });

app.get('/api/problems', async c => c.json(await listProblems(c.env, { page: c.req.query('page'), size: c.req.query('size'), q: c.req.query('q'), difficulty: c.req.query('difficulty') })));
app.get('/api/problems/:id', async c => {
  const db = dbFor(c.env);
  const row = await db.select().from(problems).where(and(eq(problems.id, c.req.param('id')), eq(problems.status, 'published'), isNull(problems.deletedAt))).get();
  if (!row) return c.json({ error: 'Not found' }, 404);
  const [examples, templates] = await Promise.all([
    db.select().from(problemExamples).where(and(eq(problemExamples.problemId, row.id), isNull(problemExamples.deletedAt))),
    db.select().from(languageTemplates).where(and(eq(languageTemplates.problemId, row.id), isNull(languageTemplates.deletedAt))),
  ]);
  examples.sort((a, b) => a.order - b.order);
  return c.json({ ...row, examples, templates });
});
app.get('/api/languages', async c => c.json(await dbFor(c.env).select().from(languages).where(and(eq(languages.enabled, true), isNull(languages.deletedAt)))));

app.post('/api/executions', async c => {
  const user = await getUser(c.env, c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Login required' }, 401);
  const parsed = executionInput.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  const db = dbFor(c.env), { code, input, languageId, problemId, mode } = parsed.data;
  const [problem, language] = await Promise.all([
    db.select().from(problems).where(and(eq(problems.id, problemId), eq(problems.status, 'published'), isNull(problems.deletedAt))).get(),
    db.select().from(languages).where(and(eq(languages.id, languageId), eq(languages.enabled, true))).get(),
  ]);
  if (!problem || !language) return c.json({ error: 'Problem or language unavailable' }, 400);
  if (language.id !== 'python' || language.supportLevel < 2) return c.json({ error: 'This language is not executable yet' }, 422);
  let invocation: string | undefined;
  if (mode === 'core') {
    const template = await db.select().from(languageTemplates).where(and(eq(languageTemplates.problemId, problemId), eq(languageTemplates.languageId, languageId), eq(languageTemplates.mode, mode), isNull(languageTemplates.deletedAt))).get();
    let rawConfig: unknown = null;
    try { rawConfig = JSON.parse(template?.invocation ?? 'null'); } catch {}
    const config = invocationSchema.safeParse(rawConfig);
    if (!config.success) return c.json({ error: 'Core code mode unavailable for this problem' }, 422);
    try { const data = JSON.parse(input); if (!data || typeof data !== 'object' || Array.isArray(data) || config.data.arguments.some(key => !Object.hasOwn(data, key))) throw new Error(); }
    catch { return c.json({ error: 'Core mode requires a JSON object with the problem arguments' }, 400); }
    invocation = JSON.stringify(config.data);
  }
  const active = await db.select({ value: count() }).from(executionJobs).where(and(eq(executionJobs.userId, user.id), or(eq(executionJobs.status, 'queued'), eq(executionJobs.status, 'running')))).get();
  if ((active?.value ?? 0) >= 3) return c.json({ error: 'Too many queued runs' }, 429);
  const id = crypto.randomUUID(), codeKey = `code/${user.id}/${id}.py`;
  await c.env.OBJECTS.put(codeKey, code, { httpMetadata: { contentType: 'text/x-python' }, customMetadata: { mode, ...(invocation ? { invocation } : {}) } });
  try {
    await db.insert(executionJobs).values({ id, userId: user.id, languageId, codeKey, input, status: 'queued' });
    await c.env.EXECUTIONS.send({ jobId: id });
  } catch (error) {
    await db.update(executionJobs).set({ status: 'failed', error: 'Queue dispatch failed', updatedAt: new Date() }).where(eq(executionJobs.id, id));
    return c.json(jsonError(error), 503);
  }
  return c.json({ id, status: 'queued' }, 202);
});
app.get('/api/executions/:id', async c => {
  const user = await getUser(c.env, c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const result = await getExecution(c.env, c.req.param('id'), user.id, user.isAdmin);
  return result ? c.json(result) : c.json({ error: 'Not found' }, 404);
});
app.get('/api/executions/:id/trace', async c => {
  const user = await getUser(c.env, c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const job = await getExecution(c.env, c.req.param('id'), user.id, user.isAdmin);
  if (!job?.result?.traceKey) return c.json({ error: 'Trace unavailable' }, 404);
  const object = await c.env.OBJECTS.get(job.result.traceKey);
  if (!object) return c.json({ error: 'Trace unavailable' }, 404);
  return new Response(object.body.pipeThrough(new DecompressionStream('gzip')), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' } });
});
app.get('/api/executions', async c => {
  const user = await getUser(c.env, c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  return c.json(await dbFor(c.env).select().from(executionJobs).where(eq(executionJobs.userId, user.id)).orderBy(desc(executionJobs.createdAt)).limit(size(c.req.query('size'))).offset((page(c.req.query('page')) - 1) * size(c.req.query('size'))));
});
app.put('/api/saved-codes/:problemId/:languageId', async c => {
  const user = await getUser(c.env, c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const parsed = z.object({ code: z.string().max(50000), mode: codeMode.default('main') }).safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  await dbFor(c.env).insert(savedCodes).values({ id: crypto.randomUUID(), userId: user.id, problemId: c.req.param('problemId'), languageId: c.req.param('languageId'), code: parsed.data.code, mode: parsed.data.mode })
    .onConflictDoUpdate({ target: [savedCodes.userId, savedCodes.problemId, savedCodes.languageId, savedCodes.mode], set: { code: parsed.data.code, updatedAt: new Date() } });
  return c.json({ ok: true });
});
app.get('/api/saved-codes/:problemId/:languageId', async c => {
  const user = await getUser(c.env, c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const mode = codeMode.safeParse(c.req.query('mode') ?? 'main');
  if (!mode.success) return c.json({ error: 'Invalid code mode' }, 400);
  const row = await dbFor(c.env).select().from(savedCodes).where(and(eq(savedCodes.userId, user.id), eq(savedCodes.problemId, c.req.param('problemId')), eq(savedCodes.languageId, c.req.param('languageId')), eq(savedCodes.mode, mode.data))).get();
  return c.json(row ?? { code: null });
});

app.use('/api/admin/*', async (c, next) => {
  const user = await getUser(c.env, c.req.header('Authorization'));
  if (!user?.isAdmin) return c.json({ error: 'Admin required' }, 403);
  c.set('user', user);
  await next();
});
app.get('/api/admin/dashboard', async c => c.json(await dashboard(c.env)));
app.get('/api/admin/resources/:resource', async c => {
  const result = await listResource(c.env, c.req.param('resource'), c.req.query());
  return result ? c.json(result) : c.json({ error: 'Resource not found' }, 404);
});
app.post('/api/admin/resources/:resource', async c => {
  const result = await createResource(c.env, c.get('user').id, c.req.param('resource'), await c.req.json());
  return c.json(result.body, result.status as 200);
});
app.put('/api/admin/resources/:resource/:id', async c => {
  const result = await updateResource(c.env, c.get('user').id, c.req.param('resource'), c.req.param('id'), await c.req.json());
  return c.json(result.body, result.status as 200);
});
app.delete('/api/admin/resources/:resource/:id', async c => {
  const result = await deleteResource(c.env, c.get('user').id, c.req.param('resource'), c.req.param('id'));
  return c.json(result.body, result.status as 200);
});
app.get('/api/admin/problems', async c => c.json(await listProblems(c.env, { ...c.req.query(), admin: true })));
app.post('/api/admin/problems', async c => {
  const parsed = problemInput.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  const id = crypto.randomUUID();
  try {
    await dbFor(c.env).insert(problems).values({ id, ...parsed.data });
    await audit(c.env, c.get('user').id, 'create', 'problem', id);
    return c.json({ id }, 201);
  } catch { return c.json({ error: 'Slug already exists' }, 409); }
});
app.put('/api/admin/problems/:id', async c => {
  const parsed = problemInput.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  const result = await dbFor(c.env).update(problems).set({ ...parsed.data, updatedAt: new Date() }).where(and(eq(problems.id, c.req.param('id')), isNull(problems.deletedAt))).returning({ id: problems.id });
  if (!result.length) return c.json({ error: 'Not found' }, 404);
  await audit(c.env, c.get('user').id, 'update', 'problem', result[0].id);
  return c.json({ ok: true });
});
app.delete('/api/admin/problems/:id', async c => {
  const result = await dbFor(c.env).update(problems).set({ deletedAt: new Date(), updatedAt: new Date() }).where(and(eq(problems.id, c.req.param('id')), isNull(problems.deletedAt))).returning({ id: problems.id });
  if (!result.length) return c.json({ error: 'Not found' }, 404);
  await audit(c.env, c.get('user').id, 'delete', 'problem', result[0].id);
  return c.json({ ok: true });
});

const adminTables = { languages, tags, testCases, languageTemplates, problemExamples, visualizationTemplates, systemSettings } as const;
app.get('/api/admin/executions', async c => c.json(await dbFor(c.env).select().from(executionJobs).orderBy(desc(executionJobs.createdAt)).limit(size(c.req.query('size'))).offset((page(c.req.query('page')) - 1) * size(c.req.query('size')))));
app.get('/api/admin/audit-logs', async c => c.json(await dbFor(c.env).select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(size(c.req.query('size'))).offset((page(c.req.query('page')) - 1) * size(c.req.query('size')))));
app.get('/api/admin/users', async c => c.json(await dbFor(c.env).select({ id: users.id, email: users.email, displayName: users.displayName, status: users.status, createdAt: users.createdAt }).from(users).where(isNull(users.deletedAt)).orderBy(desc(users.createdAt)).limit(size(c.req.query('size'))).offset((page(c.req.query('page')) - 1) * size(c.req.query('size')))));
app.get('/api/admin/objects', async c => {
  const prefix = c.req.query('prefix') ?? '';
  if (prefix && !/^(traces|code|uploads)\/[a-zA-Z0-9/_-]*$/.test(prefix)) return c.json({ error: 'Invalid prefix' }, 400);
  const result = await c.env.OBJECTS.list({ prefix, limit: 100 });
  return c.json({ objects: result.objects.map(x => ({ key: x.key, size: x.size, uploaded: x.uploaded })), truncated: result.truncated, cursor: result.truncated ? result.cursor : null });
});
app.onError((error, c) => { console.error(error); return c.json({ error: 'Internal server error' }, 500); });

async function consume(message: Message<ExecutionMessage>, env: Bindings) {
  const id = message.body.jobId;
  if (!/^[0-9a-f-]{36}$/.test(id)) { message.ack(); return; }
  const claim = await env.DB.prepare("UPDATE execution_jobs SET status='running',attempts=attempts+1,updated_at=? WHERE id=? AND (status='queued' OR (status='running' AND updated_at<?)) RETURNING user_id,code_key,input,attempts")
    .bind(Date.now(), id, Date.now() - 120000).first<{ user_id: string; code_key: string; input: string; attempts: number }>();
  if (!claim) { message.ack(); return; }
  try {
    const codeObject = await env.OBJECTS.get(claim.code_key);
    if (!codeObject) throw new Error('Code snapshot missing');
    const localRunner = env.LOCAL_RUNNER_URL ? new URL(env.LOCAL_RUNNER_URL) : null;
    if (localRunner && (localRunner.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(localRunner.hostname))) throw new Error('Invalid local runner address');
    const target = localRunner ? new URL('/run', localRunner).toString() : 'http://container/run';
    const runner = localRunner ? null : env.PYTHON_RUNNER.getByName(id);
    const response = await (runner ? runner.fetch(target, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: await codeObject.text(), input: claim.input, invocation: codeObject.customMetadata?.invocation ? JSON.parse(codeObject.customMetadata.invocation) : null }) }) : fetch(target, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: await codeObject.text(), input: claim.input, invocation: codeObject.customMetadata?.invocation ? JSON.parse(codeObject.customMetadata.invocation) : null }) }));
    if (!response.ok) throw new Error(`Runner returned ${response.status}`);
    const result = await response.json() as { stdout: string; stderr: string; exitCode: number; durationMs: number; frames: unknown[]; error?: string };
    const traceKey = `traces/${claim.user_id}/${id}/trace.json.gz`;
    const traceJson = JSON.stringify({ version: 2, frames: result.frames });
    if (new TextEncoder().encode(traceJson).byteLength > 4_000_000) throw new Error('Trace size limit exceeded');
    const stream = new Blob([traceJson]).stream().pipeThrough(new CompressionStream('gzip'));
    await env.OBJECTS.put(traceKey, await new Response(stream).arrayBuffer(), { httpMetadata: { contentType: 'application/json', contentEncoding: 'gzip' }, customMetadata: { traceVersion: '2' } });
    await env.DB.batch([
      env.DB.prepare('INSERT INTO execution_records (id,job_id,stdout,stderr,exit_code,trace_key,trace_version,frame_count,duration_ms,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(job_id) DO UPDATE SET stdout=excluded.stdout,stderr=excluded.stderr,exit_code=excluded.exit_code,trace_key=excluded.trace_key,trace_version=excluded.trace_version,frame_count=excluded.frame_count,duration_ms=excluded.duration_ms,updated_at=excluded.updated_at')
        .bind(crypto.randomUUID(), id, result.stdout, result.stderr, result.exitCode, traceKey, 2, result.frames.length, result.durationMs, Date.now(), Date.now()),
      env.DB.prepare('UPDATE execution_jobs SET status=?,error=?,updated_at=? WHERE id=?').bind(result.error ? 'failed' : 'completed', result.error ?? null, Date.now(), id),
    ]);
    message.ack();
  } catch (error) {
    console.error('Execution job failed', id, error);
    const final = claim.attempts >= 4;
    await env.DB.prepare('UPDATE execution_jobs SET status=?,error=?,updated_at=? WHERE id=?').bind(final ? 'failed' : 'queued', String(error).slice(0, 1000), Date.now(), id).run();
    message.retry();
  }
}

export default {
  fetch: app.fetch,
  async queue(batch: MessageBatch<ExecutionMessage>, env: Bindings) { for (const message of batch.messages) await consume(message, env); },
};
