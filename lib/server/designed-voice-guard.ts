import { NextResponse } from 'next/server';
import { getDesignedVoiceAccess } from '@/lib/billing/designed-voices';
import { getSessionUser } from '@/lib/auth/session-user';

export function voiceIdFromTtsBody(body: unknown) {
  if (!body || typeof body !== 'object') return '';
  const record = body as { voice_id?: unknown; voice_setting?: { voice_id?: unknown } };
  if (typeof record.voice_setting?.voice_id === 'string') return record.voice_setting.voice_id;
  if (typeof record.voice_id === 'string') return record.voice_id;
  return '';
}

export async function rejectLockedDesignedVoice(voiceId: string | undefined) {
  const user = await getSessionUser();
  const access = getDesignedVoiceAccess(user?.id ?? null, voiceId);
  if (access === 'ok') return null;
  if (access === 'locked') {
    return NextResponse.json(
      { error: 'voice_locked', message: '请先解锁这条设计音色。' },
      { status: 402 }
    );
  }
  return NextResponse.json(
    { error: 'voice_forbidden', message: '这条设计音色不属于当前账户。' },
    { status: 403 }
  );
}
