import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resetDbForTests } from '@/lib/db/sqlite';
import { createUserWithPassword } from '@/lib/auth/users';
import {
  getDesignedVoiceAccess,
  isDesignedVoiceUnlocked,
  saveDesignedVoice,
  unlockDesignedVoice,
} from '@/lib/billing/designed-voices';

describe('designed voice unlocks', () => {
  afterEach(() => {
    resetDbForTests();
  });

  it('treats a new designed voice as locked until unlocked', async () => {
    process.env.VOXIFY_DB_PATH = path.join(mkdtempSync(path.join(os.tmpdir(), 'voxify-')), 'test.sqlite');
    resetDbForTests();
    const created = await createUserWithPassword({
      email: 'owner@example.com',
      name: '主人',
      password: 'password123',
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    saveDesignedVoice({ userId: created.user.id, voiceId: 'ttv-voice-demo', prompt: '温柔女声' });
    expect(isDesignedVoiceUnlocked(created.user.id, 'ttv-voice-demo')).toBe(false);
    expect(getDesignedVoiceAccess(created.user.id, 'ttv-voice-demo')).toBe('locked');
    expect(getDesignedVoiceAccess(null, 'ttv-voice-demo')).toBe('forbidden');
    expect(getDesignedVoiceAccess(created.user.id, 'system-voice')).toBe('ok');

    unlockDesignedVoice(created.user.id, 'ttv-voice-demo');
    expect(isDesignedVoiceUnlocked(created.user.id, 'ttv-voice-demo')).toBe(true);
    expect(getDesignedVoiceAccess(created.user.id, 'ttv-voice-demo')).toBe('ok');
  });
});
