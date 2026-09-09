import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session-user';
import { unlockDesignedVoice } from '@/lib/billing/designed-voices';

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const voiceId = typeof body.voiceId === 'string' ? body.voiceId.trim() : '';
  if (!voiceId) {
    return NextResponse.json({ error: 'invalid_voice' }, { status: 400 });
  }
  const voice = unlockDesignedVoice(user.id, voiceId);
  if (!voice) {
    return NextResponse.json({ error: 'unlock_failed' }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    voiceId: voice.voiceId,
    unlocked: true,
  });
}
