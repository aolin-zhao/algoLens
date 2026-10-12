import { and, eq, gt, isNull } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { roles, sessions, userRoles, users } from '@algovision/db';
import type { Bindings, AuthUser } from './types';

const encoder = new TextEncoder();
const hex = (bytes: Uint8Array) => Array.from(bytes, x => x.toString(16).padStart(2, '0')).join('');
const digest = async (value: string) => hex(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))));

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 310000 }, key, 256);
  return `${hex(salt)}:${hex(new Uint8Array(hash))}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [saltHex, expected] = stored.split(':');
  if (!saltHex || !expected || saltHex.length !== 32) return false;
  const salt = new Uint8Array(saltHex.match(/../g)!.map(x => parseInt(x, 16)));
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const actual = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 310000 }, key, 256));
  const expectedBytes = new Uint8Array(expected.match(/../g)?.map(x => parseInt(x, 16)) ?? []);
  if (actual.length !== expectedBytes.length) return false;
  let difference = 0;
  for (let i = 0; i < actual.length; i++) difference |= actual[i] ^ expectedBytes[i];
  return difference === 0;
}

export async function createSession(env: Bindings, userId: string) {
  const token = `${crypto.randomUUID()}.${crypto.randomUUID()}`;
  const db = drizzle(env.DB);
  await db.insert(sessions).values({ id: crypto.randomUUID(), userId, tokenHash: await digest(token), expiresAt: new Date(Date.now() + 7 * 86400000) });
  return token;
}

export async function getUser(env: Bindings, authorization?: string): Promise<AuthUser | null> {
  const token = authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return null;
  const db = drizzle(env.DB);
  const row = await db.select({ id: users.id, email: users.email }).from(sessions).innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, await digest(token)), gt(sessions.expiresAt, new Date()), isNull(users.deletedAt), eq(users.status, 'active'))).get();
  if (!row) return null;
  const admin = await db.select({ id: roles.id }).from(userRoles).innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(and(eq(userRoles.userId, row.id), eq(roles.name, 'admin'))).get();
  return { ...row, isAdmin: !!admin };
}

export async function revokeSession(env: Bindings, authorization?: string) {
  const token = authorization?.match(/^Bearer (.+)$/)?.[1];
  if (token) await drizzle(env.DB).delete(sessions).where(eq(sessions.tokenHash, await digest(token)));
}
