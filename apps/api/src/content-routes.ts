import { Hono } from 'hono';
import { and, asc, count, eq, isNull } from 'drizzle-orm';
import { problemLists, problemListItems, problems, solutions, solutionImplementations } from '@algovision/db';
import { dbFor } from './repository';
import type { Bindings, Variables } from './types';

export const contentRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();
const publishedProblem = and(eq(problems.status, 'published'), isNull(problems.deletedAt));
const publishedList = and(eq(problemLists.status, 'published'), isNull(problemLists.deletedAt));

contentRoutes.get('/problem-lists', async c => {
  const items = await dbFor(c.env).select({
    id: problemLists.id, slug: problemLists.slug, title: problemLists.title,
    description: problemLists.description, sourceUrl: problemLists.sourceUrl, count: count(problems.id),
  }).from(problemLists)
    .leftJoin(problemListItems, eq(problemListItems.listId, problemLists.id))
    .leftJoin(problems, and(eq(problems.id, problemListItems.problemId), publishedProblem))
    .where(publishedList).groupBy(problemLists.id).orderBy(asc(problemLists.title));
  return c.json({ items });
});

contentRoutes.get('/problem-lists/:slug', async c => {
  const db = dbFor(c.env);
  const list = await db.select().from(problemLists).where(and(eq(problemLists.slug, c.req.param('slug')), publishedList)).get();
  if (!list) return c.json({ error: 'Not found' }, 404);
  const items = await db.select({
    id: problems.id, slug: problems.slug, title: problems.title, difficulty: problems.difficulty,
    group: problemListItems.group, order: problemListItems.order,
  }).from(problemListItems).innerJoin(problems, eq(problems.id, problemListItems.problemId))
    .where(and(eq(problemListItems.listId, list.id), publishedProblem))
    .orderBy(asc(problemListItems.order), asc(problems.id));
  return c.json({ ...list, items });
});

contentRoutes.get('/problems/:id/solutions', async c => {
  const db = dbFor(c.env);
  const problem = await db.select({ id: problems.id }).from(problems)
    .where(and(eq(problems.id, c.req.param('id')), publishedProblem)).get();
  if (!problem) return c.json({ error: 'Not found' }, 404);
  const rows = await db.select({ solution: solutions, implementation: solutionImplementations }).from(solutions)
    .leftJoin(solutionImplementations, and(eq(solutionImplementations.solutionId, solutions.id), isNull(solutionImplementations.deletedAt)))
    .where(and(eq(solutions.problemId, problem.id), eq(solutions.status, 'published'), isNull(solutions.deletedAt)))
    .orderBy(asc(solutions.order), asc(solutions.id), asc(solutionImplementations.languageId), asc(solutionImplementations.mode));
  const items = new Map<string, typeof rows[number]['solution'] & { implementations: NonNullable<typeof rows[number]['implementation']>[] }>();
  for (const { solution, implementation } of rows) {
    if (!items.has(solution.id)) items.set(solution.id, { ...solution, implementations: [] });
    if (implementation) items.get(solution.id)!.implementations.push(implementation);
  }
  return c.json({ items: [...items.values()] });
});
