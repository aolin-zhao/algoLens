import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const contentOwnership = { contentPackage: text('content_package') };

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
};

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), email: text('email').notNull().unique(), passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(), status: text('status').notNull().default('active'), ...timestamps,
});
export const roles = sqliteTable('roles', { id: text('id').primaryKey(), name: text('name').notNull().unique(), ...timestamps });
export const permissions = sqliteTable('permissions', { id: text('id').primaryKey(), code: text('code').notNull().unique(), ...timestamps });
export const userRoles = sqliteTable('user_roles', { userId: text('user_id').notNull().references(() => users.id), roleId: text('role_id').notNull().references(() => roles.id) }, t => [primaryKey({ columns: [t.userId, t.roleId] })]);
export const rolePermissions = sqliteTable('role_permissions', { roleId: text('role_id').notNull().references(() => roles.id), permissionId: text('permission_id').notNull().references(() => permissions.id) }, t => [primaryKey({ columns: [t.roleId, t.permissionId] })]);
export const sessions = sqliteTable('sessions', { id: text('id').primaryKey(), userId: text('user_id').notNull().references(() => users.id), tokenHash: text('token_hash').notNull().unique(), expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(), ...timestamps }, t => [index('sessions_user_idx').on(t.userId)]);
export const problems = sqliteTable('problems', { id: text('id').primaryKey(), slug: text('slug').notNull().unique(), title: text('title').notNull(), description: text('description').notNull(), difficulty: text('difficulty').notNull(), status: text('status').notNull().default('draft'), ...contentOwnership, ...timestamps }, t => [index('problems_filter_idx').on(t.status, t.difficulty, t.deletedAt)]);
export const tags = sqliteTable('tags', { id: text('id').primaryKey(), name: text('name').notNull().unique(), ...timestamps });
export const problemTags = sqliteTable('problem_tags', { problemId: text('problem_id').notNull().references(() => problems.id), tagId: text('tag_id').notNull().references(() => tags.id) }, t => [primaryKey({ columns: [t.problemId, t.tagId] })]);
export const problemExamples = sqliteTable('problem_examples', { id: text('id').primaryKey(), problemId: text('problem_id').notNull().references(() => problems.id), input: text('input').notNull(), output: text('output').notNull(), explanation: text('explanation'), order: integer('sort_order').notNull().default(0), ...contentOwnership, ...timestamps });
export const languages = sqliteTable('languages', { id: text('id').primaryKey(), label: text('label').notNull(), supportLevel: integer('support_level').notNull().default(0), enabled: integer('enabled', { mode: 'boolean' }).notNull().default(false), ...timestamps });
export const languageTemplates = sqliteTable('language_templates', { id: text('id').primaryKey(), problemId: text('problem_id').notNull().references(() => problems.id), languageId: text('language_id').notNull().references(() => languages.id), code: text('code').notNull(), mode: text('mode').notNull().default('main'), invocation: text('invocation'), ...contentOwnership, ...timestamps }, t => [uniqueIndex('template_problem_language_mode').on(t.problemId, t.languageId, t.mode)]);
export const testCases = sqliteTable('test_cases', { id: text('id').primaryKey(), problemId: text('problem_id').notNull().references(() => problems.id), input: text('input').notNull(), expectedOutput: text('expected_output').notNull(), hidden: integer('hidden', { mode: 'boolean' }).notNull().default(false), ...contentOwnership, ...timestamps }, t => [index('test_cases_problem_idx').on(t.problemId)]);
export const submissions = sqliteTable('submissions', { id: text('id').primaryKey(), userId: text('user_id').notNull().references(() => users.id), problemId: text('problem_id').notNull().references(() => problems.id), languageId: text('language_id').notNull().references(() => languages.id), codeKey: text('code_key').notNull(), status: text('status').notNull().default('queued'), ...timestamps });
export const executionJobs = sqliteTable('execution_jobs', { id: text('id').primaryKey(), userId: text('user_id').notNull().references(() => users.id), submissionId: text('submission_id').references(() => submissions.id), languageId: text('language_id').notNull().references(() => languages.id), codeKey: text('code_key').notNull(), input: text('input').notNull(), status: text('status').notNull().default('queued'), attempts: integer('attempts').notNull().default(0), error: text('error'), ...timestamps }, t => [index('execution_jobs_user_idx').on(t.userId, t.createdAt), index('execution_jobs_status_idx').on(t.status)]);
export const executionRecords = sqliteTable('execution_records', { id: text('id').primaryKey(), jobId: text('job_id').notNull().unique().references(() => executionJobs.id), stdout: text('stdout').notNull().default(''), stderr: text('stderr').notNull().default(''), exitCode: integer('exit_code'), traceKey: text('trace_key'), traceVersion: integer('trace_version'), frameCount: integer('frame_count').notNull().default(0), durationMs: integer('duration_ms'), ...timestamps });
export const savedCodes = sqliteTable('saved_codes', { id: text('id').primaryKey(), userId: text('user_id').notNull().references(() => users.id), problemId: text('problem_id').notNull().references(() => problems.id), languageId: text('language_id').notNull().references(() => languages.id), code: text('code').notNull(), mode: text('mode').notNull().default('main'), ...timestamps }, t => [uniqueIndex('saved_code_user_problem_language_mode').on(t.userId, t.problemId, t.languageId, t.mode)]);
export const visualizationTemplates = sqliteTable('visualization_templates', { id: text('id').primaryKey(), name: text('name').notNull(), kind: text('kind').notNull(), config: text('config').notNull().default('{}'), ...timestamps });
export const favorites = sqliteTable('favorites', { userId: text('user_id').notNull().references(() => users.id), problemId: text('problem_id').notNull().references(() => problems.id), createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()) }, t => [primaryKey({ columns: [t.userId, t.problemId] })]);
export const systemSettings = sqliteTable('system_settings', { key: text('key').primaryKey(), value: text('value').notNull(), ...timestamps });
export const auditLogs = sqliteTable('audit_logs', { id: text('id').primaryKey(), actorId: text('actor_id').references(() => users.id), action: text('action').notNull(), entity: text('entity').notNull(), entityId: text('entity_id'), detail: text('detail').notNull().default('{}'), createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()) }, t => [index('audit_created_idx').on(t.createdAt)]);

