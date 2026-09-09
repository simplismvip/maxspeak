import { getDb } from '@/lib/db/sqlite';

export type DesignedVoiceRecord = {
  userId: string;
  voiceId: string;
  prompt: string;
  createdAt: number;
  unlockedAt: number | null;
};

type DesignedVoiceRow = {
  user_id: string;
  voice_id: string;
  prompt: string;
  created_at: number;
  unlocked_at: number | null;
};

function mapRow(row: DesignedVoiceRow): DesignedVoiceRecord {
  return {
    userId: row.user_id,
    voiceId: row.voice_id,
    prompt: row.prompt,
    createdAt: row.created_at,
    unlockedAt: row.unlocked_at,
  };
}

export function saveDesignedVoice(input: {
  userId: string;
  voiceId: string;
  prompt?: string;
  createdAt?: number;
}) {
  const voiceId = input.voiceId.trim();
  if (!input.userId || !voiceId) return;
  const now = input.createdAt ?? Date.now();
  const prompt = (input.prompt || '').trim();
  getDb()
    .prepare(
      `INSERT INTO designed_voices (user_id, voice_id, prompt, created_at, unlocked_at)
       VALUES (?, ?, ?, ?, NULL)
       ON CONFLICT(user_id, voice_id) DO UPDATE SET
         prompt = CASE WHEN excluded.prompt != '' THEN excluded.prompt ELSE designed_voices.prompt END`
    )
    .run(input.userId, voiceId, prompt, now);
}

export function syncDesignedVoices(
  userId: string,
  voices: Array<{ voiceId: string; prompt?: string; createdAt?: number }>
) {
  for (const voice of voices) {
    saveDesignedVoice({
      userId,
      voiceId: voice.voiceId,
      prompt: voice.prompt,
      createdAt: voice.createdAt,
    });
  }
}

export function listDesignedVoices(userId: string): DesignedVoiceRecord[] {
  const rows = getDb()
    .prepare('SELECT * FROM designed_voices WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId) as DesignedVoiceRow[];
  return rows.map(mapRow);
}

export function findDesignedVoiceByVoiceId(voiceId: string): DesignedVoiceRecord | null {
  const id = voiceId.trim();
  if (!id) return null;
  const row = getDb()
    .prepare('SELECT * FROM designed_voices WHERE voice_id = ? LIMIT 1')
    .get(id) as DesignedVoiceRow | undefined;
  return row ? mapRow(row) : null;
}

export function unlockDesignedVoice(userId: string, voiceId: string): DesignedVoiceRecord | null {
  const id = voiceId.trim();
  if (!userId || !id) return null;
  saveDesignedVoice({ userId, voiceId: id });
  const now = Date.now();
  getDb()
    .prepare(
      `UPDATE designed_voices
       SET unlocked_at = COALESCE(unlocked_at, ?)
       WHERE user_id = ? AND voice_id = ?`
    )
    .run(now, userId, id);
  const row = getDb()
    .prepare('SELECT * FROM designed_voices WHERE user_id = ? AND voice_id = ?')
    .get(userId, id) as DesignedVoiceRow | undefined;
  return row ? mapRow(row) : null;
}

export function isDesignedVoiceUnlocked(userId: string, voiceId: string) {
  const row = getDb()
    .prepare('SELECT unlocked_at FROM designed_voices WHERE user_id = ? AND voice_id = ?')
    .get(userId, voiceId.trim()) as { unlocked_at: number | null } | undefined;
  return Boolean(row?.unlocked_at);
}

export type DesignedVoiceAccess = 'ok' | 'locked' | 'forbidden';

export function getDesignedVoiceAccess(userId: string | null, voiceId: string | undefined): DesignedVoiceAccess {
  if (!voiceId?.trim()) return 'ok';
  const row = findDesignedVoiceByVoiceId(voiceId);
  if (!row) return 'ok';
  if (!userId || row.userId !== userId) return 'forbidden';
  return row.unlockedAt ? 'ok' : 'locked';
}
