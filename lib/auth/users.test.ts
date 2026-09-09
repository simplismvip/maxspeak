import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resetDbForTests } from '@/lib/db/sqlite';
import {
  authenticateWithPassword,
  createUserWithPassword,
  findUserByEmail,
  updateUserName,
} from '@/lib/auth/users';

describe('users', () => {
  afterEach(() => {
    resetDbForTests();
  });

  it('creates a user and authenticates with password', async () => {
    process.env.VOXIFY_DB_PATH = path.join(mkdtempSync(path.join(os.tmpdir(), 'voxify-')), 'test.sqlite');
    resetDbForTests();
    const created = await createUserWithPassword({
      email: '  User@Example.com ',
      name: '  小明  ',
      password: 'password123',
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.user.email).toBe('user@example.com');
    expect(created.user.name).toBe('小明');
    expect(await authenticateWithPassword('user@example.com', 'password123')).toMatchObject({
      email: 'user@example.com',
      name: '小明',
    });
    expect(await authenticateWithPassword('user@example.com', 'wrong-pass')).toBeNull();
  });

  it('rejects duplicate emails and updates nickname', async () => {
    process.env.VOXIFY_DB_PATH = path.join(mkdtempSync(path.join(os.tmpdir(), 'voxify-')), 'test.sqlite');
    resetDbForTests();
    const first = await createUserWithPassword({
      email: 'a@example.com',
      name: '阿一',
      password: 'password123',
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const duplicate = await createUserWithPassword({
      email: 'a@example.com',
      name: '阿二',
      password: 'password123',
    });
    expect(duplicate).toEqual({ ok: false, error: 'email_taken' });
    expect(updateUserName(first.user.id, '新昵称')).toEqual({ ok: true, name: '新昵称' });
    expect(findUserByEmail('a@example.com')?.name).toBe('新昵称');
  });
});