export const problemLists = sqliteTable('problem_lists', {
  id: text('id').primaryKey(), slug: text('slug').notNull().unique(), title: text('title').notNull(),
  description: text('description').notNull(), sourceUrl: text('source_url'), status: text('status').notNull().default('draft'),
  ...contentOwnership, ...timestamps,
});
export const problemListItems = sqliteTable('problem_list_items', {
  listId: text('list_id').notNull().references(() => problemLists.id), problemId: text('problem_id').notNull().references(() => problems.id),
  group: text('group_name').notNull().default(''), order: integer('sort_order').notNull().default(0), ...contentOwnership,
}, t => [primaryKey({ columns: [t.listId, t.problemId] })]);
export const solutions = sqliteTable('solutions', {
  id: text('id').primaryKey(), problemId: text('problem_id').notNull().references(() => problems.id), slug: text('slug').notNull(),
  title: text('title').notNull(), explanation: text('explanation').notNull(), timeComplexity: text('time_complexity').notNull(),
  spaceComplexity: text('space_complexity').notNull(), order: integer('sort_order').notNull().default(0),
  status: text('status').notNull().default('draft'), diagram: text('diagram'), ...contentOwnership, ...timestamps,
}, t => [uniqueIndex('solution_problem_slug').on(t.problemId, t.slug)]);
export const solutionImplementations = sqliteTable('solution_implementations', {
  id: text('id').primaryKey(), solutionId: text('solution_id').notNull().references(() => solutions.id),
  languageId: text('language_id').notNull().references(() => languages.id), mode: text('mode').notNull().default('core'),
  code: text('code').notNull(), ...contentOwnership, ...timestamps,
}, t => [uniqueIndex('solution_implementation_language_mode').on(t.solutionId, t.languageId, t.mode)]);
export const contentSyncs = sqliteTable('content_syncs', {
  packageId: text('package_id').primaryKey(), version: integer('version').notNull(), hash: text('hash').notNull(),
  syncedAt: integer('synced_at', { mode: 'timestamp_ms' }).notNull(),
});
