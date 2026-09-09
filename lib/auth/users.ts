import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db/sqlite';
import { normalizeEmail } from '@/lib/auth/email-otp';
import { normalizeName, validatePassword } from '@/lib/auth/password';

export type UserRecord = {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null;
  image: string | null;
  createdAt: number;
  updatedAt: number;
};

type UserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string | null;
  image: string | null;
  created_at: number;
  updated_at: number;
};

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    image: row.image,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function passwordMatches(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function findUserByEmail(emailRaw: string): UserRecord | null {
  const email = normalizeEmail(emailRaw);
  if (!email) return null;
  const row = getDb()
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

export function findUserById(id: string): UserRecord | null {
  const row = getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

export async function createUserWithPassword(input: {
  email: string;
  name: string;
  password: string;
}): Promise<{ ok: true; user: UserRecord } | { ok: false; error: string }> {
  const email = normalizeEmail(input.email);
  const name = normalizeName(input.name);
  const passwordError = validatePassword(input.password);
  if (!email) return { ok: false, error: 'invalid_email' };
  if (!name) return { ok: false, error: 'invalid_name' };
  if (passwordError) return { ok: false, error: 'invalid_password' };
  if (findUserByEmail(email)) return { ok: false, error: 'email_taken' };

  const now = Date.now();
  const user: UserRecord = {
    id: randomUUID(),
    email,
    name,
    passwordHash: await hashPassword(input.password),
    image: null,
    createdAt: now,
    updatedAt: now,
  };
  getDb()
    .prepare(
      'INSERT INTO users (id, email, name, password_hash, image, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(user.id, user.email, user.name, user.passwordHash, user.image, user.createdAt, user.updatedAt);
  return { ok: true, user };
}

export function ensureUserFromIdentity(input: { email: string; name?: string | null; image?: string | null }) {
  const email = normalizeEmail(input.email);
  if (!email) return null;
  return findUserByEmail(email) ?? upsertGoogleUser(input);
}

export function upsertGoogleUser(input: { email: string; name?: string | null; image?: string | null }) {
  const email = normalizeEmail(input.email);
  if (!email) return null;
  const existing = findUserByEmail(email);
  const now = Date.now();
  if (existing) {
    const image = input.image || existing.image;
    getDb().prepare('UPDATE users SET image = ?, updated_at = ? WHERE id = ?').run(image, now, existing.id);
    return findUserById(existing.id);
  }

  const name = normalizeName(input.name || '') || email.split('@')[0] || '用户';
  const user: UserRecord = {
    id: randomUUID(),
    email,
    name,
    passwordHash: null,
    image: input.image || null,
    createdAt: now,
    updatedAt: now,
  };
  getDb()
    .prepare(
      'INSERT INTO users (id, email, name, password_hash, image, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(user.id, user.email, user.name, user.passwordHash, user.image, user.createdAt, user.updatedAt);
  return user;
}

export async function authenticateWithPassword(emailRaw: string, password: string) {
  const user = findUserByEmail(emailRaw);
  if (!user?.passwordHash) return null;
  const ok = await passwordMatches(password, user.passwordHash);
  return ok ? user : null;
}

export async function setUserPassword(userId: string, password: string) {
  const passwordError = validatePassword(password);
  if (passwordError) return { ok: false as const, error: 'invalid_password' };
  getDb()
    .prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
    .run(await hashPassword(password), Date.now(), userId);
  return { ok: true as const };
}

export function updateUserName(userId: string, nameRaw: string) {
  const name = normalizeName(nameRaw);
  if (!name) return { ok: false as const, error: 'invalid_name' };
  getDb().prepare('UPDATE users SET name = ?, updated_at = ? WHERE id = ?').run(name, Date.now(), userId);
  return { ok: true as const, name };
}

export function toAuthUser(user: UserRecord) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image || undefined,
  };
}
