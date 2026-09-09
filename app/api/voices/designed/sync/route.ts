import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session-user';
import { syncDesignedVoices } from '@/lib/billing/designed-voices';

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const voices = Array.isArray(body.voices) ? body.voices : [];
  syncDesignedVoices(
    user.id,
    voices
      .filter((voice: { voiceId?: unknown }) => typeof voice?.voiceId === 'string')
      .map((voice: { voiceId: string; prompt?: unknown; createdAt?: unknown }) => ({
        voiceId: voice.voiceId,
        prompt: typeof voice.prompt === 'string' ? voice.prompt : '',
        createdAt: typeof voice.createdAt === 'number' ? voice.createdAt : Date.now(),
      }))
  );
  return NextResponse.json({ ok: true });
}
