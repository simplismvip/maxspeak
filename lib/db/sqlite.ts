import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

type GlobalDb = typeof globalThis & {
  __voxifySqlite?: Database.Database;
};

function dbFilePath() {
  return process.env.VOXIFY_DB_PATH || path.join(process.cwd(), 'data', 'voxify.sqlite');
}

function ensureSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT,
      image TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS designed_voices (
      user_id TEXT NOT NULL,
      voice_id TEXT NOT NULL,
      prompt TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      unlocked_at INTEGER,
      PRIMARY KEY (user_id, voice_id)
    );
    CREATE INDEX IF NOT EXISTS designed_voices_voice_id ON designed_voices(voice_id);
  `);
}

export function getDb() {
  const globalDb = globalThis as GlobalDb;
  if (globalDb.__voxifySqlite) {
    ensureSchema(globalDb.__voxifySqlite);
    return globalDb.__voxifySqlite;
  }

  const file = dbFilePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  ensureSchema(db);
  globalDb.__voxifySqlite = db;
  return db;
}

export function resetDbForTests() {
  const globalDb = globalThis as GlobalDb;
  if (globalDb.__voxifySqlite) {
    globalDb.__voxifySqlite.close();
    globalDb.__voxifySqlite = undefined;
  }
}
